import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { query } from "./src/lib/db.js";
import { hashPassword, comparePassword, generateToken, verifyToken, AuthUser } from "./src/lib/auth_utils.js";
import { ROIEngine } from "./src/services/roiService.js";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import fs from "fs";

// --- VALIDATION SCHEMAS ---
const SignupSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const PinSchema = z.object({
  pin: z.string().length(6).regex(/^\d+$/),
});

const InvestmentSchema = z.object({
  planId: z.string(),
  amount: z.number().positive(),
  roiRate: z.number().positive(),
});

// --- RATE LIMITERS ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: "Too many login/signup attempts. Please try again later." }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 60, // 60 requests per minute
  standardHeaders: 'draft-7',
  validate: { trustProxy: false },
  legacyHeaders: false,
});

// Extend Request to include user
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid token" });
  
  req.user = decoded;
  next();
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", 1);
  app.use(cors());
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(express.json());
  app.use("/api/", apiLimiter);

  // --- PUBLIC AUTH ROUTES ---
  app.post("/api/auth/signup", authLimiter, async (req, res) => {
    try {
      const { fullName, email, password } = SignupSchema.parse(req.body);
      const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rowCount! > 0) return res.status(400).json({ error: "Email already registered" });

      const hashed = await hashPassword(password);
      const userRes = await query(
        "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, role",
        [fullName, email, hashed]
      );
      
      const user = userRes.rows[0];
      await query("INSERT INTO wallets (user_id) VALUES ($1)", [user.id]);
      
      const token = generateToken(user);
      res.json({ token, user });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = LoginSchema.parse(req.body);
      const userRes = await query("SELECT * FROM users WHERE email = $1", [email]);
      if (userRes.rowCount === 0) return res.status(400).json({ error: "Invalid credentials" });

      const user = userRes.rows[0];
      const valid = await comparePassword(password, user.password_hash);
      if (!valid) return res.status(400).json({ error: "Invalid credentials" });

      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      res.json({ token, user: { id: user.id, email: user.email, role: user.role, fullName: user.full_name, hasPin: !!user.transaction_pin } });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- TRANSACTION PIN ---
  app.post("/api/user/set-pin", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { pin } = PinSchema.parse(req.body);
      const hashedPin = await hashPassword(pin);
      await query("UPDATE users SET transaction_pin = $1 WHERE id = $2", [hashedPin, req.user!.id]);
      res.json({ message: "Transaction PIN set successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "PIN must be 6 digits" });
      res.status(500).json({ error: "Failed to set PIN" });
    }
  });

  // --- PRIVATE USER & WALLET ROUTES ---
  app.get("/api/user/profile", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userRes = await query(
        "SELECT u.id, u.full_name, u.email, u.tier, w.balance, w.withdrawable_balance FROM users u JOIN wallets w ON u.id = w.user_id WHERE u.id = $1",
        [req.user!.id]
      );
      res.json(userRes.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // --- INVESTMENT ROUTES ---
  app.post("/api/investments/create", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { planId, amount, roiRate } = InvestmentSchema.parse(req.body);
      const userId = req.user!.id;

      // 1. Check wallet balance
      const walletRes = await query("SELECT balance FROM wallets WHERE user_id = $1", [userId]);
      const balance = parseFloat(walletRes.rows[0].balance);
      
      if (balance < amount) return res.status(400).json({ error: "Insufficient balance" });

      // 2. Transact (Deduct and Create)
      await query("UPDATE wallets SET balance = balance - $1, total_invested = total_invested + $1 WHERE user_id = $2", [amount, userId]);
      
      const invRes = await query(
        "INSERT INTO investments (user_id, plan_id, amount, daily_roi_rate, status) VALUES ($1, $2, $3, $4, 'active') RETURNING *",
        [userId, planId, amount, roiRate]
      );

      await query(
        "INSERT INTO transactions (user_id, type, amount, status, metadata) VALUES ($1, 'investment', $2, 'completed', $3)",
        [userId, amount, JSON.stringify({ investmentId: invRes.rows[0].id, planId })]
      );

      res.json({ message: "Investment activated", investment: invRes.rows[0] });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0].message });
      res.status(500).json({ error: "Investment failed" });
    }
  });

  app.get("/api/investments", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const invs = await query("SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC", [req.user!.id]);
      res.json(invs.rows);
    } catch (err) {
      res.status(500).json({ error: "Fetch failed" });
    }
  });

  // --- DEPOSIT REQUEST ---
  app.post("/api/transactions/deposit", authenticate, async (req: AuthenticatedRequest, res) => {
    const { amount, method, referenceId } = req.body;
    try {
      await query(
        "INSERT INTO transactions (user_id, type, amount, status, reference_id, metadata) VALUES ($1, 'deposit', $2, 'pending', $3, $4)",
        [req.user!.id, amount, referenceId, JSON.stringify({ method })]
      );
      res.json({ message: "Deposit request submitted. Pending audit." });
    } catch (err) {
      res.status(500).json({ error: "Transaction submission failed" });
    }
  });

  // --- ADMIN: USER MANAGEMENT ---
  app.get("/api/admin/users", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const users = await query(
        "SELECT u.id, u.full_name, u.email, u.tier, u.created_at, w.balance, w.total_invested FROM users u JOIN wallets w ON u.id = w.user_id ORDER BY u.created_at DESC"
      );
      res.json(users.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // --- ADMIN: TRANSACTION MANAGEMENT ---
  app.get("/api/admin/transactions/pending", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const txs = await query(
        "SELECT t.*, u.full_name, u.email FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.status = 'pending' ORDER BY t.created_at DESC"
      );
      res.json(txs.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch pending transactions" });
    }
  });

  app.post("/api/admin/transactions/:id/approve", authenticate, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    try {
      const txRes = await query("SELECT * FROM transactions WHERE id = $1", [id]);
      if (txRes.rowCount === 0) return res.status(404).json({ error: "Transaction not found" });
      const tx = txRes.rows[0];
      if (tx.status !== 'pending') return res.status(400).json({ error: "Transaction already processed" });

      if (tx.type === 'deposit') {
        await query("UPDATE wallets SET balance = balance + $1 WHERE user_id = $2", [tx.amount, tx.user_id]);
      }
      await query("UPDATE transactions SET status = 'completed' WHERE id = $1", [id]);
      res.json({ message: "Transaction approved" });
    } catch (err) {
      res.status(500).json({ error: "Approval failed" });
    }
  });

  app.post("/api/admin/transactions/:id/reject", authenticate, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    try {
      await query("UPDATE transactions SET status = 'failed' WHERE id = $1", [id]);
      res.json({ message: "Transaction rejected" });
    } catch (err) {
      res.status(500).json({ error: "Rejection failed" });
    }
  });

  // --- ADMIN: INVESTMENT OVERVIEW ---
  app.get("/api/admin/investments", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const invs = await query(
        "SELECT i.*, u.full_name FROM investments i JOIN users u ON i.user_id = u.id ORDER BY i.created_at DESC"
      );
      res.json(invs.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch investments" });
    }
  });

  // --- ROI ENGINE CONTROL ---
  app.post("/api/admin/trigger-roi", authenticate, async (req: AuthenticatedRequest, res) => {
    // In production, check for admin role: if (req.user?.role !== 'admin') ...
    try {
      const result = await ROIEngine.processDailyDistributions();
      res.json({ message: "Engine pulse successful", ...result });
    } catch (err) {
      res.status(500).json({ error: "Engine failure" });
    }
  });

  // ROI Background Pulse (simulated cron)
  setInterval(() => {
    ROIEngine.processDailyDistributions().catch(err => console.error("Auto ROI Error:", err));
  }, 24 * 60 * 60 * 1000); 

  // --- FIREBASE ADMIN INITIALIZATION ---
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let adminApp: admin.app.App;
  let adminDb: admin.firestore.Firestore;

  try {
    let projectId = "gen-lang-client-0341439865";
    let databaseId = "ai-studio-339400f0-0e07-40fa-bc4e-9fd3d4481de3";
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.projectId) projectId = config.projectId;
      if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
    }
    
    if (admin.apps.length === 0) {
      adminApp = admin.initializeApp({
        projectId: projectId
      });
    } else {
      adminApp = admin.apps[0]!;
    }
    adminDb = getAdminFirestore(adminApp, databaseId);
  } catch (err: any) {
    console.error("Firebase admin init error:", err.message);
  }

  // Firebase Admin Authentication Middleware
  const verifyFirebaseAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const isCipherEmail = [
        'support@tavariwave.network',
        'contact.cga.usa@gmail.com',
        'tavariwavenetwork@gmail.com'
      ].includes(decodedToken.email || '');

      let isCipherRole = false;
      if (adminDb) {
        const userSnap = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (userSnap.exists) {
          const userData = userSnap.data();
          if (userData && (userData.role === 'cipher' || userData.role === 'admin' || userData.role === 'user')) {
            if (userData.role === 'cipher' || userData.role === 'admin') {
              isCipherRole = true;
            }
          }
        }
      }

      if (decodedToken.uid === '3yV3rfcUzob5v9ltfVcMw0PL6tQ2' || isCipherEmail || isCipherRole) {
        (req as any).firebaseUser = decodedToken;
        next();
      } else {
        res.status(403).json({ error: "Forbidden: Not a Cipher admin" });
      }
    } catch (err) {
      console.error("Firebase admin auth failed:", err);
      res.status(401).json({ error: "Unauthorized / Invalid Admin token" });
    }
  };

  // --- NEWSLETTER API ENDPOINTS ---
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ error: "Please enter your email address." });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }

      if (!adminDb) {
        throw new Error("Firestore Admin SDK is not initialized.");
      }

      const cleanEmail = email.trim().toLowerCase();
      // Check if already exists
      const existSnap = await adminDb.collection('newsletter_subscribers')
        .where('email', '==', cleanEmail)
        .limit(1)
        .get();

      if (!existSnap.empty) {
        return res.json({ success: true, message: "Thank you! You are already subscribed to platform insights." });
      }

      await adminDb.collection('newsletter_subscribers').add({
        email: cleanEmail,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, message: "Thank you! You are now subscribed to platform insights." });
    } catch (err: any) {
      console.error("Newsletter subscription error in backend:", err);
      res.status(500).json({ error: "Subscription could not be processed at this time." });
    }
  });

  app.get("/api/admin/newsletter-subscribers", verifyFirebaseAdmin, async (req, res) => {
    try {
      if (!adminDb) {
        return res.status(500).json({ error: "Firestore Admin SDK is not initialized." });
      }
      const snap = await adminDb.collection('newsletter_subscribers')
        .orderBy('created_at', 'desc')
        .get();

      const list = snap.docs.map(doc => {
        const data = doc.data();
        let created_at: any = null;
        if (data.created_at) {
          if (typeof data.created_at.toDate === 'function') {
            created_at = data.created_at.toDate().toISOString();
          } else if (data.created_at._seconds) {
            created_at = new Date(data.created_at._seconds * 1000).toISOString();
          } else {
            created_at = data.created_at;
          }
        }
        return {
          id: doc.id,
          email: data.email,
          created_at
        };
      });

      res.json(list);
    } catch (err: any) {
      console.error("Fetch subscribers error:", err);
      res.status(500).json({ error: "Failed to load newsletter subscribers." });
    }
  });

  // --- BROADCAST ACTIVITY ENDPOINT ---
  app.post("/api/broadcast-activity", async (req, res) => {
    try {
      const { name, flag, actionText, amountText, isAmountPositive } = req.body;
      if (!name || !actionText) {
        return res.status(400).json({ error: "Name and actionText are required" });
      }

      // Format first name and last initial to preserve privacy strictly
      const initials = name.trim().split(/\s+/);
      const first = initials[0] || "";
      const lastInit = initials.length > 1 ? initials[initials.length - 1][0] + "." : "";
      let safeName = `${first} ${lastInit}`.trim();

      const FAMOUS_KEYWORDS = [
        "elon", "musk", "zuckerberg", "dangote", "gates", "bezos", "buffett", "trump", "obama", "biden", "putin", "jinping", "modi"
      ];
      const norm = safeName.toLowerCase();
      for (const keyword of FAMOUS_KEYWORDS) {
        if (norm.includes(keyword)) {
          safeName = "Partner";
          break;
        }
      }

      if (adminDb) {
        try {
          await adminDb.collection("settings").doc("live_activity").set({
            id: Math.random().toString(36).substring(2, 9),
            name: safeName,
            flag: flag || "👤",
            actionText,
            amountText: amountText || null,
            isAmountPositive: isAmountPositive !== undefined ? isAmountPositive : true,
            timestamp: Date.now()
          }, { merge: true });
        } catch (dbErr: any) {
          console.warn("Could not write live activity settings:", dbErr.message);
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      console.warn("Broadcast activity error:", err.message);
      res.json({ success: true, error: err.message });
    }
  });

  // --- GLOBAL ERROR HANDLER ---
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Aura Error] ${req.method} ${req.url}:`, err);
    res.status(err.status || 500).json({ 
      error: "Critical system error", 
      message: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  });

  // API health
  app.get("/api/health", (req, res) => {
    res.json({ status: "Aura Wealth API Core is live", timestamp: new Date().toISOString() });
  });

  // --- AI SUPPORT PROXY ---
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, userName } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || "",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
        You are Wave Assistance, the elite AI-driven support intelligence for the Tavari Wave institutional ecosystem.
        Tavari Wave is a high-frequency algorithmic asset management platform powered by neural networks and institutional-grade liquidity protocols.
        
        Platform Ecosystem Knowledge:
        - Investment Architecture: We offer "Neural Nodes" (Investment Nodes) in tiers: Basic (10-15% ROI), Pro (20-30% ROI), and Institutional Elite (40%+ ROI). These nodes leverage HFT algorithms.
        - Asset Coverage: Real-time access to major Cyber Assets (BTC, ETH, USDT), premium Equities (TSLA, AAPL, NVDA), and Global ETFs.
        - TWN Token: The native utility token for the Tavari Wave Network, used for enhanced yield and governance access.
        - Financial Protocols: Users can perform secure Deposits (Bank Wire & Cyber Transfer) and Withdrawal Settlements.
        - Internal Operations: Support for User-to-User "Quick Transfer" and Wallet-to-Wallet bridging within the platform.
        - Security Matrix: All actions protected by Cipher-grade encryption, Secure Transaction PINs, and the Advanced Cipher Control Panel for administrative audit.
        - Rewards & Ranking: Features a "Top Investors" leaderboard, Referral Rewards, and the Tavari Rewards program.
        
        Tone & Personality: 
        - Professional, precise, and sophisticated. 
        - Use institutional terminology (e.g., "settlement" instead of "payout", "protocol" instead of "feature", "liquidity" instead of "money").
        - Be decisive and helpful. Avoid confusion by providing clear, structured answers.
        
        User Context: 
        - Name: ${userName || 'Client'}
        - Security Level: Standard Protocol
        
        User Query: ${message}
        
        Operating Directive:
        Provide comprehensive answers based on the ecosystem details above. If a query falls outside our protocol limits, professionally suggest they "Initiate a priority ticket" via the support form or contact our "Executive Support Channels" on Telegram/WhatsApp. Always maintain the premium Tavari Wave elite persona.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Proxy Error:", error);
      res.status(500).json({ error: "AI processing failed", message: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      try {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, "utf8");
          
          // Construct the fully-qualified absolute URL dynamically
          const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
          const host = req.get('host') || 'tavariwave.online';
          const baseUrl = `${protocol}://${host}`;
          const imageUrl = `${baseUrl}/share-preview.jpg?v=2`;
          
          // Replace placeholders with dynamic absolute image URL
          html = html.replace(/__SOCIAL_SHARE_IMAGE_URL__/g, imageUrl);
          
          res.setHeader("Content-Type", "text/html");
          return res.send(html);
        }
      } catch (err) {
        console.error("Error serving dynamic index.html:", err);
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\x1b[32m[Aura Wealth]\x1b[0m Core API running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical Server Failure:", err);
});


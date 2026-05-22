/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Homepage from './components/Homepage';
import Dashboard from './components/Dashboard';
import Invest from './components/Invest';
import Fund from './components/Fund';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Support from './components/Support';
import Referrals from './components/Referrals';
import Rewards from './components/Rewards';
import CipherAdmin from './components/Admin/CipherAdmin';
import LandingPage from './components/LandingPage';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import TopInvestorsPage from './components/TopInvestorsPage';
import ReviewsPage from './components/ReviewsPage';
import NotificationsPage from './components/NotificationsPage';
import MarketTickers from './components/FooterPages/MarketTickers';
import StrategicNodes from './components/FooterPages/StrategicNodes';
import FAQ from './components/FAQ';
import About from './components/About';
import HowItWorks from './components/HowItWorks';
import Partners from './components/Partners';
import LiquidityPools from './components/FooterPages/LiquidityPools';
import NeuralAnalytics from './components/FooterPages/NeuralAnalytics';
import CookiePolicy from './components/FooterPages/CookiePolicy';
import AMLPolicy from './components/FooterPages/AMLPolicy';
import TWNTokenPortal from './components/TWNTokenPortal';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { UIProvider } from './contexts/UIContext';
import { UIConfigProvider } from './contexts/UIConfigContext';

function PremiumLoader() {
  return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-[#10B981]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-[#A855F7]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center">
        {/* SVG Circle Loader with Solid / Dotted segments that rotate */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Rotating Dotted Ring */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="2 6"
              strokeOpacity="0.4"
              className="origin-center"
            />
          </svg>

          {/* Rotating Solid Ring */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#A855F7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="40 180"
              strokeOpacity="0.8"
              className="origin-center"
            />
          </svg>

          {/* Website Logo in center with elegant blinking/fade animation */}
          <div className="absolute w-14 h-14 flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
            <img 
              src="https://i.imgur.com/wU33xy3.png" 
              alt="Wave Logo" 
              className="w-10 h-10 object-contain brightness-110"
            />
          </div>
        </div>

        {/* Premium Minimal Text */}
        <div className="mt-6 text-center">
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 italic font-sans antialiased animate-pulse">
            Ecosystem Loading
          </span>
        </div>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PremiumLoader />;
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  if (profile?.suspended || profile?.banned) {
    // If user is banned/suspended, they are forced back to welcome
    // The LandingPage should probably show a notice if we want, or just generic rejection
    return <Navigate to="/welcome" state={{ error: 'Account access has been restricted by System Protocol.' }} replace />;
  }

  // Check if we just came from a successful login that reloaded the user
  const isVerifiedFromState = location.state?.verified === true;

  if (!user.emailVerified && !isVerifiedFromState) {
     return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}

function CipherProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <PremiumLoader />;
  }

  const CIPHER_UID = '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';
  const CIPHER_EMAIL = 'support@tavariwave.network';
  const OLD_CIPHER_EMAIL = 'contact.cga.usa@gmail.com';
  
  const isCipher = user?.uid === CIPHER_UID || user?.email === CIPHER_EMAIL || user?.email === OLD_CIPHER_EMAIL || profile?.role === 'cipher';

  if (!user || !isCipher) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <LanguageProvider>
        <AuthProvider>
          <UIConfigProvider>
            <UIProvider>
              <Toaster position="top-right" theme="dark" closeButton richColors />
              <Routes>
              <Route path="/welcome" element={<LandingPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/top-investors" element={<TopInvestorsPage />} />
              <Route path="/token" element={<TWNTokenPortal />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cipher" element={
                <CipherProtectedRoute>
                  <CipherAdmin />
                </CipherProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/home" element={<Homepage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/invest" element={<Invest />} />
                <Route path="/fund" element={<Fund />} />
                <Route path="/fund/:tab" element={<Fund />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/:tab" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/referrals" element={<Referrals />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/help" element={<Support />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/about" element={<About />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/markets" element={<MarketTickers />} />
                <Route path="/nodes" element={<StrategicNodes />} />
                <Route path="/pools" element={<LiquidityPools />} />
                <Route path="/neural-analytics" element={<NeuralAnalytics />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/aml" element={<AMLPolicy />} />
              </Route>
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </UIProvider>
        </UIConfigProvider>
      </AuthProvider>
    </LanguageProvider>
    </Router>
  );
}


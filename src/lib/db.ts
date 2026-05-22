import { Pool } from 'pg';

/**
 * DATABASE CONFIGURATION
 * Provide your PostgreSQL connection string in .env as DATABASE_URL
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;

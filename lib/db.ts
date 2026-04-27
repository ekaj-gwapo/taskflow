import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/Neon in some environments
  }
});

// Helper to convert SQLite '?' placeholders to PostgreSQL '$1, $2...' placeholders
const convertPlaceholders = (text: string) => {
  let count = 1;
  return text.replace(/\?/g, () => `$${count++}`);
};

export const db = {
  async query(text: string, params?: any[]) {
    try {
      const result = await pool.query(convertPlaceholders(text), params);
      return { rows: result.rows };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  async execute(text: string, params?: any[]) {
    try {
      const result = await pool.query(convertPlaceholders(text), params);
      return { lastID: null, changes: result.rowCount }; 
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  },

  async getOne(text: string, params?: any[]) {
    try {
      const result = await pool.query(convertPlaceholders(text), params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Database getOne error:', error);
      throw error;
    }
  },

  async getAll(text: string, params?: any[]) {
    try {
      const result = await pool.query(convertPlaceholders(text), params);
      return result.rows;
    } catch (error) {
      console.error('Database getAll error:', error);
      throw error;
    }
  },
};

export default db;

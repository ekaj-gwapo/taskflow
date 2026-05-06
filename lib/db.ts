import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/Neon in some environments
  }
});

// UUID v4 regex used to detect UUID parameters and cast them appropriately
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Converts SQLite '?' placeholders to PostgreSQL '$1, $2...' placeholders.
 * If a corresponding param value looks like a UUID, appends '::uuid' so that
 * PostgreSQL does not throw "operator does not exist: text = uuid".
 */
const convertPlaceholders = (text: string, params?: any[]) => {
  let count = 1;
  return text.replace(/\?/g, () => {
    const index = count - 1;
    const placeholder = `$${count++}`;
    if (params && index < params.length && typeof params[index] === 'string' && UUID_REGEX.test(params[index])) {
      return `${placeholder}::uuid`;
    }
    return placeholder;
  });
};

export const db = {
  async query(text: string, params?: any[]) {
    try {
      const result = await pool.query(convertPlaceholders(text, params), params);
      return { rows: result.rows };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  async execute(text: string, params?: any[]) {
    try {
      const result = await pool.query(convertPlaceholders(text, params), params);
      return { lastID: null, changes: result.rowCount };
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  },

  async getOne(text: string, params?: any[]) {
    try {
      const result = await pool.query(convertPlaceholders(text, params), params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Database getOne error:', error);
      throw error;
    }
  },

  async getAll(text: string, params?: any[]) {
    try {
      const result = await pool.query(convertPlaceholders(text, params), params);
      return result.rows;
    } catch (error) {
      console.error('Database getAll error:', error);
      throw error;
    }
  },
};

export default db;

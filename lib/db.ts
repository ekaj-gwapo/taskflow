import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Translates SQLite style '?' placeholders to PostgreSQL '$1, $2' placeholders
 */
function translateQuery(text: string, params: any[]): { text: string; params: any[] } {
  let index = 1;
  const translatedText = text.replace(/\?/g, () => `$${index++}`);
  return { text: translatedText, params };
}

export const db = {
  async query(text: string, params?: any[]) {
    try {
      const { text: translatedText, params: translatedParams } = translateQuery(text, params || []);
      const result = await pool.query(translatedText, translatedParams);
      return { rows: result.rows };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  async execute(text: string, params?: any[]) {
    try {
      const { text: translatedText, params: translatedParams } = translateQuery(text, params || []);
      const result = await pool.query(translatedText, translatedParams);
      return { lastID: null, changes: result.rowCount };
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  },

  async getOne(text: string, params?: any[]) {
    try {
      const { text: translatedText, params: translatedParams } = translateQuery(text, params || []);
      const result = await pool.query(translatedText, translatedParams);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Database getOne error:', error);
      throw error;
    }
  },

  async getAll(text: string, params?: any[]) {
    try {
      const { text: translatedText, params: translatedParams } = translateQuery(text, params || []);
      const result = await pool.query(translatedText, translatedParams);
      return result.rows;
    } catch (error) {
      console.error('Database getAll error:', error);
      throw error;
    }
  },
};

export default db;


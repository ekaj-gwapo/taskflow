import sqlite3 from 'sqlite3';
import path from 'path';
import { promisify } from 'util';
import { Pool } from 'pg';

const dbUrl = process.env.DATABASE_URL || 'local.db';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

let sqlite: sqlite3.Database;
let dbRun: any, dbGet: any, dbAll: any;
let pgPool: Pool;

if (isPostgres) {
  pgPool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false } // Required for external connections like Vercel -> Supabase
  });
} else {
  const dbPath = path.resolve(process.cwd(), dbUrl);
  sqlite = new sqlite3.Database(dbPath);
  dbRun = promisify(sqlite.run.bind(sqlite));
  dbGet = promisify(sqlite.get.bind(sqlite));
  dbAll = promisify(sqlite.all.bind(sqlite));
}

// Convert sqlite positional parameters (?) to postgres positional parameters ($1, $2, etc.)
function formatQuery(text: string): string {
  if (!isPostgres) return text;
  let paramIndex = 1;
  return text.replace(/\?/g, () => `$${paramIndex++}`);
}

export const db = {
  async query(text: string, params?: any[]) {
    try {
      if (isPostgres) {
        const result = await pgPool.query(formatQuery(text), params || []);
        return { rows: result.rows };
      } else {
        const rows = await dbAll(text, params || []);
        return { rows };
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  async execute(text: string, params?: any[]) {
    try {
      if (isPostgres) {
        const result = await pgPool.query(formatQuery(text), params || []);
        return result;
      } else {
        const result = await dbRun(text, params || []);
        return result;
      }
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  },

  async getOne(text: string, params?: any[]) {
    try {
      if (isPostgres) {
        const result = await pgPool.query(formatQuery(text), params || []);
        return result.rows[0] || null;
      } else {
        const row = await dbGet(text, params || []);
        return row || null;
      }
    } catch (error) {
      console.error('Database getOne error:', error);
      throw error;
    }
  },

  async getAll(text: string, params?: any[]) {
    try {
      if (isPostgres) {
        const result = await pgPool.query(formatQuery(text), params || []);
        return result.rows;
      } else {
        const rows = await dbAll(text, params || []);
        return rows;
      }
    } catch (error) {
      console.error('Database getAll error:', error);
      throw error;
    }
  },
};

export default db;


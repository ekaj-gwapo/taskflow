import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_URL || 'local.db');
const sqlite = new sqlite3.Database(dbPath);

const dbRun = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    sqlite.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    sqlite.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    sqlite.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const db = {
  async query(text: string, params?: any[]) {
    try {
      const rows = await dbAll(text, params || []);
      return { rows };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  async execute(text: string, params?: any[]) {
    try {
      const result = await dbRun(text, params || []);
      return result;
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  },

  async getOne(text: string, params?: any[]) {
    try {
      const row = await dbGet(text, params || []);
      return row || null;
    } catch (error) {
      console.error('Database getOne error:', error);
      throw error;
    }
  },

  async getAll(text: string, params?: any[]) {
    try {
      const rows = await dbAll(text, params || []);
      return rows;
    } catch (error) {
      console.error('Database getAll error:', error);
      throw error;
    }
  },
};

export default db;

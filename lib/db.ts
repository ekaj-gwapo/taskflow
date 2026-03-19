import sqlite3 from 'sqlite3';
import path from 'path';
import { promisify } from 'util';

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_URL || 'local.db');
const sqlite = new sqlite3.Database(dbPath);

// Promisify sqlite3 methods
const dbRun = promisify(sqlite.run.bind(sqlite));
const dbGet = promisify(sqlite.get.bind(sqlite));
const dbAll = promisify(sqlite.all.bind(sqlite));

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


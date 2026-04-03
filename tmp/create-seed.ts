import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';

const db = new sqlite3.Database('local.db');
const dbAll = promisify(db.all.bind(db)) as (sql: string) => Promise<any[]>;

const escape = (val: any) => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  // Use a string representation for everything else and escape single quotes
  return "'" + String(val).replace(/'/g, "''") + "'";
};

async function run() {
  const tables = ['users', 'tasks', 'action_steps', 'step_notes', 'progress_notes', 'task_assignments'];
  let sql = '-- Supabase Seed Data from local.db\n\n';
  
  for (const table of tables) {
    console.log(`Processing table: ${table}...`);
    try {
      const rows = await dbAll(`SELECT * FROM ${table}`);
      if (!rows || rows.length === 0) {
        console.log(`  Table ${table} is empty, skipping.`);
        continue;
      }
      
      sql += `-- Table: ${table}\n`;
      const keys = Object.keys(rows[0]);
      
      for (const row of rows) {
        // Handle boolean conversions from SQLite (0/1) to Postgres-friendly booleans
        if (table === 'users' && 'isActive' in row && row.isActive !== null) {
          row.isActive = Boolean(row.isActive);
        }
        if (table === 'action_steps' && 'completed' in row && row.completed !== null) {
          row.completed = Boolean(row.completed);
        }
        
        // Ensure values are extracted in the same order as columns (keys)
        const values = keys.map(k => row[k]).map(escape);
        const columns = keys.map(k => `"${k}"`).join(', ');
        const vals = values.join(', ');
        
        sql += `INSERT INTO public.${table} (${columns}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
      }
      sql += '\n';
      console.log(`  Table ${table}: ${rows.length} rows processed.`);
    } catch (e: any) {
      console.error(` Error processing table ${table}:`, e.message);
    }
  }
  
  fs.writeFileSync('supabase/seed.sql', sql);
  console.log('\nSuccessfully generated supabase/seed.sql');
  db.close();
}

run();

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  // List all tables
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' ORDER BY table_name
  `);
  console.log("=== TABLES ===");
  tables.rows.forEach(r => console.log(" -", r.table_name));

  // List users columns
  const userCols = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'users' ORDER BY ordinal_position
  `);
  console.log("\n=== USERS COLUMNS ===");
  userCols.rows.forEach(r => console.log(` ${r.column_name} (${r.data_type}) nullable=${r.is_nullable}`));

  // List tasks columns
  const taskCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' ORDER BY ordinal_position
  `);
  console.log("\n=== TASKS COLUMNS ===");
  taskCols.rows.forEach(r => console.log(` ${r.column_name} (${r.data_type})`));

  await pool.end();
}

inspect().catch(err => { console.error(err); pool.end(); });

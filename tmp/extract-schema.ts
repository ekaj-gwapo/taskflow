import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';

const db = new sqlite3.Database('local.db');
const dbAll = promisify(db.all.bind(db));

async function run() {
  const rows = await dbAll("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const output = rows.map((r: any) => r.sql + ';\n').join('\n');
  fs.writeFileSync('tmp/schema.sql', output);
  db.close();
}
run();

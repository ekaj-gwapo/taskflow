import db from "../lib/db";

async function check() {
  try {
    const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'activity_logs'");
    console.log("Activity Logs Columns:", res.rows.map((row: any) => row.column_name));
    
    const res2 = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables:", res2.rows.map((row: any) => row.table_name));
  } catch (error) {
    console.error("Check failed:", error);
  }
  process.exit(0);
}

check();

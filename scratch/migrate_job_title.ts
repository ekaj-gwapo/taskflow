import db from "./lib/db";

async function migrate() {
  console.log("Running migration to add jobTitle column...");
  try {
    // Check if column exists (Postgres)
    const checkColumn = await db.getOne(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='jobtitle';
    `);

    if (!checkColumn) {
      await db.execute(`ALTER TABLE users ADD COLUMN jobTitle TEXT;`);
      console.log("Column 'jobTitle' added successfully.");
    } else {
      console.log("Column 'jobTitle' already exists.");
    }
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();

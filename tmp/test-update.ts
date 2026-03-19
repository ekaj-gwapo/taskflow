import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

// Promisify sqlite3 methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));

async function testUpdate() {
    // 1. Get a task
    const task = await dbGet("SELECT * FROM tasks LIMIT 1") as any;
    if (!task) {
        console.log("No tasks found to test update.");
        db.close();
        return;
    }

    console.log("Current status:", task.status);

    // 2. Simulate update to IN_PROGRESS
    const status = "in-progress";
    const dbStatus = status ? status.toUpperCase().replace('-', '_') : null;
    const priority = null;
    const completedAt = null;

    console.log("Updating to:", dbStatus);

    await dbRun(`
      UPDATE tasks
      SET status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          completedAt = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [dbStatus, priority, completedAt || task.completedAt, task.id]);

    // 3. Verify
    const updatedTask = await dbGet("SELECT * FROM tasks WHERE id = ?", [task.id]) as any;
    console.log("Updated status:", updatedTask.status);

    if (updatedTask.status === "IN_PROGRESS") {
        console.log("SUCCESS: Task status updated.");
    } else {
        console.log("FAILURE: Task status not updated.");
    }

    db.close();
}

testUpdate().catch(console.error);

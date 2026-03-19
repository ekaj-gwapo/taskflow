const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

// Promisify sqlite3 methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));

async function testUpdate() {
    try {
        // 1. Get a task
        const task = await dbGet("SELECT * FROM tasks LIMIT 1");
        if (!task) {
            console.log("No tasks found to test update.");
            db.close();
            return;
        }

        console.log("Current ID:", task.id);
        console.log("Current status:", task.status);

        // 2. Simulate update to IN_PROGRESS
        const status = "in-progress";
        const dbStatus = status ? status.toUpperCase().replace('-', '_') : null;
        const priority = null;
        const completedAt = null;

        console.log("Updating to:", dbStatus);

        const result = await dbRun(`
          UPDATE tasks
          SET status = COALESCE(?, status),
              priority = COALESCE(?, priority),
              completedAt = ?,
              updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [dbStatus, priority, completedAt || task.completedAt, task.id]);

        console.log("Changes made:", result.changes);

        // 3. Verify
        const updatedTask = await dbGet("SELECT * FROM tasks WHERE id = ?", [task.id]);
        console.log("Updated status:", updatedTask.status);

        if (updatedTask.status === dbStatus) {
            console.log("SUCCESS: Task status updated.");
        } else {
            console.log("FAILURE: Task status not updated.");
        }

        db.close();
    } catch (error) {
        console.error("DEBUG ERROR:", error);
        db.close();
    }
}

testUpdate();

testUpdate();

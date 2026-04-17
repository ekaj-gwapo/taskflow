CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'EMPLOYEE',
      phone TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    , avatarUrl TEXT, location TEXT, isActive INTEGER DEFAULT 1);

CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'MEDIUM',
      status TEXT DEFAULT 'TODO',
      dueDate DATETIME,
      assigneeId TEXT,
      createdById TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, completedAt DATETIME, delegatedById TEXT REFERENCES users(id), delegatedAt TEXT,
      FOREIGN KEY (assigneeId) REFERENCES users(id),
      FOREIGN KEY (createdById) REFERENCES users(id)
    );

CREATE TABLE action_steps (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      isActed BOOLEAN DEFAULT 0,
      taskId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS step_notes (
  id TEXT PRIMARY KEY,
  stepId TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  authorName TEXT NOT NULL,
  attachmentUrl TEXT,
  attachmentName TEXT,
  attachmentType TEXT,
  FOREIGN KEY (stepId) REFERENCES action_steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entityId TEXT NOT NULL,
  entityType TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  details TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE progress_notes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      taskId TEXT NOT NULL,
      authorId TEXT,
      authorName TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    );

CREATE TABLE task_assignments (
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      PRIMARY KEY (taskId, userId),
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

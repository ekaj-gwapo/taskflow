-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'EMPLOYEE',
  phone TEXT,
  location TEXT,
  avatarUrl TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'emerald',
  mode TEXT DEFAULT 'light',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'TODO',
  dueDate TIMESTAMP WITH TIME ZONE,
  assigneeId UUID REFERENCES users(id),
  createdById UUID REFERENCES users(id),
  delegatedById UUID REFERENCES users(id),
  delegatedAt TIMESTAMP WITH TIME ZONE,
  completedAt TIMESTAMP WITH TIME ZONE,
  archived BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Action Steps Table
CREATE TABLE IF NOT EXISTS action_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taskId UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  isActed BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Step Notes Table
CREATE TABLE IF NOT EXISTS step_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stepId UUID NOT NULL REFERENCES action_steps(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  authorName TEXT NOT NULL,
  attachmentUrl TEXT,
  attachmentName TEXT,
  attachmentType TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taskId UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  authorId UUID REFERENCES users(id),
  authorName TEXT,
  content TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Progress Notes Table
CREATE TABLE IF NOT EXISTS progress_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taskId UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  authorId UUID REFERENCES users(id),
  authorName TEXT,
  content TEXT NOT NULL,
  attachmentUrl TEXT,
  attachmentName TEXT,
  attachmentType TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Task Assignments (Multi-assignee support)
CREATE TABLE IF NOT EXISTS task_assignments (
  taskId UUID REFERENCES tasks(id) ON DELETE CASCADE,
  userId UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  PRIMARY KEY (taskId, userId)
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Extension Requests Table
CREATE TABLE IF NOT EXISTS extension_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taskId UUID NOT NULL REFERENCES tasks(id),
  requestedById UUID NOT NULL REFERENCES users(id),
  requestedByName TEXT NOT NULL,
  currentDueDate TIMESTAMP WITH TIME ZONE NOT NULL,
  proposedDueDate TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reviewedById UUID REFERENCES users(id),
  reviewedByName TEXT,
  reviewerRemark TEXT,
  reviewedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entityId TEXT NOT NULL,
  entityType TEXT NOT NULL,
  userId UUID NOT NULL,
  userName TEXT NOT NULL,
  details JSONB,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

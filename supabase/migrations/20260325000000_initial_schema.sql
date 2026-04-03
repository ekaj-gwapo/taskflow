CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'EMPLOYEE',
  phone TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "avatarUrl" TEXT,
  location TEXT,
  "isActive" BOOLEAN DEFAULT true
);

CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'TODO',
  "dueDate" TIMESTAMP WITH TIME ZONE,
  "assigneeId" TEXT REFERENCES public.users(id),
  "createdById" TEXT REFERENCES public.users(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "delegatedById" TEXT REFERENCES public.users(id),
  "delegatedAt" TEXT
);

CREATE TABLE public.action_steps (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  "taskId" TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.step_notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  "stepId" TEXT NOT NULL REFERENCES public.action_steps(id) ON DELETE CASCADE,
  "authorId" TEXT REFERENCES public.users(id),
  "authorName" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.progress_notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  "taskId" TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  "authorId" TEXT REFERENCES public.users(id),
  "authorName" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.task_assignments (
  "taskId" TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  PRIMARY KEY ("taskId", "userId")
);

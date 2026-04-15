# TaskFlow Task Tracking System Presentation Guide

## Slide 1: Title
**TaskFlow: A Task Tracking System**

Speaker notes:
This system is not an RCI system. It is a task tracking system designed to assign work, monitor progress, manage collaboration, and track completion across different user roles.

## Slide 2: System Overview
**What the system does**

- Centralizes task assignment and monitoring
- Supports individual tasks and team tasks
- Tracks action steps inside each task
- Records progress notes and step notes
- Uses role-based access for security
- Helps management monitor workload, urgency, and completion

Speaker notes:
The main goal of the system is to make task management visible from assignment up to completion. It allows administrators to create and manage tasks, while employees update progress and complete assigned work.

## Slide 3: Core Logic of the System
**Main workflow**

1. A higher-level user creates a task.
2. The task is assigned to one employee or a team.
3. Optional action steps are added to break the task into smaller actions.
4. The assignee starts the task by changing the status.
5. While working, the assignee adds progress notes and step notes.
6. Action steps are completed one by one.
7. The task can only be marked completed when all action steps are finished.
8. The system records completion time and updates points.

Speaker notes:
The logic is built to enforce accountability. A task does not jump directly from creation to completion without progress. If action steps exist, all of them must be completed first before the whole task can be marked as completed.

## Slide 4: Main Data Structure
**What the system stores**

- Users
- Tasks
- Task assignees
- Action steps
- Step notes
- Progress notes
- Weekly reports
- Delegation history
- Points per assignee

Speaker notes:
Each task contains title, description, status, priority, due date, creator, assignee or assignees, action steps, and progress notes. This gives both management and employees a full picture of the work.

## Slide 5: User Roles
**Users in the system**

- Super Admin
- Head Admin
- Admin
- Employee

Speaker notes:
The system is role-based. Not every user sees the same screens or can do the same actions. This is one of the strongest parts of the system because it protects data and keeps responsibilities clear.

## Slide 6: Super Admin Features
**Super Admin actions**

- Accesses the user management module
- Creates new user accounts
- Assigns user roles
- Views the full user directory
- Resets passwords
- Activates or deactivates accounts
- Can also access admin-level task data through admin-protected APIs

Speaker notes:
The Super Admin is focused on system control. This role is mainly for managing users and access. It is the highest control level in the platform.

## Slide 7: Head Admin Features
**Head Admin actions**

- Views all tasks across the system
- Opens the dashboard for overall monitoring
- Creates tasks
- Assigns or reassigns tasks
- Updates task priority
- Views team projects
- Views employee-specific task lists
- Deletes tasks
- Opens weekly reports

Speaker notes:
The Head Admin is a high-level task manager. This user can oversee operations and distribute work. Unlike employees, this role is focused more on control and supervision.

## Slide 8: Admin Features
**Admin actions**

- Views all tasks
- Creates tasks
- Assigns tasks to one person or multiple users
- Can delegate tasks to others
- Reassigns tasks
- Updates task priority
- Can update task status only if also assigned to that task
- Views own assigned tasks
- Views tasks delegated by them
- Deletes tasks they created
- Adds or deletes action steps when acting as a manager
- Views weekly reports and dashboard analytics

Speaker notes:
The Admin role is both manager and possible worker. If the admin is assigned to a task, the system treats that admin like a worker for that task. Because of that, there are restrictions on changing certain parts of the task while they are acting as an assignee.

## Slide 9: Employee Features
**Employee actions**

- Logs in and sees only assigned tasks
- Views individual tasks assigned only to them
- Views team tasks where they are part of the group
- Opens task details
- Changes task status
- Checks off action steps
- Adds notes to action steps
- Adds progress notes while the task is in progress
- Tracks due dates and overdue tasks
- Sees new task indicators
- Updates own profile information partially

Speaker notes:
Employees are limited to their own assigned work. They cannot create tasks, delete tasks, or view other employees' tasks. This keeps the system secure and focused.

## Slide 10: Task Creation Logic
**How a task is created**

- Admin, Head Admin, or Super Admin creates the task
- Inputs title, description, priority, due date, and assignee
- Can choose individual assignment or team assignment
- Can add action steps during creation
- System checks employee workload
- If an employee already has 5 active tasks, the interface marks them as overloaded

Speaker notes:
This is important because the system does not just assign work blindly. It considers workload, which helps prevent overloading employees.

## Slide 11: Task Status Logic
**Task statuses**

- To Do
- In Progress
- Completed

Rules:
- Employees can change the status of their own tasks
- Admins and Head Admins can only change status if they are assigned to the task
- A task cannot be marked completed if there are incomplete action steps
- When completed, the system records the completion time

Speaker notes:
This logic prevents false completion. The system requires the actual steps to be done first before the final task can be closed.

## Slide 12: Action Steps Logic
**Why action steps matter**

- Break a task into smaller measurable actions
- Make progress easier to monitor
- Employees complete steps one by one
- Employees can add notes per step
- Administrators can add or delete steps when not acting as the assignee
- Step completion is visible in progress bars

Speaker notes:
A task can be large, so action steps make it manageable. For example, instead of one task saying "Prepare and send letter," the system can split it into drafting, reviewing, printing, and sending.

## Slide 13: Progress Notes and Step Notes
**Two kinds of updates**

- Progress notes:
  General updates for the whole task
- Step notes:
  Specific updates for one action step

Speaker notes:
This gives two levels of documentation. Progress notes explain the overall task movement, while step notes explain what happened inside a specific action.

## Slide 14: Reminder Logic
**Follow-up mechanism**

- If a task is in progress, the system checks the latest progress note
- If no recent note exists, the UI warns that a progress note is due
- Reminder threshold is 30 minutes in the employee task view

Speaker notes:
This encourages regular updates. It helps avoid silent delays because employees are reminded to record progress while work is ongoing.

## Slide 15: Delegation Logic
**How delegation works**

- Admin can reassign a task to another user
- When admin reassigns, the system records:
  - who delegated the task
  - when the delegation happened
- Delegated tasks appear in the admin’s delegated view
- Head Admin and Super Admin can reassign without keeping admin-style delegation markers

Speaker notes:
Delegation creates accountability. The system does not only show who currently owns the task, but can also show that the task was passed from one person to another.

## Slide 16: Points and Performance Logic
**How points are calculated**

- Base points depend on priority:
  - Low = 4
  - Medium = 7
  - High = 10
- Extra points are added for early completion
- Deductions are applied for late completion
- Final points are limited to a valid range
- Points are shown beside assignees

Speaker notes:
The points system adds performance measurement to task tracking. It rewards early completion and reduces points for late completion, making the system more objective.

## Slide 17: Dashboards and Monitoring
**Management dashboard features**

- Task statistics cards
- Workload distribution
- Top completers chart
- Recently completed tasks
- Urgent tasks section
- Search and filter tools
- Employee-specific task views
- Team project views
- Weekly reporting panel

Speaker notes:
The dashboard is designed for monitoring. It helps management quickly see who has many tasks, which tasks are urgent, and which users are completing the most work.

## Slide 18: Employee Dashboard
**Employee view**

- My Tasks category
- Team Tasks category
- Task counters by status
- Urgent task list
- Detailed task panel
- New task indicators
- Due date visibility
- Progress note reminders

Speaker notes:
The employee dashboard is simplified compared to the admin dashboard. It focuses only on the employee’s own workload so they can act on tasks immediately.

## Slide 19: Weekly Reports
**Reporting feature**

- Shows completed, in-progress, to-do, and overdue totals
- Allows written weekly summary reports
- Stores past reports for review

Speaker notes:
This gives management a quick summary of weekly performance and gives users a place to document accomplishments and issues.

## Slide 20: Security and Access Control
**How the system protects data**

- Login required with JWT token authentication
- Passwords are encrypted
- Employees can only view assigned tasks
- Employees cannot access other employees’ tasks
- Admin-only routes protect management actions
- User activation and deactivation controls access

Speaker notes:
This is one of the most important parts to mention. The system is not just a task list. It has access control, meaning users only see and do what their role allows.

## Slide 21: Why this system is effective
**Key strengths**

- Clear task ownership
- Structured task breakdown through action steps
- Real-time task progress updates
- Role-based accountability
- Performance visibility through points and reports
- Better monitoring of urgent and overdue work
- Supports both solo work and team collaboration

Speaker notes:
The strength of the system is that it combines assignment, monitoring, accountability, and reporting in one place.

## Slide 22: Closing Statement
**Conclusion**

TaskFlow is a role-based task tracking system that helps organizations assign tasks, monitor progress, document work, manage users, and measure completion performance in a secure and structured way.

Speaker notes:
If we explain it simply, this system helps management assign and monitor work, while helping employees track and complete tasks step by step.

---

## Short Version for Oral Presentation

If you need a faster explanation during the presentation, you can say:

"This project is a task tracking system called TaskFlow. It is used to assign tasks, break them into action steps, monitor progress, and control access depending on the user role. Super Admin manages users, Head Admin and Admin manage tasks and assignments, and Employees complete assigned work, update progress, and finish action steps. The system also tracks delegation, overdue work, weekly reports, and performance points based on priority and completion time."

## Q&A Guide

### If asked: Why is it not RCI?
You can answer:
This system is not designed for request routing or incident classification. Its main purpose is task assignment, task monitoring, step-by-step execution, and performance tracking.

### If asked: What is the difference between a task and an action step?
You can answer:
A task is the main work item, while an action step is a smaller part of that task. The action steps help users complete the task in a structured way.

### If asked: Why are there different user roles?
You can answer:
The roles separate responsibility and protect information. Higher roles manage users and tasks, while employees focus only on the tasks assigned to them.

### If asked: How does the system measure performance?
You can answer:
It uses points based on task priority, then adjusts the score depending on whether the task was completed early or late.

### If asked: What makes the system secure?
You can answer:
It uses login authentication, encrypted passwords, token-based sessions, role-based access control, and account activation or deactivation.

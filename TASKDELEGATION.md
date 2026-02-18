📘 PRODUCT REQUIREMENTS DOCUMENT

Feature: Task Delegation & Execution System

Product: Boards
Version: 1.0 (Delegation Layer Release)

⸻

1. PRODUCT OVERVIEW

Boards is a thinking-first spatial workflow tool.

This feature enables users (CEOs / Managers) to move from:
Idea → Delegated Execution in under 2 minutes

Core principle:
Delegation must happen inside the thinking environment without mode switching.

⸻

2. OBJECTIVES

Primary Objective

Enable Bord owners to assign tasks directly from:
	•	Flow cards
	•	Checklist items
	•	Kanban board items

And deploy them to employees via a structured Draft → Publish model.

Secondary Objective

Provide a lightweight execution interface for employees that removes friction and cognitive overload.

⸻

3. ROLE SYSTEM

3.1 User Roles

1. Bord Owner
	•	Full control
	•	Can invite collaborators
	•	Can assign tasks
	•	Can publish
	•	Can manage employees

2. Collaborator

Two types:
	•	Viewer
	•	Editor

Collaborators:
	•	Can access the Bord
	•	Cannot publish unless explicitly allowed
	•	Cannot manage employees unless permitted

3. Employee
	•	Does NOT access main Bord canvas
	•	Receives assigned tasks
	•	Accesses Execution Inbox only
	•	Can mark tasks complete

⸻

4. SYSTEM ARCHITECTURE

4.1 Core Models

User
	•	id
	•	email
	•	name
	•	role_type (owner, collaborator, employee)
	•	created_at

⸻

Organization
	•	id
	•	name
	•	owner_id
	•	created_at

(Employees are tied to organizations, not individual Bords.)

⸻

Bord
	•	id
	•	organization_id
	•	title
	•	is_public (default: false)
	•	last_published_at (nullable)
	•	created_at
	•	updated_at

⸻

BordMember
	•	id
	•	bord_id
	•	user_id
	•	role (viewer, editor)
	•	created_at

⸻

EmployeeMembership
	•	id
	•	organization_id
	•	user_id
	•	created_at

⸻

Card (Flow Card)
	•	id
	•	bord_id
	•	content
	•	position_x
	•	position_y
	•	state (draft | published)
	•	created_at
	•	updated_at

⸻

ChecklistItem
	•	id
	•	parent_card_id
	•	content
	•	created_at

⸻

KanbanColumn
	•	id
	•	bord_id
	•	title
	•	order_index

⸻

KanbanTask
	•	id
	•	column_id
	•	content
	•	created_at

⸻

TaskAssignment
	•	id
	•	source_type (card | checklist | kanban)
	•	source_id
	•	assigned_to (employee_user_id)
	•	priority (low | normal | high) [optional]
	•	due_date (nullable)
	•	execution_note (nullable)
	•	status (assigned | completed)
	•	created_at
	•	completed_at (nullable)

⸻

PublishSnapshot
	•	id
	•	bord_id
	•	version_number
	•	published_at
	•	published_by

⸻

UnpublishedChangeTracker
	•	id
	•	bord_id
	•	change_count
	•	last_modified_at

⸻

⸻

5. SYNC STRATEGY

5.1 Strategic Bord Sync

Canvas Sync
	•	Auto-sync every 60–90 seconds.
	•	Manual Save option available.
	•	Sync only spatial and content changes.

Instant Writes

The following trigger immediate database writes:
	•	TaskAssignment creation
	•	TaskAssignment reassignment
	•	Task completion
	•	Publish action
	•	Invitation acceptance

⸻

6. DRAFT → PUBLISH SYSTEM

6.1 Draft Mode

Default state.
All assignments are considered “unpublished” until Publish is triggered.

No notifications sent during draft.

⸻

6.2 Publish Action

When Publish is clicked:

System must:
	1.	Create new PublishSnapshot
	2.	Identify:
	•	New assignments
	•	Reassignments
	•	Unassignments
	3.	Notify only affected employees
	4.	Update Bord.last_published_at
	5.	Reset UnpublishedChangeTracker

Visual feedback:
	•	Animation on assigned cards
	•	Confirmation message: “X tasks deployed.”

⸻

6.3 Post-Publish Modifications

After publish:

If changes are made:
	•	Increment UnpublishedChangeTracker.change_count
	•	Show “Unpublished Changes” badge
	•	Do NOT notify until re-published

Re-publish:
	•	Notify only employees affected by change delta

⸻

7. TASK ASSIGNMENT LOGIC

Assignments can originate from:

7.1 Flow Cards
	•	Assign entire card

7.2 Checklist Items
	•	Assign individual checklist items independently

7.3 Kanban Tasks
	•	Assign individual kanban tasks

Each assignment:
	•	Optional Priority
	•	Optional Due Date
	•	Optional Execution Note

Nothing more.

No statuses beyond:
	•	assigned
	•	completed

⸻

8. EXECUTION MODE

8.1 Rendering Logic

If:
	•	User role = employee
OR
	•	Device = mobile

Default view = Execution Inbox

⸻

8.2 Execution Inbox UI

Structure:

Organization View

List of organizations employee belongs to.

Inside Organization:
	•	List of Assigned Tasks
	•	Sorted by:
	•	Priority
	•	Due date (if exists)
	•	Created_at

Task card includes:
	•	Task content
	•	Execution note (if exists)
	•	Due date (if exists)
	•	Priority indicator
	•	Mark Complete button

No:
	•	Canvas
	•	Flow visibility
	•	Linking
	•	Comments
	•	Attachments
	•	Subtasks
	•	Analytics

⸻

8.3 Task Completion

When employee clicks Complete:
	•	Instant write
	•	Update TaskAssignment.status
	•	Update completed_at
	•	Notify owner (in-app only, no email required)

⸻

9. NOTIFICATION SYSTEM

9.1 No Full Notification Center

Use:
	•	Lightweight Activity Sidebar for owners
	•	In-app alerts for employees

⸻

9.2 Notification Triggers

Notify employee only when:
	•	Task newly assigned (on Publish)
	•	Task reassigned (on Publish)
	•	Task unassigned (on Publish)

Notify owner when:
	•	Task marked complete

Do NOT notify for:
	•	Canvas movement
	•	Brainstorm changes
	•	Pre-publish assignments
	•	Edits inside draft mode

⸻

10. MOBILE STRATEGY

10.1 Mobile Behavior

If user logs in on mobile:
	•	Default to Execution Mode
	•	Display message:
“Boards Thinking Surface is optimized for desktop & iPad.”

CEO can still access canvas via override button (optional).

⸻

11. PERMISSIONS

Employees:
	•	Cannot view Bord canvas
	•	Cannot edit assignments
	•	Cannot see other employees’ tasks

Collaborators:
	•	Can view canvas
	•	Cannot manage employees unless granted
	•	Cannot publish unless granted

Owners:
	•	Full system access

⸻

12. EDGE CASES

12.1 Mass Assignment

No hard limit, but UI should:
	•	Warn if publishing > 30 tasks at once

12.2 Reassignment

On publish:
	•	Previous assignee notified of removal
	•	New assignee notified of assignment

12.3 Deleted Source Task

If source card/checklist/kanban task is deleted:
	•	Related TaskAssignment is soft-deleted
	•	Employee notified on next publish

⸻

13. UX PRINCIPLES (NON-NEGOTIABLE)
	•	No workflow configuration screens
	•	No dependency trees
	•	No team chat
	•	No analytics dashboards
	•	No status columns beyond assigned/completed

The product must remain:
Brutally simple.

⸻

14. SUCCESS METRICS

Measure:
	•	Time from task creation to publish
	•	Time from publish to first completion
	•	Average tasks per publish
	•	% of employees completing tasks on mobile
	•	% of Bords with repeat publishes

Primary KPI:
Time from thought → deployed delegation < 2 minutes

⸻

15. FUTURE (NOT IN SCOPE)
	•	Separate execution mobile app
	•	Advanced analytics
	•	Task comments
	•	File attachments
	•	Dependency mapping
	•	Multi-level task states
	•	Chat systems

⸻

FINAL PRODUCT SUMMARY

Boards Delegation System =

Thinking Surface
	•	Draft Mode
	•	Publish Commit
	•	Execution Inbox
	•	Role-Based UI
	•	Strategic Sync

No more.
No less.

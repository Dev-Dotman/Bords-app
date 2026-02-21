📘 PRODUCT REQUIREMENTS DOCUMENT

Boards — Personal & Organizational Architecture + Delegation System

Version: 2.0 (Multi-Organization Structured Model)

⸻

1. PRODUCT OVERVIEW

Boards is a thinking-first execution engine.

It supports two structured contexts:
	1.	Personal Mode (automated reminders + self-organization)
	2.	Organizational Mode (draft → publish delegation system)

Users can:
	•	Have 1 Personal Workspace
	•	Create multiple Organizations
	•	Create multiple Bords under either context

Core Promise:
From thought → structured action without switching tools.

⸻

2. CORE ARCHITECTURE

2.1 Entity Hierarchy

User
→ Workspace
→ Organization (optional layer depending on workspace type)
→ Bord
→ Task Source (Card / Checklist / Kanban)
→ TaskAssignment

⸻

3. WORKSPACE MODEL

3.1 Workspace Table

Workspace
	•	id
	•	owner_id
	•	type (personal | organization_container)
	•	name
	•	created_at
	•	updated_at

Each user automatically has:

1 Personal Workspace
1 Organization Container Workspace

The Organization Container holds multiple organizations.

⸻

4. ORGANIZATION MODEL

4.1 Organization

Organization
	•	id
	•	workspace_id (must reference organization_container)
	•	name
	•	created_by
	•	created_at
	•	updated_at

Users can create multiple organizations.

Examples:
	•	Startup A
	•	Agency
	•	Family Business
	•	Side Project

Each Organization is logically independent.

⸻

5. BORD STRUCTURE

5.1 Bord

Bord
	•	id
	•	workspace_id
	•	organization_id (nullable)
	•	title
	•	is_public (default false)
	•	last_published_at (nullable)
	•	created_at
	•	updated_at

Rules:

If workspace.type = personal:
→ organization_id must be null

If workspace.type = organization_container:
→ organization_id is required

This ensures clean separation.

⸻

6. ROLE SYSTEM

6.1 Personal Mode Roles

Owner:
	•	Full control

Friend:
	•	Can receive reminders
	•	Cannot access canvas
	•	Cannot edit Bords
	•	Inbox only

No Draft/Publish system.

⸻

6.2 Organizational Roles

Defined per Organization (not per workspace globally).

OrganizationMember
	•	id
	•	organization_id
	•	user_id
	•	role (owner | team_member | employee)
	•	sub_role (viewer | editor) [for team_member]
	•	created_at

Role Definitions:

Owner:
	•	Full control

Team Member:
	•	Viewer or Editor
	•	Can access Bords under that Organization

Employee:
	•	Execution Inbox only
	•	Cannot access Bord canvas

⸻

7. TASK SOURCE STRUCTURES

Applies to both Personal and Organization contexts.

7.1 Flow Card

Card
	•	id
	•	bord_id
	•	content
	•	position_x
	•	position_y
	•	state (draft | published) [organization only]
	•	created_at
	•	updated_at

⸻

7.2 Checklist Item

ChecklistItem
	•	id
	•	parent_card_id
	•	content
	•	created_at

⸻

7.3 Kanban

KanbanColumn
	•	id
	•	bord_id
	•	title
	•	order_index

KanbanTask
	•	id
	•	column_id
	•	content
	•	created_at

⸻

8. TASK ASSIGNMENT SYSTEM

8.1 Unified TaskAssignment Model

TaskAssignment
	•	id
	•	workspace_id
	•	organization_id (nullable)
	•	context_type (personal | organization)
	•	source_type (card | checklist | kanban)
	•	source_id
	•	assigned_to (user_id)
	•	created_by (user_id)
	•	priority (nullable)
	•	due_date (nullable)
	•	execution_note (nullable)
	•	status (assigned | completed)
	•	created_at
	•	completed_at

Rules:

If context_type = personal:
	•	organization_id must be null
	•	No publish flow
	•	No priority required
	•	Immediate write

If context_type = organization:
	•	organization_id required
	•	Must go through draft → publish lifecycle

⸻

9. PERSONAL MODE LOGIC

9.1 Behavior

Assignments are treated as Automated Reminders.

When created:
	•	Immediately written to DB
	•	Immediately visible in Personal Inbox
	•	Immediate notification

No:
	•	Draft state
	•	Snapshot versioning
	•	Publish button
	•	Delta comparison

⸻

9.2 Personal Inbox

Contains:
	•	Self-assigned tasks
	•	Friend reminders
	•	Sent reminders

Filtered by workspace_id and context_type.

No priority UI required.
Due date optional.

⸻

10. ORGANIZATION MODE LOGIC

10.1 Draft State

Assignments created under organization are:

DraftAssignments
(not yet deployed)

Track via:
UnpublishedChangeTracker
	•	bord_id
	•	change_count
	•	last_modified_at

No notification until Publish.

⸻

10.2 Publish System

PublishSnapshot
	•	id
	•	bord_id
	•	version_number
	•	published_at
	•	published_by

On Publish:

System must:
	1.	Create snapshot
	2.	Detect delta:
	•	New assignments
	•	Reassignments
	•	Unassignments
	3.	Notify affected employees only
	4.	Update bord.last_published_at
	5.	Reset change tracker

⸻

10.3 Post-Publish Changes

If assignments are edited after publish:
	•	Increment change tracker
	•	Show “Unpublished Changes”
	•	No notification until re-publish

⸻

11. INBOX ARCHITECTURE

Single Inbox system.

Filtered by:
	•	workspace_id
	•	organization_id
	•	context_type

UI Tabs:
	•	Work (organization tasks)
	•	Personal (reminders)

Employees only see Work tab.

Friends only see Personal tab.

Users with mixed roles see both.

⸻

12. MOBILE BEHAVIOR

If device = mobile:

If user.role = employee:
→ Show Work Inbox

If personal workspace active:
→ Show Personal Inbox

If owner:
→ Default to Inbox
→ Canvas accessible via override

⸻

13. SYNC STRATEGY

Canvas Sync:
	•	Every 60–90 seconds
	•	Manual Save allowed

Instant Writes:
	•	Assignment creation
	•	Assignment completion
	•	Publish
	•	Invitation acceptance

Critical actions must not rely on delayed sync.

⸻

14. NAVIGATION STRUCTURE

Top-level Workspace Switcher:

Personal
Organizations:
	•	Org A
	•	Org B
	•	Org C

When switching organization:
	•	Load only Bords tied to that organization
	•	Load only members tied to that organization
	•	Isolate assignment scope

No cross-organization bleed.

⸻

15. PERMISSION RULES

Employees:
	•	Cannot view canvas
	•	Cannot edit assignments
	•	Cannot view other employees’ tasks

Team Members:
	•	Can view or edit canvas (based on sub_role)
	•	Cannot publish unless permitted

Owners:
	•	Full control per organization

Personal friends:
	•	Inbox only
	•	No canvas access

⸻

16. EDGE CASES
	1.	User is:
	•	Friend in Personal
	•	Employee in Org A
	•	Team Member in Org B

Inbox must clearly label:
Workspace Name
Organization Name
Context Type
	2.	Deleting an Organization:

	•	All associated Bords archived
	•	All assignments soft-deleted

	3.	Deleting a Bord:

	•	Related TaskAssignments soft-deleted

⸻

17. UX GUARDRAILS

Personal Mode:
	•	No Publish button
	•	No version numbers
	•	No deployment language

Organization Mode:
	•	Must display publish status
	•	Must display last published timestamp
	•	Must display unpublished changes count

⸻

18. SUCCESS METRICS

Personal:
	•	Reminder send rate
	•	Self-assignment rate
	•	Weekly retention

Organization:
	•	Publish frequency
	•	Tasks per publish
	•	Completion rate
	•	Time from publish → completion
	•	Number of organizations per user

Primary KPI:
Time from thought → deployed delegation < 2 minutes.

⸻

19. OUT OF SCOPE
	•	Messaging threads
	•	Chat systems
	•	File attachments
	•	Advanced analytics
	•	Dependency tracking
	•	Workflow automation engines

Boards remains:
Thinking Engine + Structured Deployment Layer.

⸻

FINAL ARCHITECTURE SUMMARY

User
→ Personal Workspace
→ Personal Bords
→ Automated Reminders

User
→ Organization Container
→ Organization A
→ Bords
→ Draft → Publish
→ Employees
→ Organization B
→ Bords
→ Draft → Publish
→ Employees

One engine.
Multiple structured realities.
Clean logical isolation.
Scalable.

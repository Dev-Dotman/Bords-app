# BORDS Collaboration Feature

> **Status: Coming Very Soon**

## Overview

Real-time collaboration allows multiple users to work on the same board simultaneously. A board can be **both public AND collaborative** — public for view-only access via link, while invited collaborators get full editing rights.

## Planned Features

### 1. Invite Collaborators
- Invite users by email to collaborate on a board
- Each collaborator gets `view` or `edit` permission
- Invited users see shared boards in their board list automatically

### 2. Shared Board Administration
- **Either party** can reorganize the board (move, resize, delete items)
- **Either party** can create new sticky notes, checklists, kanban boards, text, media, and drawings
- **Either party** can assign tasks to other collaborators
- Changes sync to all collaborators in real-time

### 3. Task Assignment Within Collaboration
- Assign checklist items or kanban tasks to specific collaborators
- Collaborators receive notifications for new assignments
- Completion status syncs bidirectionally between all parties

### 4. Presence & Awareness
- See who else is currently viewing/editing the board
- Cursor presence — see collaborators' cursors in real-time
- "Currently editing" indicators on items being modified by others

### 5. Activity Feed
- See a log of changes made by each collaborator
- Filter activity by user or item type
- Undo/revert specific changes

### 6. Permissions Model
| Permission | View Board | Edit Items | Assign Tasks | Manage Collaborators |
|------------|-----------|------------|--------------|---------------------|
| **Owner**  | ✅        | ✅         | ✅           | ✅                  |
| **Editor** | ✅        | ✅         | ✅           | ❌                  |
| **Viewer** | ✅        | ❌         | ❌           | ❌                  |

### 7. Collaboration + Public Boards
- A board can be **collaborative** (invited editors) and **public** (view-only link) simultaneously
- Public viewers see the board in read-only presentation mode
- Collaborators with edit access can make changes that public viewers see

## Technical Notes

- Will use WebSocket (or Server-Sent Events) for real-time sync
- Conflict resolution via operational transforms or last-write-wins per item
- Collaboration modal in the UI will manage invitations and permissions
- Existing cloud sync infrastructure (`BoardDocument`, sync API routes) will be extended

## UI Components (Planned)

- **CollaborationModal** — Manage collaborators, send invitations, set permissions
- **PresenceIndicator** — Avatars of active collaborators on the board
- **ActivityPanel** — Sidebar showing recent changes by collaborators

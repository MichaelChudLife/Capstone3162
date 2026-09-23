# CCA Hub

Task and event management demo for the Commerce and Computing Association committee — built for the FIT3162 Team 17 project pitch.

## Features

- **Event & Task Management** — create and edit events (title, description, date, location); each event has a detail page with its sub-tasks nested underneath; deleting an event asks for confirmation and lists the sub-tasks it will remove.
- **Task Assignment & Tracking** — assign a task to one or more committee members; unassigned tasks are flagged on the board, event pages and reminders. Each task has a detail page showing description, assignees, deadline, priority and status, with an edit form that blocks deadlines in the past.
- **Kanban board** — Not started / In progress / Completed columns with a move menu on each card.
- **Deadline reminders** — colour-coded due badges (due soon / overdue), a dashboard reminders panel, a notifications bell, and a dedicated Reminders view that auto-groups tasks by urgency.
- **Role-based access control** — Committee Director gets full create/edit/manage privileges over events and tasks; Committee Member can view events and update only the tasks assigned to them (status, description, priority, deadline), but can't reassign a task or move it to another event, and can't create or manage events. See `ROLE_PERMISSIONS` and `canUpdateTask` in `src/lib/data.ts`.
- **Budget module** — each event has a Budget panel where any member can record a line item's expected cost and actual expenditure; the panel totals expected vs. actual spend and flags over/under budget. A member can edit or delete the items they recorded; directors (`manage_events`) can edit or delete any item on the event.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS v4

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Screens

| Route | Screen |
|-------|--------|
| `/` | Dashboard — stats, upcoming deadlines, reminders |
| `/tasks` | Kanban task board with a move menu on each card |
| `/tasks/[id]` | Task detail — description, assignees, deadline, priority, status; edit form |
| `/events` | Events with sub-task progress and a preview of open sub-tasks; New Event button |
| `/events/[id]` | Event detail — sub-tasks grouped by status, add sub-task, edit / delete event, per-event Budget panel |
| `/reminders` | Reminders grouped by Overdue / Due today / Due soon |
| `/members` | Team roster and access roles; only the IT Director can change a role |

## Tests

```bash
npm test          # run once
npm run test:watch
```

Unit tests live in `tests/` and are named by RTM test case, so results map straight onto the traceability matrix:

| Test case | Requirement | File |
|-----------|-------------|------|
| TC-001 | F_REQ-1.1 Create event | `tests/events.test.ts` |
| TC-002 | F_REQ-1.2 Event sub-tasks and delete confirmation | `tests/events.test.ts` |
| TC-003 | F_REQ-1.3 Multiple assignees, unassigned permitted | `tests/tasks.test.ts` |
| TC-004 | F_REQ-1.4 Description, deadline, priority; no past deadlines | `tests/tasks.test.ts` |
| TC-005 | F_REQ-2.1 RBAC — Committee Member limited to self-assigned tasks | `tests/rbac.test.ts` |
| TC-006 | F_REQ-2.2 Budget module — record and total expected vs. actual cost per event | `tests/budget.test.ts` |

Each suite also includes negative tests confirming that roles without the permission get a "You do not have access" result.

## Code layout

| Path | Responsibility |
|------|----------------|
| `src/lib/types.ts` | Domain types, input shapes (`EventInput`, `TaskInput`, `BudgetItemInput`), `ActionResult` |
| `src/lib/validation.ts` | Pure validators shared by the forms (client) and server actions |
| `src/lib/data.ts` | In-memory store and accessors — the swap point for Prisma; `hasPermission`, `canUpdateTask`, `canEditBudgetItem` are the access-control checks |
| `src/lib/action-result.ts` | `ok` / `denied` / `invalid` helpers for server action results |
| `src/app/events/actions.ts` | Create, update and delete event server actions (`manage_events`) |
| `src/app/tasks/actions.ts` | Create task (`manage_tasks`) and update task (director, or the assignee updating their own task) server actions |
| `src/app/events/budget-actions.ts` | Record, edit and delete per-event budget line items |
| `src/components/Modal.tsx`, `form.tsx` | Shared dialog shell and form field primitives |
| `src/components/EventFormDialog.tsx`, `TaskFormDialog.tsx`, `BudgetItemFormDialog.tsx` | Create/edit forms used across pages |
| `src/components/BudgetPanel.tsx` | Per-event budget list, totals and over/under-budget indicator |

## Data layer

The demo runs on an in-memory data store (`src/lib/data.ts`) seeded with realistic committee data, so it runs with zero database setup. The store deliberately mirrors a Prisma schema — see `prisma/schema.prisma` (PostgreSQL), which is the intended production schema.

To move to a real database:

```bash
npm i prisma @prisma/client
# set DATABASE_URL in .env
npx prisma migrate dev
```

Then swap the `src/lib/data.ts` accessor functions (`getTasks`, `createTask`, `updateTask`, `createEvent`, `deleteEvent`, `setTaskStatus`, `getBudgetItemsForEvent`, `createBudgetItem`, …) for Prisma client calls — the function signatures and types (`src/lib/types.ts`) already match the schema. Task assignees are a many-to-many relation (`Task.assignees` ↔ `Member.tasks`), and deleting an event cascades to its sub-tasks and budget items (`onDelete: Cascade`).

## Theming

Brand colours are CSS variables in `src/app/globals.css` (`--brand`, `--brand-strong`, `--brand-soft`). Change those three values to re-skin the whole app.

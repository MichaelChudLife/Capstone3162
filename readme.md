# CCA Hub

Task and event management demo for the Commerce and Computing Association committee — built for the FIT3162 Team 17 project pitch.

## Features

- **Event & Task Management** — create and edit events (title, description, date, location); each event has a detail page with its sub-tasks nested underneath; deleting an event asks for confirmation and lists the sub-tasks it will remove.
- **Task Assignment & Tracking** — assign a task to one or more committee members; unassigned tasks are flagged on the board, event pages and reminders. Each task has a detail page showing description, assignees, deadline, priority and status, with an edit form that blocks deadlines in the past.
- **Kanban board** — Not started / In progress / Completed columns with a move menu on each card.
- **Deadline reminders** — colour-coded due badges (due soon / overdue), a dashboard reminders panel, a notifications bell, and a dedicated Reminders view that auto-groups tasks by urgency.

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
| `/events/[id]` | Event detail — sub-tasks grouped by status, add sub-task, edit / delete event |
| `/reminders` | Reminders grouped by Overdue / Due today / Due soon |

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

Each suite also includes negative tests confirming that roles without the permission get a "You do not have access" result.

## Code layout

| Path | Responsibility |
|------|----------------|
| `src/lib/types.ts` | Domain types, input shapes (`EventInput`, `TaskInput`), `ActionResult` |
| `src/lib/validation.ts` | Pure validators shared by the forms (client) and server actions |
| `src/lib/data.ts` | In-memory store and accessors — the swap point for Prisma |
| `src/lib/action-result.ts` | `ok` / `denied` / `invalid` helpers for server action results |
| `src/app/events/actions.ts` | Create, update and delete event server actions (`manage_events`) |
| `src/app/tasks/actions.ts` | Create and update task server actions (`manage_tasks`) |
| `src/components/Modal.tsx`, `form.tsx` | Shared dialog shell and form field primitives |
| `src/components/EventFormDialog.tsx`, `TaskFormDialog.tsx` | Create/edit forms used across pages |

## Data layer

The demo runs on an in-memory data store (`src/lib/data.ts`) seeded with realistic committee data, so it runs with zero database setup. The store deliberately mirrors a Prisma schema — see `prisma/schema.prisma` (PostgreSQL), which is the intended production schema.

To move to a real database:

```bash
npm i prisma @prisma/client
# set DATABASE_URL in .env
npx prisma migrate dev
```

Then swap the `src/lib/data.ts` accessor functions (`getTasks`, `createTask`, `updateTask`, `createEvent`, `deleteEvent`, `setTaskStatus`, …) for Prisma client calls — the function signatures and types (`src/lib/types.ts`) already match the schema. Task assignees are a many-to-many relation (`Task.assignees` ↔ `Member.tasks`), and deleting an event cascades to its sub-tasks (`onDelete: Cascade`).

## Theming

Brand colours are CSS variables in `src/app/globals.css` (`--brand`, `--brand-strong`, `--brand-soft`). Change those three values to re-skin the whole app.

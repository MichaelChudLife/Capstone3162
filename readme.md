# CCA Hub

Task and event management demo for the Commerce and Computing Association committee — built for the FIT3162 Team 17 project pitch.

## Features

- **Authentication (F_REQ-8)** — members log in with email + password; sessions are a signed, httpOnly cookie that expires after 30 minutes of inactivity. `src/middleware.ts` blocks every route except `/login` for anyone without a valid session.
- **Role-based access control (F_REQ-5)** — six access roles, each mapped to a set of permissions in `src/lib/types.ts`. The two required by spec: **Committee Director** (`manage_events` + `manage_tasks` — full create/edit/manage on events and tasks) and **Committee Member** (`view_workspace` + `update_own_tasks` — can see everything but can only move the status of tasks assigned to them, enforced both in the UI and in the server actions).
- **Centralised dashboard (F_REQ-9)** — `/` shows the logged-in member's own overdue tasks, tasks due this week, open tasks, "My tasks" list, and upcoming events, personalised to whoever is signed in.
- **Event & Task Management** — create and edit events (title, description, date, location); each event has a detail page with its sub-tasks nested underneath; deleting an event asks for confirmation and lists the sub-tasks it will remove.
- **Task Assignment & Tracking** — assign a task to one or more committee members; unassigned tasks are flagged on the board, event pages and reminders. Each task has a detail page showing description, assignees, deadline, priority and status, with an edit form that blocks deadlines in the past.
- **Kanban board** — Not started / In progress / Completed columns with a move menu on each card (shown only to directors and to members on their own assigned tasks).
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

You'll be redirected to `/login`. Demo credentials — every seeded member shares the
same password, `Committee2026!`:

| Email | Access role |
|-------|-------------|
| yunsoo@cca.org.au | Committee Director |
| sener@cca.org.au | Committee Member |
| michael@cca.org.au | IT Director |
| yahya@cca.org.au | Events Director |
| nathanael@cca.org.au | Marketing Director |

Set a real `SESSION_SECRET` env var before deploying anywhere beyond a local demo —
it falls back to an insecure default otherwise (`src/lib/auth.ts`).

## Screens

| Route | Screen |
|-------|--------|
| `/` | Dashboard — stats, upcoming deadlines, reminders |
| `/tasks` | Kanban task board with a move menu on each card |
| `/tasks/[id]` | Task detail — description, assignees, deadline, priority, status; edit form |
| `/events` | Events with sub-task progress and a preview of open sub-tasks; New Event button |
| `/events/[id]` | Event detail — sub-tasks grouped by status, add sub-task, edit / delete event |
| `/reminders` | Reminders grouped by Overdue / Due today / Due soon |
| `/login` | Email + password login; redirects to `/` if already signed in |

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
| TC-005 | F_REQ-5 Committee Member can only update self-assigned tasks | `tests/access-control.test.ts` |
| TC-006 | F_REQ-5 Committee Director has full event/task privileges | `tests/access-control.test.ts` |

Each suite also includes negative tests confirming that roles without the permission get a "You do not have access" result.

These tests exercise permission logic (`hasPermission`, `canUpdateTask`) directly and don't
go through HTTP, so they don't touch the session cookie — `tests/helpers.ts`'s `actAs(role)`
keeps switching the fixed test identity's access role, same as before auth was added.

## Code layout

| Path | Responsibility |
|------|----------------|
| `src/lib/types.ts` | Domain types, input shapes (`EventInput`, `TaskInput`), `ActionResult` |
| `src/lib/validation.ts` | Pure validators shared by the forms (client) and server actions |
| `src/lib/data.ts` | In-memory store and accessors — the swap point for Prisma. `hasPermission` / `canUpdateTask` implement F_REQ-5 |
| `src/lib/action-result.ts` | `ok` / `denied` / `invalid` helpers for server action results |
| `src/lib/password.ts` | scrypt password hashing (`hashPassword`, `verifyPassword`) |
| `src/lib/auth.ts` | Session cookie sign/verify/create/destroy, `requireCurrentMember` (pages), `syncCurrentUserFromSession` (server actions) |
| `src/middleware.ts` | Route gate for F_REQ-8 — redirects to `/login` without a valid session; Edge-runtime, so it re-implements cookie verification with Web Crypto instead of importing `lib/auth.ts` |
| `src/app/login/actions.ts` | `loginAction` (checks credentials, creates the session), `logoutAction` |
| `src/app/events/actions.ts` | Create, update and delete event server actions (`manage_events`) |
| `src/app/tasks/actions.ts` | Create and update task server actions (`manage_tasks`) |
| `src/app/actions.ts` | `moveTaskAction` (`manage_tasks` or the assignee via `update_own_tasks`), `updateMemberRoleAction` (`manage_access`) |
| `src/components/Modal.tsx`, `form.tsx` | Shared dialog shell and form field primitives |
| `src/components/EventFormDialog.tsx`, `TaskFormDialog.tsx` | Create/edit forms used across pages |
| `src/components/LoginForm.tsx`, `LogoutButton.tsx` | Client-side login form and sidebar logout control |

## Data layer

The demo runs on an in-memory data store (`src/lib/data.ts`) seeded with realistic committee data, so it runs with zero database setup. The store deliberately mirrors a Prisma schema — see `prisma/schema.prisma` (PostgreSQL), which is the intended production schema.

To move to a real database:

```bash
npm i prisma @prisma/client
# set DATABASE_URL in .env
npx prisma migrate dev
```

Then swap the `src/lib/data.ts` accessor functions (`getTasks`, `createTask`, `updateTask`, `createEvent`, `deleteEvent`, `setTaskStatus`, …) for Prisma client calls — the function signatures and types (`src/lib/types.ts`) already match the schema. Task assignees are a many-to-many relation (`Task.assignees` ↔ `Member.tasks`), and deleting an event cascades to its sub-tasks (`onDelete: Cascade`). Add `email` and `passwordHash` columns to `Member` in the schema to match `src/lib/types.ts`.

**Known simplification:** "who's logged in" for a given request is tracked with a single
module-level `currentUserId` variable (`src/lib/data.ts`), refreshed from the session cookie
at the top of every page and server action (`requireCurrentMember` / `syncCurrentUserFromSession`
in `src/lib/auth.ts`). That mirrors the existing in-memory store's own design (one shared,
un-partitioned workspace, no per-request isolation) and is fine for local/demo use with one
browser session at a time. A real multi-user deployment on a real database should thread the
authenticated member through request-scoped state (e.g. `AsyncLocalStorage`, or read straight
from the DB per call) instead of a shared mutable variable.

## Theming

Brand colours are CSS variables in `src/app/globals.css` (`--brand`, `--brand-strong`, `--brand-soft`). Change those three values to re-skin the whole app.

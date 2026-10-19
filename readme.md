# CCA Hub

Task and event management demo for the Commerce and Computing Association committee — built for the FIT3162 Team 17 project pitch.

## Features

- **Authentication (F_REQ-8)** — members log in with email + password; sessions are a signed, httpOnly cookie that expires after 30 minutes of inactivity. `src/proxy.ts` blocks every route except `/login` and invite links (`/invite/*`) for anyone without a valid session.
- **Role-based access control (F_REQ-5)** — six access roles, each mapped to a set of permissions in `src/lib/types.ts`. The two required by spec: **Committee Director** (`manage_events` + `manage_tasks` — full create/edit/manage on events and tasks) and **Committee Member** (`view_workspace` + `update_own_tasks` — can see everything but can only move the status of tasks assigned to them, enforced both in the UI and in the server actions). Budgets use a separate `manage_budget` permission held by the IT, Committee, Events and Finance Directors; every other role can view budgets but not change them.
- **Centralised dashboard (F_REQ-9)** — `/` shows the logged-in member's own overdue tasks, tasks due this week, open tasks, "My tasks" list, and upcoming events, personalised to whoever is signed in.
- **Event & Task Management** — create and edit events (title, description, date, location); each event has a detail page with its sub-tasks nested underneath; deleting an event asks for confirmation and lists the sub-tasks it will remove.
- **Task Assignment & Tracking** — assign a task to one or more committee members; unassigned tasks are flagged on the board, event pages and reminders. Each task has a detail page showing description, assignees, deadline, priority and status, with an edit form that blocks deadlines in the past.
- **Event budget (F_REQ-7)** — each event page has a Budget section where directors record line items with an expected cost and, once the money is spent, the actual spend. Variance (actual − expected) is calculated and shown automatically per item and for the event total, coloured red when over budget and green when under. All amounts are in **AUD**; there is no invoice upload or accounting integration.
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
| `/tasks/[id]` | Task detail — description, assignees, deadline, priority; status control for the assignee or a director; Activity log of status changes |
| `/events` | Events with sub-task progress and a preview of open sub-tasks; New Event button |
| `/events/[id]` | Event detail — sub-tasks grouped by status, add sub-task, edit / delete event, and the event budget (expected vs actual, variance, AUD) |
| `/reminders` | Your reminders grouped by Overdue / Due within 48 hours; directors also get a Whole committee view |
| `/login` | Email + password login; redirects to `/` if already signed in |
| `/invite/[token]` | Public sign-up page for an invite link — sets name and password, then signs the new member in |

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
| TC-005 | F_REQ-2 Status updates across three states, logged with time and acting user, live refresh | `tests/status.test.ts`, `tests/components/status-control.test.tsx` |
| TC-006 | F_REQ-3 Reminders at 48 hours and at the deadline, per assignee, in-app only | `tests/reminders.test.ts` |
| TC-005 / TC-006 (label clash) | F_REQ-5 Committee Member can only update self-assigned tasks; Committee Director has full privileges | `tests/access-control.test.ts` — the RTM lists these as TC-008 / TC-009 |
| — | F_REQ-8 Invite-only sign-up links | `tests/invites.test.ts` |
| TC-010 | F_REQ-7 Budget — expected vs actual, variance calculated automatically, AUD | `tests/budget.test.ts` |

Each suite also includes negative tests confirming that roles without the permission get a "You do not have access" result.

`tests/**/*.test.ts` run in Node; `tests/**/*.test.tsx` are React Testing Library component tests and run in jsdom (two Vitest projects in `vitest.config.mts`).

These tests exercise permission logic (`hasPermission`, `canUpdateTask`) directly and don't
go through HTTP, so they don't touch the session cookie — `tests/helpers.ts`'s `actAs(role)`
keeps switching the fixed test identity's access role, same as before auth was added.

## Code layout

| Path | Responsibility |
|------|----------------|
| `src/lib/types.ts` | Domain types, input shapes (`EventInput`, `TaskInput`, `BudgetItemInput`), `ActionResult` |
| `src/lib/validation.ts` | Pure validators shared by the forms (client) and server actions |
| `src/lib/money.ts` | AUD helpers for F_REQ-7: parse/format amounts, per-item variance, `summariseBudget` totals. Amounts are integer cents |
| `src/lib/data.ts` | In-memory store and accessors — the swap point for Prisma. `hasPermission` / `canUpdateTask` implement F_REQ-5 |
| `src/lib/action-result.ts` | `ok` / `denied` / `invalid` helpers for server action results |
| `src/lib/password.ts` | scrypt password hashing (`hashPassword`, `verifyPassword`) |
| `src/lib/auth.ts` | Session cookie sign/verify/create/destroy, `requireCurrentMember` (pages), `syncCurrentUserFromSession` (server actions) |
| `src/proxy.ts` | Route gate for F_REQ-8 — redirects to `/login` without a valid session, lets `/invite/*` through, and slides the 30-minute session on every request except the `/api/live` poll |
| `src/app/login/actions.ts` | `loginAction` (checks credentials, creates the session), `logoutAction` |
| `src/app/events/actions.ts` | Create, update and delete event server actions (`manage_events`) |
| `src/app/events/budget-actions.ts` | Create, update and delete budget item server actions (`manage_budget`) |
| `src/app/tasks/actions.ts` | Create and update task server actions (`manage_tasks`) |
| `src/app/actions.ts` | `moveTaskAction` (`manage_tasks` or the assignee via `update_own_tasks`), `updateMemberRoleAction` (`manage_access`) |
| `src/components/Modal.tsx`, `form.tsx` | Shared dialog shell and form field primitives |
| `src/components/EventFormDialog.tsx`, `TaskFormDialog.tsx` | Create/edit forms used across pages |
| `src/components/BudgetSection.tsx` | Budget table and totals on the event page; `BudgetItemDialog`, `AddBudgetItemButton` and `BudgetItemActions` handle add / edit / delete |
| `src/components/LoginForm.tsx`, `LogoutButton.tsx` | Client-side login form and sidebar logout control |
| `src/lib/reminder-rules.ts` | F_REQ-3 rule: `reminderKindFor` (due within 48 hours / overdue) and reminder labels — pure, takes `now` |
| `src/app/api/live/route.ts`, `src/components/LiveRefresh.tsx` | F_REQ-2 live updates: pages poll a change counter every 3 s and refresh when it moves |
| `src/components/StatusControl.tsx`, `StatusHistory.tsx` | Status buttons and the Activity log on the task page |
| `src/app/reminders/actions.ts`, `src/components/NotificationsBell.tsx` | Mark reminders read; the personal reminder bell |
| `src/lib/invite-token.ts`, `src/lib/invites.ts` | Invite token generation and hashing; invite validity checks |
| `src/app/members/invite-actions.ts`, `src/app/invite/[token]/actions.ts` | Create / renew / cancel invites (`manage_access`); accept an invite and create the account |

## Status updates and reminders (F_REQ-2, F_REQ-3)

**Demo:** log in as `yunsoo@cca.org.au` in one browser and `sener@cca.org.au` in a private window.

- **Status (F_REQ-2)** — as Sener, open *Book Woodside room 3.01* and press **Completed**. YunSoo's open page updates within about 3 seconds without a reload, and both see the change in **Activity** with Sener's name and the time. Members only get the status control on tasks assigned to them; a director gets it on every task.
- **Live updates** — every change bumps a workspace counter. Open pages poll `/api/live` every 3 seconds (paused while the tab is hidden) and refresh when it moves. Polling does not extend the 30-minute session.
- **Reminders (F_REQ-3)** — each assignee gets one reminder when a deadline is within 48 hours and another once it passes; the overdue one replaces the 48-hour one. Completing a task clears its reminders, and moving the deadline re-arms them. In-app only — no email.
- **Seeded for the demo** — Sener has *Submit BBQ food safety checklist* due in about 20 hours and *Send volunteer roster*, which is already overdue.

## Invite links (F_REQ-8)

Log in as the IT Director (`michael@cca.org.au`), open **Members** and choose **Invite member**.

- Enter the email, access role and an optional position. The app shows a one-time link to copy and send — it doesn't email anyone.
- Links expire after 7 days and work once. Only a SHA-256 hash of the token is stored, so a lost link can't be shown again; use **New link** under Pending invites (the old link stops working) or **Cancel invite**.
- The invitee sets their name and a password (at least 10 characters) and is signed straight in with the invited role.

## Event budget (F_REQ-7)

Open an event (`/events/[id]`) and scroll to **Budget**.

- **Line items** — a description, an *expected cost* and an optional *actual spend*. Leave actual blank until the money is spent; the item then shows "Not yet spent".
- **Variance** — `actual − expected`, calculated automatically, never typed in. A positive value (`+$325.50`) is over budget; a negative value (`−$70.00`) is under. Totals update immediately when an item is added, edited or deleted.
- **Unspent items** — variance only compares items that have an actual recorded, so a not-yet-spent line isn't counted as a saving. Its expected cost is shown separately beneath the table.
- **Currency** — AUD only. Amounts are entered as dollars (`1,234.50`, `$250`) and stored as integer cents so totals never drift. Negative amounts, more than two decimal places and non-numeric input are rejected on both the form and the server.
- **Scope** — no invoice upload and no accounting integration.
- **Deleting an event** also deletes its budget items; the confirmation dialog says how many.

The seeded data includes budgets for *Industry Networking Night* and *Semester 2 Welcome BBQ* so there is something to look at straight away.

## Data layer

The demo runs on an in-memory data store (`src/lib/data.ts`) seeded with realistic committee data, so it runs with zero database setup. The store deliberately mirrors a Prisma schema — see `prisma/schema.prisma` (PostgreSQL), which is the intended production schema.

To move to a real database:

```bash
npm i prisma @prisma/client
# set DATABASE_URL in .env
npx prisma migrate dev
```

Then swap the `src/lib/data.ts` accessor functions (`getTasks`, `createTask`, `updateTask`, `createEvent`, `deleteEvent`, `setTaskStatus`, `getBudgetItemsForEvent`, `createBudgetItem`, …) for Prisma client calls — the function signatures and types (`src/lib/types.ts`) already match the schema. Task assignees are a many-to-many relation (`Task.assignees` ↔ `Member.tasks`), and deleting an event cascades to its sub-tasks and budget items (`onDelete: Cascade`). Add `email` and `passwordHash` columns to `Member` in the schema to match `src/lib/types.ts`.

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

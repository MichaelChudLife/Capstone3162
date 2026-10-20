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
- PostgreSQL through Prisma ORM 7 (`@prisma/adapter-pg`)
- Hosted on Vercel with a Neon Postgres database (see [Deploy](#deploy-to-vercel))

## Run it

Needs Node.js 22.18 or newer.

```bash
npm install                # also generates the Prisma client
cp .env.example .env
npm run db:local           # terminal 1: starts Postgres on port 54329 (data kept in .local-db/)
npm run db:setup           # terminal 2: creates the tables and seeds the demo workspace
npm run dev                # open http://localhost:3000
```

`npm run db:local` downloads nothing extra and needs no Docker; stop it with Ctrl+C. To use
another Postgres instead, point `DATABASE_URL` in `.env` at it. `npm run db:reset` wipes the
database and reseeds it.

You'll be redirected to `/login`. Locally, every seeded member shares the password
`Committee2026!` (a deployed site uses the `SEED_PASSWORD` you set instead):

| Email | Access role |
|-------|-------------|
| yunsoo@cca.org.au | Committee Director |
| sener@cca.org.au | Committee Member |
| michael@cca.org.au | IT Director |
| yahya@cca.org.au | Events Director |
| nathanael@cca.org.au | Marketing Director |

Locally a built-in development `SESSION_SECRET` is used when none is set. In production
the app refuses to sign anyone in until `SESSION_SECRET` is at least 32 characters.

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
| — | F_REQ-8 Password hashes never reach the browser | `tests/credentials.test.ts` |
| — (supports TC-016) | NF_REQ-2 Actions run as the signed-in member, production secrets enforced, live version shared through the database | `tests/deployment.test.ts` |
| TC-010 | F_REQ-7 Budget — expected vs actual, variance calculated automatically, AUD | `tests/budget.test.ts` |

Each suite also includes negative tests confirming that roles without the permission get a "You do not have access" result.

`tests/**/*.test.ts` run in Node against a real Postgres; `tests/**/*.test.tsx` are React Testing Library component tests and run in jsdom (two Vitest projects in `vitest.config.mts`).

`npm test` starts a throwaway Postgres for the run (`tests/global-setup.ts`), gives each worker
its own database, and resets it to the seeded demo data before every test. To use an existing
server instead (for example in CI), set `TEST_DATABASE_ADMIN_URL` to a superuser connection
string. Tests sign in by setting the session cookie (`signInAs` in `tests/helpers.ts`), and
`actAs(role)` changes the signed-in member's access role.

## Code layout

| Path | Responsibility |
|------|----------------|
| `src/lib/types.ts` | Domain types, input shapes (`EventInput`, `TaskInput`, `BudgetItemInput`), `ActionResult` |
| `src/lib/validation.ts` | Pure validators shared by the forms (client) and server actions |
| `src/lib/money.ts` | AUD helpers for F_REQ-7: parse/format amounts, per-item variance, `summariseBudget` totals. Amounts are integer cents |
| `src/lib/data.ts` | All database reads and writes through Prisma, returning the plain types in `types.ts`. `hasPermission` / `canUpdateTask` implement F_REQ-5 |
| `src/lib/db.ts` | The Prisma client (one per server instance, pooled `pg` connection, `DATABASE_URL`) |
| `prisma/schema.prisma`, `prisma/migrations/` | Database schema and the SQL migrations applied by `prisma migrate deploy` |
| `src/lib/seed.ts`, `prisma/seed.ts` | Demo workspace data, and the seed command that loads it into an empty database |
| `scripts/local-db.mjs` | `npm run db:local` — a local Postgres for development, no install needed |
| `src/lib/action-result.ts` | `ok` / `denied` / `invalid` helpers for server action results |
| `src/lib/password.ts` | scrypt password hashing (`hashPassword`, `verifyPassword`) |
| `src/lib/auth.ts` | Session cookie sign/verify/create/destroy, `requireCurrentMember` (pages), `currentActor` (server actions — every action acts as the member in the request's session) |
| `src/instrumentation.ts` | Runs once per server start: sets the server time zone (`APP_TIME_ZONE`, default Australia/Melbourne) so dates aren't shown in UTC on hosted servers |
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
- **Live updates** — every change bumps a workspace counter stored in the database, so every server instance sees it. Open pages poll `/api/live` every 3 seconds (paused while the tab is hidden) and refresh when it moves. Polling does not extend the 30-minute session.
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

Data lives in PostgreSQL. `prisma/schema.prisma` is the source of truth and `src/lib/data.ts` is the only module that queries it, so pages and server actions never touch Prisma directly. Task assignees are a many-to-many relation (`Task.assignees` ↔ `Member.tasks`), and deleting an event cascades to its sub-tasks, budget items, status history and reminders (`onDelete: Cascade`).

- **Password hashes** stay in the database. `Member` in `src/lib/types.ts` has no `passwordHash`, and only `authenticate()` reads it, so a hash can't be passed to a client component.
- **Identity** comes from the session cookie on every request (`currentActor()` / `requireCurrentMember()`), never from shared server state, so concurrent requests on one server can't act as each other.
- **Changing the schema** — edit `prisma/schema.prisma`, then with `npm run db:local` running:

  ```bash
  npx prisma migrate dev --name describe-the-change
  ```

  Commit the new folder under `prisma/migrations/`. Deploys apply it automatically.

## Deploy to Vercel

The live site runs on Vercel (functions in Sydney, `syd1`, set in `vercel.json`) with a Neon Postgres database. Both have free plans. Every push to `main` deploys automatically.

**One-time setup** (done in the browser by whoever owns the GitHub repo):

1. Sign in to [vercel.com](https://vercel.com) with GitHub and choose **Add New → Project**, then import this repository. Leave the build settings as they are — `vercel.json` already sets the build command. The first build fails because there is no database yet; that's expected.
2. Open the project's **Storage** tab, choose **Neon** (Postgres), pick the **Sydney (ap-southeast-2)** region and the free plan, and connect it to the project for all environments. This adds `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (used for migrations) automatically. Under *Advanced options*, turn on **Preview** branching so preview deployments get their own copy of the database instead of migrating production.
3. In **Settings → Environment Variables**, add:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `SESSION_SECRET` | output of `openssl rand -base64 32` | Production, Preview |
   | `SEED_PASSWORD` | the password the 5 demo accounts will use (10+ characters; share it privately, not in the repo) | Production, Preview |
   | `APP_TIME_ZONE` | `Australia/Melbourne` (optional — this is the default) | Production, Preview |

4. **Deployments → Redeploy** so the build picks up the variables.

**What each deploy does** (`npm run vercel-build`): `prisma migrate deploy` applies any new migrations, `prisma db seed` loads the demo workspace only if the database has no members yet, then `next build`. Re-deploying never overwrites existing data.

**After the first deploy**, log in as `michael@cca.org.au` (IT Director) with your `SEED_PASSWORD` and use **Members → Invite member** to add real people. Changing `SESSION_SECRET` later signs everyone out; changing `SEED_PASSWORD` later has no effect because the database is only seeded once.

**Security** — Vercel serves the site over HTTPS only. `next.config.ts` adds HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: same-origin` (keeps invite tokens out of referrer headers). Passwords are salted scrypt hashes (`src/lib/password.ts`) and session cookies are httpOnly, `SameSite=Lax` and `Secure` in production.

## Theming

Brand colours are CSS variables in `src/app/globals.css` (`--brand`, `--brand-strong`, `--brand-soft`). Change those three values to re-skin the whole app.

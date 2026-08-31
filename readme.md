# CCA Hub

Task and event management demo for the Commerce and Computing Association committee — built for the FIT3162 Team 17 project pitch.

## Features

- **Event & Task Management** — Kanban board (To Do / In Progress / Done), events list with linked tasks, create/edit tasks with status and priority.
- **Task Assignment & Tracking** — assign tasks to committee members, track progress per event.
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
| `/events` | Events with linked-task progress |
| `/reminders` | Reminders grouped by Overdue / Due today / Due soon |

## Data layer

The demo runs on an in-memory data store (`src/lib/data.ts`) seeded with realistic committee data, so it runs with zero database setup. The store deliberately mirrors a Prisma schema — see `prisma/schema.prisma` (PostgreSQL), which is the intended production schema.

To move to a real database:

```bash
npm i prisma @prisma/client
# set DATABASE_URL in .env
npx prisma migrate dev
```

Then swap the `src/lib/data.ts` accessor functions (`getTasks`, `createTask`, `setTaskStatus`, …) for Prisma client calls — the function signatures and types (`src/lib/types.ts`) already match the schema.

## Theming

Brand colours are CSS variables in `src/app/globals.css` (`--brand`, `--brand-strong`, `--brand-soft`). Change those three values to re-skin the whole app.

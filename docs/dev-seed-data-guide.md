# Dev Seed Data System — Developer Guide

## What it does

The seed system injects realistic mock data (tasks, habits, goals) into the app on launch so developers can test the UI without manually creating items. It is **completely disabled in production** — one flag controls everything.

## Quick start

Open `src/config/devConfig.ts` and set the flags you need:

```ts
export const DEV_CONFIG = {
  SEED_ENABLED: true,          // ← flip this to enable/disable
  SEED_MODE: 'once',           // ← 'once' or 'always' (see below)
  SKIP_ONBOARDING: true,       // ← skip welcome/language screens
  DEFAULT_LANGUAGE: 'uk',      // ← 'uk' or 'en'
};
```

Reload Metro (`r` in the terminal) — done.

## Flags reference

### `SEED_ENABLED`

| Value | Behaviour |
|-------|-----------|
| `true` | Seed system is active (check SEED_MODE for details) |
| `false` | App behaves exactly as in production — storage is not touched |

### `SEED_MODE`

| Value | Behaviour |
|-------|-----------|
| `'once'` | Seeds only when **all three storages are empty**. Safe for daily dev work — your manual changes (toggling tasks complete, adding items) are preserved across restarts. |
| `'always'` | **Wipes all data and re-injects** seed on every launch. Use for demos, screenshots, or when you need a guaranteed clean state. |

> Switch between modes by editing one line in `devConfig.ts` — no cache clearing needed.

### `SKIP_ONBOARDING`

When `true`, the app skips the splash → language selection → welcome → create account flow and lands directly on the main tab navigator. Uses `DEFAULT_LANGUAGE` as the active language.

## What data is seeded

### Tasks — 25 total across 7 days (relative to today)

| Day | Count | Statuses | Notes |
|-----|-------|----------|-------|
| today−3 | 4 | 3 completed, 1 skipped | Past day with history |
| today−2 | 4 | 2 completed, 1 skipped, 1 pending | |
| today−1 | 4 | 2 completed, 2 pending | |
| **today** | **4** | **all pending** | **2 tasks overlap: 09:00–10:00 and 09:30–10:30** |
| today+1 | 3 | all pending | |
| today+2 | 3 | all pending | |
| today+3 | 3 | all pending | 2 with reminders enabled |

**Variety:** all 3 priorities, tags (`робота`, `здоровʼя`, `навчання`, `особисте`, `дім`), all 8 theme colours, mix of `estimatedDuration` values.

### Habits — 3 total (shown on today's Habits tab)

| Title | Recurrence | Streak |
|-------|-----------|--------|
| Ранкова зарядка | daily | 5 |
| Читання перед сном | daily | 3 |
| Медитація | weekly (Mon/Wed/Fri) | 2 |

### Goals — 2 total

| Title | Progress |
|-------|----------|
| Прочитати 12 книг | 4 / 12 |
| Пробігти 100 км | 37 / 100 |

Both goals have milestones and are linked from relevant tasks via `linkedGoalId`.

## Dates never go stale

All dates are generated **relative to today** at injection time using `dayOffset(n)` from `seed/tasks.ts`. The seed will always show data centred on the current date, regardless of when you run the app.

## File structure

```
seed/
├── tasks.ts     — getSeedTasks()  — 25 Task objects
├── habits.ts    — getSeedHabits() — 3 Habit objects
├── goals.ts     — getSeedGoals()  — 2 Goal objects
└── index.ts     — re-exports all three functions

src/config/
└── devConfig.ts — the only file you need to edit
```

## How injection works

`TasksContext.jsx` checks `DEV_CONFIG` on mount, before the persist-on-change guards activate:

```
if SEED_ENABLED:
  if SEED_MODE === 'always' OR all storages are empty:
    write seed data to storage
    set React state to seed data
    return (skip normal load)

// normal load path
setTasks(TaskStorage.getAll())
...
```

This means:
- `'once'` mode: first launch seeds, subsequent launches load normally from storage
- `'always'` mode: every launch replaces storage with fresh seed data

## Adding or editing seed data

Edit the relevant file in `seed/`:

```ts
// seed/tasks.ts — add a new task to any day:
{
  id: 'seed-task-026',          // must be unique
  type: 'task',
  title: 'Нова тестова задача',
  date: dayOffset(0),           // today
  startTime: '11:00',
  endTime: '12:00',
  status: 'pending',
  // ... other required fields
}
```

Use `dayOffset(n)` for `date` and `isoAt(n, 'HH:MM')` for `createdAt`/`updatedAt`/`completedAt`.

> **Important:** seed task IDs use the `seed-` prefix (e.g. `seed-task-001`). Keep this convention so seed items are easy to identify in logs.

## Before shipping

Set `SEED_ENABLED: false` and `SKIP_ONBOARDING: false` in `devConfig.ts`. The file is not gitignored — review it before every PR.

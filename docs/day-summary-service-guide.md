# DaySummaryService — Developer Guide

## What it does

`src/services/DaySummaryService.ts` is a **pure function** that takes a filtered array of tasks for a single day and returns a statistics object. No storage access, no side effects — safe to call anywhere.

## API

```ts
import { getDayStats } from '../services/DaySummaryService';
import type { DayStats } from '../services/DaySummaryService';

const stats: DayStats = getDayStats(tasksForDay);
```

### Input

`tasks: Task[]` — tasks already filtered for one day. The service does not filter by date itself — that is the caller's responsibility.

### Output: `DayStats`

| Field | Type | Description |
|-------|------|-------------|
| `completedCount` | `number` | Tasks with `status === 'completed'` |
| `totalCount` | `number` | All tasks passed in |
| `completionRate` | `number` | `Math.round(completedCount / totalCount * 100)`, `0` when empty |
| `actualMinutes` | `number` | Sum of `(endTime − startTime)` for completed tasks that have both times set and `end > start` |
| `estimatedMinutes` | `number` | Sum of `estimatedDuration` for completed tasks where it is not `null` |
| `uniqueTagsCount` | `number` | Count of distinct tag strings across all completed tasks |

## Status rules

| Status | Counts as completed? |
|--------|----------------------|
| `completed` | ✅ Yes |
| `pending` | ❌ No |
| `skipped` | ❌ No |
| `requires_review` | ❌ No — this is a transient AI-pipeline status |

## Usage examples

### HomeScreen stats card (current wiring)

```jsx
// HomeScreen.jsx
import { getDayStats } from '../services/DaySummaryService';

const tasksForDay = tasks.filter(t => toDateKey(t.createdAt) === selectedKey);
const stats = getDayStats(tasksForDay);

// In JSX:
<Text>{stats.completedCount}<Text>/{stats.totalCount}</Text></Text>
<Text>{stats.completionRate}%</Text>
```

### DaySummary screen (future)

```jsx
import { getDayStats } from '../services/DaySummaryService';

const stats = getDayStats(tasksForDay);
const actualHours = (stats.actualMinutes / 60).toFixed(1);
const estimatedHours = (stats.estimatedMinutes / 60).toFixed(1);

<Text>Виконано: {stats.completedCount} / {stats.totalCount}</Text>
<Text>Фактично витрачено: {actualHours} год</Text>
<Text>Оцінка: {estimatedHours} год</Text>
<Text>Унікальних тегів: {stats.uniqueTagsCount}</Text>
```

### Analytics across multiple days

```js
// Pass tasks filtered for each day separately:
const statsByDate = weekDates.map(date => ({
  date,
  stats: getDayStats(tasks.filter(t => t.date === date)),
}));
```

## Time calculation details

`actualMinutes` parses `startTime` and `endTime` as `"HH:MM"` strings:
- Both fields must be non-empty
- `endTime` must be **after** `startTime` (handles same-value default "09:00"/"09:00")
- Tasks that fail either check are **excluded** (not treated as 0)

`estimatedMinutes` uses the `estimatedDuration` field (stored in minutes):
- Tasks where `estimatedDuration === null` are excluded
- Tasks do **not** need to be scheduled (no `startTime` required)

## Tests

`__tests__/services/DaySummaryService.test.ts` — 14 tests covering:
- Empty array → all zeros
- Mixed statuses / requires_review exclusion
- Rounding (1/3 → 33%)
- actualMinutes edge cases (missing fields, reversed times)
- estimatedMinutes with null values
- uniqueTagsCount deduplication and non-completed exclusion

Run with: `npx jest __tests__/services/DaySummaryService.test.ts`

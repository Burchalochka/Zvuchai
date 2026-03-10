# Item Schema

**Template file:** `src/utils/itemDefaults.js`

Defines the data shape and default values for the three item types in Zvuchai: **task**, **habit**, and **goal**. All items share a common base; habits and goals extend it with type-specific fields.

---

## Tiers

Fields are grouped into three tiers reflecting when they are collected or populated:

| Tier | Description |
|---|---|
| **Essential** | Required to save the item — cannot be empty or null at creation |
| **Standard** | Shown in the creation form with sensible defaults; most users fill these in |
| **Advanced** | Hidden behind "more options" or populated automatically by the app |

---

## Base fields (all types)

| Field | Type | Tier | Default | Notes |
|---|---|---|---|---|
| `id` | `string` | Essential | generated | `Date.now().toString()` |
| `type` | `"task" \| "habit" \| "goal"` | Essential | — | Set by factory function |
| `title` | `string` | Essential | `""` | Required, non-empty |
| `status` | `"pending" \| "completed" \| "skipped"` | Essential | `"pending"` | |
| `createdAt` | ISO datetime string | Essential | generated | `new Date().toISOString()` |
| `description` | `string` | Standard | `""` | Optional |
| `date` | `"YYYY-MM-DD"` | Standard | generated | Day the item belongs to |
| `startTime` | `"HH:MM"` | Standard | `"09:00"` | |
| `endTime` | `"HH:MM"` | Standard | `"10:00"` | |
| `themeColor` | hex string | Standard | `"#E8E0D5"` | One of 8 palette colors |
| `priority` | `"low" \| "medium" \| "high"` | Standard | `"medium"` | |
| `dueDate` | `"YYYY-MM-DD" \| null` | Standard | `null` | |
| `deadline` | `"YYYY-MM-DD" \| null` | Standard | `null` | |
| `reminder` | object | Standard | see below | |
| `updatedAt` | ISO datetime string | Standard | generated | Updated on every write |
| `tags` | `string[]` | Advanced | `[]` | Free-form labels |
| `difficulty` | `"easy" \| "medium" \| "hard"` | Advanced | `"medium"` | |
| `estimatedDuration` | `number \| null` | Advanced | `null` | Minutes |
| `linkedGoalId` | `string \| null` | Advanced | `null` | ID of a goal this contributes to |
| `archived` | `boolean` | Advanced | `false` | Hides item without deleting |
| `completedAt` | ISO datetime \| `null` | Advanced | `null` | Auto-set when status → `"completed"` |
| `deletedAt` | ISO datetime \| `null` | Advanced | `null` | Auto-set on soft delete |

### `reminder` object

```json
{
  "mode": "before_start",
  "minutesBefore": 10,
  "time": null,
  "recurrent": false,
  "enabled": false
}
```

| Field | Type | Notes |
|---|---|---|
| `mode` | `"before_start" \| "at_time"` | `"before_start"` fires N minutes before `startTime`; `"at_time"` fires at an absolute time |
| `minutesBefore` | `number` | Used when `mode` is `"before_start"` |
| `time` | `"HH:MM" \| null` | Used when `mode` is `"at_time"` |
| `recurrent` | `boolean` | Repeats on the item's recurrence schedule (habits) or daily (tasks/goals) |
| `enabled` | `boolean` | Master toggle |

---

## Habit-only fields

| Field | Type | Tier | Default | Notes |
|---|---|---|---|---|
| `recurrence` | object | Essential | see below | Required — defines when the habit repeats |
| `streak` | `number` | Standard | `0` | Current consecutive completions |
| `bestStreak` | `number` | Advanced | `0` | All-time record |
| `completionDates` | `"YYYY-MM-DD"[]` | Advanced | `[]` | Full history; used to calculate streak |

### `recurrence` object

```json
{
  "type": "daily",
  "days": [0, 1, 2, 3, 4, 5, 6]
}
```

| Field | Type | Notes |
|---|---|---|
| `type` | `"daily" \| "weekly" \| "custom"` | |
| `days` | `number[]` | Weekday indices: 0 = Sunday, 6 = Saturday |

---

## Goal-only fields

| Field | Type | Tier | Default | Notes |
|---|---|---|---|---|
| `target.value` | `number` | Essential | `0` | Numeric goal target |
| `target.unit` | `string` | Essential | `""` | e.g. `"books"`, `"km"`, `"kg"` |
| `target.progress` | `number` | Standard | `0` | Current progress toward `value` |
| `target.targetDate` | `"YYYY-MM-DD" \| null` | Standard | `null` | Deadline |
| `target.milestones` | `object[]` | Advanced | `[]` | Intermediate checkpoints |

### `target.milestones` item

```json
{
  "id": "string",
  "title": "string",
  "value": 0,
  "completedAt": null
}
```

---

## Factory functions

The template file exports three factory functions that generate dynamic fields at call time and accept overrides:

```js
import { createTask, createHabit, createGoal } from '../utils/itemDefaults';

const task  = createTask({ title: 'Buy milk', priority: 'low' });
const habit = createHabit({ title: 'Morning run', recurrence: { type: 'weekly', days: [1,3,5] } });
const goal  = createGoal({ title: 'Read 50 books', target: { value: 50, unit: 'books', progress: 0, targetDate: '2026-12-31', milestones: [] } });
```

Each function merges its type defaults with the provided overrides and injects:
- `id` — `Date.now().toString()`
- `date` — today as `YYYY-MM-DD`
- `createdAt` / `updatedAt` — current ISO datetime

---

## Full JSON examples

### Task

```json
{
  "id": "1741001234567",
  "type": "task",
  "title": "Design new homepage",
  "description": "Wireframe and prototype",
  "date": "2026-03-03",
  "startTime": "09:00",
  "endTime": "10:00",
  "status": "pending",
  "themeColor": "#BAE1FF",
  "priority": "high",
  "difficulty": "medium",
  "estimatedDuration": 60,
  "dueDate": "2026-03-05",
  "deadline": null,
  "tags": ["work", "design"],
  "reminder": {
    "mode": "before_start",
    "minutesBefore": 15,
    "time": null,
    "recurrent": false,
    "enabled": true
  },
  "linkedGoalId": null,
  "completedAt": null,
  "archived": false,
  "deletedAt": null,
  "createdAt": "2026-03-03T08:00:00.000Z",
  "updatedAt": "2026-03-03T08:00:00.000Z"
}
```

### Habit

```json
{
  "id": "1741001234890",
  "type": "habit",
  "title": "Morning run",
  "description": "5km in the park",
  "date": "2026-03-03",
  "startTime": "07:00",
  "endTime": "07:45",
  "status": "completed",
  "themeColor": "#BAFFC9",
  "priority": "medium",
  "difficulty": "medium",
  "estimatedDuration": 45,
  "dueDate": null,
  "deadline": null,
  "tags": ["health", "fitness"],
  "reminder": {
    "mode": "before_start",
    "minutesBefore": 10,
    "time": null,
    "recurrent": true,
    "enabled": true
  },
  "linkedGoalId": null,
  "recurrence": {
    "type": "weekly",
    "days": [1, 2, 3, 4, 5]
  },
  "streak": 7,
  "bestStreak": 14,
  "completionDates": ["2026-02-25", "2026-02-26", "2026-02-27", "2026-03-02", "2026-03-03"],
  "completedAt": "2026-03-03T07:50:00.000Z",
  "archived": false,
  "deletedAt": null,
  "createdAt": "2026-03-01T07:00:00.000Z",
  "updatedAt": "2026-03-03T07:50:00.000Z"
}
```

### Goal

```json
{
  "id": "1741001235001",
  "type": "goal",
  "title": "Read 50 books",
  "description": "Non-fiction focus",
  "date": "2026-03-03",
  "startTime": "20:00",
  "endTime": "21:00",
  "status": "pending",
  "themeColor": "#D4A5F5",
  "priority": "high",
  "difficulty": "hard",
  "estimatedDuration": null,
  "dueDate": null,
  "deadline": null,
  "tags": ["learning", "personal"],
  "reminder": {
    "mode": "at_time",
    "minutesBefore": null,
    "time": "20:00",
    "recurrent": true,
    "enabled": true
  },
  "linkedGoalId": null,
  "target": {
    "value": 50,
    "unit": "books",
    "progress": 12,
    "targetDate": "2026-12-31",
    "milestones": [
      { "id": "m1", "title": "First 10 books", "value": 10, "completedAt": "2026-02-15T21:00:00.000Z" },
      { "id": "m2", "title": "Halfway there", "value": 25, "completedAt": null }
    ]
  },
  "completedAt": null,
  "archived": false,
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-03-03T21:05:00.000Z"
}
```

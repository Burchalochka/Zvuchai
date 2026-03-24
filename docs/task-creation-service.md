# Task Creation Service

## Overview

This document covers the business-logic layer for creating tasks in Zvuchai. Before a task is saved to storage, it is validated against two scheduling constraints and an AI confidence gate. The service lives in `src/services/TaskCreationService.ts`.

---

## Files

| File | Purpose |
|------|---------|
| `src/services/TaskCreationService.ts` | Main service — `createTask()` |
| `src/utils/timeUtils.ts` | Pure utility — `checkTimeOverlap()` |
| `src/types/index.ts` | `ItemStatus` now includes `'requires_review'` |
| `__tests__/services/TaskCreationService.test.ts` | Unit tests (5 cases) |

---

## createTask()

```ts
import { createTask } from '../services/TaskCreationService';

createTask(
  taskPayload: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  options?: {
    forceSave?: boolean;       // bypass all validation
    confidenceScore?: number;  // AI confidence 0–100, omit for manual tasks
  }
): Task
```

Generates an `id`, sets `createdAt`/`updatedAt`, persists to storage, and returns the full task.

---

## Validation flow

```
createTask(payload, options?)
    │
    ├─ payload.date or startTime missing?
    │   └─ YES → skip all time checks, go straight to confidence gate
    │
    ├─ options.forceSave === true?
    │   └─ YES → skip all time checks, go straight to confidence gate
    │
    ├─ Dead zone check
    │   └─ task time overlaps a dead zone?
    │       └─ YES → throw DEAD_ZONE_CONFLICT (task NOT saved)
    │
    ├─ Task overlap check
    │   └─ task time overlaps an existing task on the same date?
    │       └─ YES → throw TASK_OVERLAP (task NOT saved)
    │
    └─ Confidence gate
        └─ confidenceScore < 80?
            ├─ YES → force status = 'requires_review'
            └─ NO  → keep status from payload
                │
                └─ Save task → return Task
```

---

## Error types

Both errors are plain objects (not `Error` instances), so `catch` them with a type-narrowing check on `code`.

### DEAD_ZONE_CONFLICT

Thrown when the task's scheduled time falls inside one of the user's configured dead zones (e.g. Sleep 23:00–07:00).

```ts
{
  code: 'DEAD_ZONE_CONFLICT';
  zoneName: string;   // e.g. "Сон"
  message: string;    // human-readable, currently Ukrainian
}
```

### TASK_OVERLAP

Thrown when the task's time window collides with an existing scheduled task on the same date.

```ts
{
  code: 'TASK_OVERLAP';
  conflictingTaskTitle: string;  // title of the blocking task
  message: string;
}
```

---

## Usage examples

### 1. Manual task creation (no AI)

```ts
import { createTask } from '../services/TaskCreationService';

const task = createTask({
  type: 'task',
  title: 'Buy groceries',
  date: '2026-03-18',
  startTime: '10:00',
  endTime: '10:30',
  estimatedDuration: 30,
  status: 'pending',
  // ... other required fields
});
```

If the time slot is free the task is saved and returned. If it conflicts with a dead zone or another task, the function throws — catch it and show a confirmation dialog.

---

### 2. Handling conflicts on the frontend

```ts
import { createTask, TaskCreationError } from '../services/TaskCreationService';
import { translations } from '../utils/translations';

async function handleSave(payload, language) {
  const t = translations[language];

  try {
    const task = createTask(payload);
    dispatch({ type: 'ADD_TASK', task });
  } catch (err) {
    const e = err as TaskCreationError;

    if (e.code === 'DEAD_ZONE_CONFLICT') {
      Alert.alert(
        `${t.deadZoneTitle}: ${e.zoneName}`,
        t.deadZoneConflictMessage,
        [
          { text: t.cancel, style: 'cancel' },
          {
            text: t.save,
            onPress: () => {
              const task = createTask(payload, { forceSave: true });
              dispatch({ type: 'ADD_TASK', task });
            },
          },
        ],
      );
    }

    if (e.code === 'TASK_OVERLAP') {
      Alert.alert(
        e.conflictingTaskTitle,
        t.taskOverlapMessage,
        [
          { text: t.cancel, style: 'cancel' },
          {
            text: t.save,
            onPress: () => {
              const task = createTask(payload, { forceSave: true });
              dispatch({ type: 'ADD_TASK', task });
            },
          },
        ],
      );
    }
  }
}
```

---

### 3. AI voice pipeline

Pass `confidenceScore` from the Gemini response. If it is below 80 the task is automatically routed to the Inbox (`status: 'requires_review'`) regardless of what the AI returned.

```ts
const aiResult = await parseVoiceNote(transcript); // Gemini response

const task = createTask(
  {
    ...aiResult.task,
    status: aiResult.task.status ?? 'pending',
  },
  {
    confidenceScore: aiResult._meta.confidence, // e.g. 65
  },
);
// If confidence was 65, task.status === 'requires_review'
// The _meta block is never passed into the payload
```

---

### 4. Unscheduled task (no date/time)

```ts
// No date → all time checks are skipped automatically.
const task = createTask({
  type: 'task',
  title: 'Someday: read a book',
  date: null,
  startTime: '',
  // ...
});
```

---

## checkTimeOverlap()

A pure utility used internally by the service. Exposed for reuse if needed.

```ts
import { checkTimeOverlap } from '../utils/timeUtils';

checkTimeOverlap(
  taskStartISO: string | null,  // ISO datetime, null = unscheduled
  durationMinutes: number,       // use estimatedDuration ?? 0
  deadZone: DeadZone,            // { startTime: 'HH:mm', endTime: 'HH:mm', ... }
): boolean
```

Handles:
- Zones that cross midnight (e.g. `23:00`–`07:00`)
- Tasks with no scheduled time (`null` → always `false`)
- Zero-duration tasks (point events — overlap fires if `startTime` is inside the zone)

---

## Dead zones

Dead zones are stored in `UserPreferences` via `PreferencesStorage`. Each zone has a name, start time, and end time (both `"HH:mm"`).

```ts
interface DeadZone {
  id: string;
  name: string;      // e.g. 'Сон', 'Особистий час'
  startTime: string; // 'HH:mm'
  endTime: string;   // 'HH:mm'
}
```

The service reads them automatically — no extra setup required per call.

---

## Running tests

```bash
npx jest __tests__/services/TaskCreationService.test.ts
```

The 5 test cases cover:
1. Dead zone conflict fires for a 02:00 task (Sleep zone 23:00–07:00)
2. `forceSave: true` bypasses the conflict and saves
3. `date: null` saves without running any checks
4. `confidenceScore: 65` forces `status: 'requires_review'`
5. Task-task overlap is detected and throws `TASK_OVERLAP`

---

## Known limitations / TODOs

- **i18n in service layer:** error `message` strings are currently hardcoded in Ukrainian. Once a non-React translation helper is available, pass `language` through `options` and use `getTranslation()`.
- **`TasksContext` wiring:** the context `addTask` is still a raw setter. Screens should call `createTask()` first, then dispatch the returned task to context on success. This wiring is a separate task.

# Local Storage — Developer Guide

## Overview

Zvuchai uses **react-native-mmkv v3** for local persistence. MMKV is a fast key-value store backed by native C++. It is synchronous (no `await` needed) and survives app restarts.

**Dependency note:** MMKV v3 does not use NitroModules. This is intentional — v4 was incompatible with `react-native-nitro-sound@0.2.10` (which requires an older nitro-modules ABI). Do not upgrade mmkv to v4 without first resolving this conflict.

---

## File Map

```
src/
├── storage/storage.ts          # MMKV singleton — import this to read/write raw keys
├── types/index.ts              # TypeScript interfaces for Task, Habit, Goal, UserPreferences
└── services/StorageService.ts  # Typed adapters — use these, not the raw singleton
```

---

## How Persistence Works

`TasksContext.jsx` owns all state. Storage is wired inside it with three rules:

1. **On mount** — reads all arrays from MMKV and hydrates state
2. **On change** — any state update automatically saves to MMKV
3. **Guard** — a `loaded` ref prevents saving before hydration (which would overwrite stored data with empty arrays)

You do not need to call save manually anywhere. Add/delete/toggle via context and persistence is automatic.

---

## CRUD — How to Use

### Reading data
```js
import { useTasks } from '../context/TasksContext';

const { tasks, habits, goals } = useTasks();
```

### Adding an item
Use the factory functions from `src/utils/itemDefaults.js`, then pass to context:

```js
import { createTask } from '../utils/itemDefaults';
import { useTasks } from '../context/TasksContext';

const { addTask } = useTasks();

const task = createTask({ title: 'Buy groceries', date: '2026-03-15' });
addTask(task); // saved to MMKV automatically
```

### Toggling complete
```js
const { toggleTaskComplete, toggleHabitComplete, toggleGoalComplete } = useTasks();

toggleTaskComplete(task.id); // flips status between 'pending' and 'completed'
```

### Deleting
```js
const { deleteTask, deleteHabit, deleteGoal } = useTasks();

deleteTask(task.id);
```

---

## Adding a New Persisted Field

If you add a field to an existing type (e.g. add `pinned: boolean` to `Task`):

1. Add it to the interface in [src/types/index.ts](../src/types/index.ts)
2. Add a default value in the factory function in [src/utils/itemDefaults.js](../src/utils/itemDefaults.js)
3. No storage changes needed — the whole array is serialized as JSON on every save

---

## Adding a New Persisted Entity

Example: adding `Journal` entries.

1. Add `Journal` interface to [src/types/index.ts](../src/types/index.ts)
2. Add `JournalStorage` adapter to [src/services/StorageService.ts](../src/services/StorageService.ts):
   ```ts
   export const JournalStorage = {
     getAll: (): Journal[] => readAll<Journal>('journals'),
     saveAll: (items: Journal[]): void => writeAll('journals', items),
   };
   ```
3. Add `journals` state + load/save effects + CRUD methods to `TasksContext.jsx`
4. Expose via context value

---

## UserPreferences

Preferences (including DeadZones) are stored as a single JSON object under key `user_preferences`.

```ts
import { PreferencesStorage } from '../services/StorageService';

// Read
const prefs = PreferencesStorage.get(); // UserPreferences | null

// Write
PreferencesStorage.save({ deadZones: [...], eveningReportTime: '21:00' });
```

No UI for preferences exists yet — this is ready for when settings screens are built.

---

## Storage Keys Reference

| Key                | Type              | Managed by        |
|--------------------|-------------------|-------------------|
| `tasks`            | `Task[]`          | TasksContext      |
| `habits`           | `Habit[]`         | TasksContext      |
| `goals`            | `Goal[]`          | TasksContext      |
| `user_preferences` | `UserPreferences` | PreferencesStorage (manual) |

---

## What Clears Storage

| Action | Clears MMKV? |
|--------|-------------|
| App restart | No |
| Metro restart | No |
| `./gradlew clean` / rebuild | No |
| Uninstall app | Yes |
| Android Settings → Apps → Clear Data | Yes |
| `storage.clearAll()` in code | Yes |

---

## First-Time Setup (new developer)

```bash
npm install
cd android
Remove-Item -Recurse -Force app/.cxx   # PowerShell (Windows)
# or: rm -rf app/.cxx                  # bash/macOS
cd ..
npm run android
```

The `.cxx` wipe is a one-time step needed because MMKV has native C++ code that must be compiled fresh.

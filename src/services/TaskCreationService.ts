import type { Task } from '../types';
import { TaskStorage, PreferencesStorage } from './StorageService';
import { checkTimeOverlap } from '../utils/timeUtils';

// ─── Error types ─────────────────────────────────────────────────────────────

export interface DeadZoneConflictError {
  code: 'DEAD_ZONE_CONFLICT';
  /** Name of the dead zone that the task falls into (e.g. "Сон"). */
  zoneName: string;
  message: string;
}

export interface TaskOverlapError {
  code: 'TASK_OVERLAP';
  /** Title of the existing task whose time window overlaps with the new one. */
  conflictingTaskTitle: string;
  message: string;
}

export type TaskCreationError = DeadZoneConflictError | TaskOverlapError;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const newId = () => Date.now().toString();
const now = () => new Date().toISOString();

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Creates a new task, enforces scheduling constraints, and persists it to
 * storage.
 *
 * **Dead zone check** — if the task's scheduled time falls within any of the
 * user's configured dead zones (e.g. Sleep 23:00–07:00), the task is **not**
 * saved and a `DEAD_ZONE_CONFLICT` error is thrown. The frontend should catch
 * this and ask the user to confirm before retrying with `forceSave: true`.
 *
 * **Task overlap check** — if the task's time window overlaps an existing
 * scheduled task on the same date, a `TASK_OVERLAP` error is thrown with the
 * title of the conflicting task. The frontend should again ask the user to
 * confirm before retrying with `forceSave: true`.
 *
 * **Unscheduled tasks** — if `taskPayload.date` is `null` or
 * `taskPayload.startTime` is empty, all time-based checks are skipped
 * automatically (no time = no conflict).
 *
 * **Confidence gate** — if `taskPayload.confidenceScore` is below 80 (AI
 * parsed the voice note with low confidence) the task's status is forced to
 * `'requires_review'` so it appears in the Inbox regardless of what the AI
 * returned.
 *
 * @param taskPayload All task fields except `id`, `createdAt`, and `updatedAt`.
 * @param options.forceSave When `true`, skips ALL scheduling validation (dead
 *   zones + task overlaps) and saves immediately. Use after the user has
 *   explicitly confirmed a conflict dialog.
 * @param options.confidenceScore AI parsing confidence (0–100). Omit or pass
 *   `undefined` for manually created tasks (treated as 100). When below 80 the
 *   task's status is forced to `'requires_review'` regardless of what the AI
 *   returned.
 *
 * @throws {DeadZoneConflictError} Task time overlaps a dead zone.
 * @throws {TaskOverlapError} Task time overlaps an existing task.
 *
 * @returns The fully populated, persisted Task object (including generated id).
 */
export function createTask(
  taskPayload: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  options?: { forceSave?: boolean; confidenceScore?: number },
): Task {
  const existingTasks = TaskStorage.getAll();

  // Build a combined ISO datetime for time-overlap checks.
  // If either date or startTime is missing the task is unscheduled — skip checks.
  const taskStartISO =
    taskPayload.date && taskPayload.startTime
      ? `${taskPayload.date}T${taskPayload.startTime}:00`
      : null;

  if (options?.forceSave !== true && taskStartISO !== null) {
    // ── Dead zone validation ────────────────────────────────────────────────
    const prefs = PreferencesStorage.get();
    if (prefs) {
      for (const dz of prefs.deadZones) {
        if (checkTimeOverlap(taskStartISO, taskPayload.estimatedDuration ?? 0, dz)) {
          const err: DeadZoneConflictError = {
            code: 'DEAD_ZONE_CONFLICT',
            zoneName: dz.name,
            // TODO: pass `language` into this service once a non-React i18n
            // layer is available. For now, Ukrainian is used as the default.
            message: 'Ця задача потрапляє на ваш час відпочинку',
          };
          throw err;
        }
      }
    }

    // ── Task overlap validation ─────────────────────────────────────────────
    const scheduledOnSameDay = existingTasks.filter(
      (t) =>
        t.date === taskPayload.date &&
        t.startTime &&
        t.endTime &&
        !t.archived &&
        t.deletedAt === null,
    );

    for (const existing of scheduledOnSameDay) {
      // Re-use checkTimeOverlap by treating the existing task as a zone.
      // Its startTime/endTime act as dzStart/dzEnd.
      const existingAsZone = {
        id: existing.id,
        name: existing.title,
        startTime: existing.startTime,
        endTime: existing.endTime,
      };
      if (checkTimeOverlap(taskStartISO, taskPayload.estimatedDuration ?? 0, existingAsZone)) {
        const err: TaskOverlapError = {
          code: 'TASK_OVERLAP',
          conflictingTaskTitle: existing.title,
          // TODO: same i18n note as above.
          message: 'Цей час вже зайнятий іншою задачею',
        };
        throw err;
      }
    }
  }

  // ── Confidence gate ─────────────────────────────────────────────────────────
  // If the AI parsed the voice note with low confidence, force the task into
  // the Inbox for manual review regardless of the status the AI suggested.
  // Confidence is a transient pipeline value — it is not stored on the task.
  const confidence = options?.confidenceScore ?? 100;
  const status = confidence < 80 ? 'requires_review' : taskPayload.status;

  // ── Persist ─────────────────────────────────────────────────────────────────
  const newTask: Task = {
    ...taskPayload,
    status,
    id: newId(),
    createdAt: now(),
    updatedAt: now(),
  };

  TaskStorage.saveAll([...existingTasks, newTask]);

  return newTask;
}

import type { Task } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayStats {
  /** Tasks with status === 'completed'. */
  completedCount: number;
  /** Total tasks passed in (all statuses). */
  totalCount: number;
  /** completedCount / totalCount * 100, rounded. 0 when totalCount is 0. */
  completionRate: number;
  /** Sum of (endTime − startTime) in minutes for completed tasks that have
   *  both startTime and endTime set. */
  actualMinutes: number;
  /** Sum of estimatedDuration (minutes) for completed tasks where the field
   *  is not null. */
  estimatedMinutes: number;
  /** Number of distinct tag strings across all completed tasks. */
  uniqueTagsCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "HH:MM" → total minutes from midnight. Returns null on bad input. */
function parseMinutes(time: string | undefined | null): number | null {
  if (!time) return null;
  const parts = time.split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function getNowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Computes daily statistics from a pre-filtered array of tasks.
 *
 * Pure function — no storage access, no side effects.
 *
 * @param tasks Tasks for a single day (already filtered by date by the caller).
 */
export function getDayStats(
  tasks: Task[],
  opts?: { applyAutoDone?: boolean; now?: Date }
): DayStats {
  if (tasks.length === 0) {
    return {
      completedCount: 0,
      totalCount: 0,
      completionRate: 0,
      actualMinutes: 0,
      estimatedMinutes: 0,
      uniqueTagsCount: 0,
    };
  }

  const now = opts?.now || new Date();
  const nowMin = getNowMinutes(now);
  const applyAutoDone = !!opts?.applyAutoDone;

  const completed = tasks.filter((t) => {
    if (t.status === 'completed') return true;
    if (!applyAutoDone) return false;
    const end = parseMinutes(t.endTime);
    if (end === null) return false;
    return end <= nowMin;
  });

  // ── actualMinutes ────────────────────────────────────────────────────────────
  let actualMinutes = 0;
  for (const task of completed) {
    const start = parseMinutes(task.startTime);
    const end = parseMinutes(task.endTime);
    if (start !== null && end !== null && end > start) {
      actualMinutes += end - start;
    }
  }

  // ── estimatedMinutes ─────────────────────────────────────────────────────────
  let estimatedMinutes = 0;
  for (const task of completed) {
    if (task.estimatedDuration !== null && task.estimatedDuration !== undefined) {
      estimatedMinutes += task.estimatedDuration;
    }
  }

  // ── uniqueTagsCount ──────────────────────────────────────────────────────────
  const tagSet = new Set<string>();
  for (const task of completed) {
    if (Array.isArray(task.tags)) {
      for (const tag of task.tags) {
        tagSet.add(tag);
      }
    }
  }

  return {
    completedCount: completed.length,
    totalCount: tasks.length,
    completionRate: Math.round((completed.length / tasks.length) * 100),
    actualMinutes,
    estimatedMinutes,
    uniqueTagsCount: tagSet.size,
  };
}

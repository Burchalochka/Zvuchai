import type { DeadZone } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parses an "HH:mm" string into total minutes from midnight (0–1439). */
function parseHHmm(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Standard half-open interval overlap: [aStart, aEnd) overlaps [bStart, bEnd). */
function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Checks whether a task's scheduled time window overlaps a dead zone (or any
 * time interval represented as a DeadZone).
 *
 * **Midnight-crossing zones** (e.g. Sleep 23:00–07:00) are handled correctly
 * by splitting the zone into two sub-ranges: [dzStart, 1440) ∪ [0, dzEnd).
 *
 * **Edge cases:**
 * - If `taskStartISO` is `null` or empty the task has no scheduled time and
 *   the function always returns `false` (no time = no conflict).
 * - If `durationMinutes` is `0` the task is treated as a point event: overlap
 *   fires when the start moment falls *inside* the zone (inclusive start,
 *   exclusive end boundary).
 * - Tasks that are long enough to cross midnight are handled by splitting the
 *   task range symmetrically.
 *
 * @param taskStartISO   ISO 8601 datetime of the task start
 *                       (e.g. `"2026-03-17T02:00:00"`). Pass `null` to skip.
 * @param durationMinutes Task duration in minutes. Use `estimatedDuration ?? 0`.
 * @param deadZone       DeadZone (or any interval) with `startTime`/`endTime`
 *                       formatted as `"HH:mm"`.
 * @returns `true` if the task window overlaps the dead zone.
 */
export function checkTimeOverlap(
  taskStartISO: string | null,
  durationMinutes: number,
  deadZone: DeadZone,
): boolean {
  if (!taskStartISO) return false;

  const d = new Date(taskStartISO);
  const taskStart = d.getHours() * 60 + d.getMinutes();

  const dzStart = parseHHmm(deadZone.startTime);
  const dzEnd = parseHHmm(deadZone.endTime);

  // ── Point event ────────────────────────────────────────────────────────────
  if (durationMinutes === 0) {
    if (dzStart < dzEnd) {
      // Normal zone: startTime is before endTime
      return taskStart >= dzStart && taskStart < dzEnd;
    } else {
      // Zone crosses midnight (e.g. 23:00–07:00)
      return taskStart >= dzStart || taskStart < dzEnd;
    }
  }

  // ── Ranged event ───────────────────────────────────────────────────────────
  const taskEnd = taskStart + durationMinutes;

  if (dzStart < dzEnd) {
    // Normal zone (same calendar day)
    if (taskEnd <= 1440) {
      // Task stays within the same day
      return rangesOverlap(taskStart, taskEnd, dzStart, dzEnd);
    } else {
      // Task crosses midnight: split into [taskStart, 1440) + [0, taskEnd-1440)
      return (
        rangesOverlap(taskStart, 1440, dzStart, dzEnd) ||
        rangesOverlap(0, taskEnd - 1440, dzStart, dzEnd)
      );
    }
  } else {
    // Zone crosses midnight: split into [dzStart, 1440) + [0, dzEnd)
    if (taskEnd <= 1440) {
      // Task stays within the same day
      return (
        rangesOverlap(taskStart, taskEnd, dzStart, 1440) ||
        rangesOverlap(taskStart, taskEnd, 0, dzEnd)
      );
    } else {
      // Both task and zone cross midnight — they must overlap
      return true;
    }
  }
}

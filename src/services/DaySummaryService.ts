import type { Task } from '../types';

export interface DayStats {
  completedCount: number;
  totalCount: number;
  completionRate: number;
  actualMinutes: number;
  estimatedMinutes: number;
  uniqueTagsCount: number;
}

function parseMinutes(time: string | undefined | null): number | null {
  if (!time) return null;
  const parts = time.split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function getDayStats(tasks: Task[]): DayStats {
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

  /**
   * «Виконано» для статистики дня — лише ручна відмітка та override:
   * - `autoDoneOverride === 'completed'` — явно зараховано.
   * - `autoDoneOverride === 'pending'` — явно не зараховувати (навіть якщо `status === 'completed'`).
   * - Інакше: `status === 'completed'`.
   */
  const completed = tasks.filter((t) => {
    if (t.autoDoneOverride === 'pending') return false;
    if (t.autoDoneOverride === 'completed') return true;
    return t.status === 'completed';
  });

  let actualMinutes = 0;
  for (const task of completed) {
    const start = parseMinutes(task.startTime);
    const end = parseMinutes(task.endTime);
    if (start !== null && end !== null && end > start) {
      actualMinutes += end - start;
    }
  }

  let estimatedMinutes = 0;
  for (const task of completed) {
    if (task.estimatedDuration !== null && task.estimatedDuration !== undefined) {
      estimatedMinutes += task.estimatedDuration;
    }
  }

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

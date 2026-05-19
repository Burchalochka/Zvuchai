/**
 * Performance Test — PT-01
 *
 * Verifies that getDayStats executes well within the 10 ms budget even for
 * large realistic task arrays. The budget is derived from the 60 FPS frame
 * constraint (16.67 ms per frame); 10 ms gives safe headroom.
 */

import { getDayStats } from '../../src/services/DaySummaryService';
import type { Task } from '../../src/types';

// ─── Fixture generator ────────────────────────────────────────────────────────

const TAG_POOL = ['work', 'health', 'focus', 'personal', 'urgent', 'reading', 'fitness', 'learning', 'family', 'finance'];
const STATUSES: Task['status'][] = ['completed', 'completed', 'pending', 'skipped', 'completed'];

function generateTasks(count: number): Task[] {
  const tasks: Task[] = [];

  for (let i = 0; i < count; i++) {
    const startHour = 8 + (i % 14); // 08:00 – 21:00
    const durationMin = 30 + (i % 4) * 30; // 30 | 60 | 90 | 120 min
    const endTotalMin = startHour * 60 + durationMin;
    const endHour = Math.floor(endTotalMin / 60) % 24;
    const endMin = endTotalMin % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    const status = STATUSES[i % STATUSES.length];

    tasks.push({
      id: String(i),
      type: 'task',
      title: `Task ${i}`,
      description: '',
      date: '2026-04-22',
      startTime: `${pad(startHour)}:00`,
      endTime: `${pad(endHour)}:${pad(endMin)}`,
      status,
      themeColor: '#FCFFC6',
      priority: 'medium',
      difficulty: 'medium',
      estimatedDuration: durationMin,
      dueDate: null,
      deadline: null,
      tags: [TAG_POOL[i % TAG_POOL.length], TAG_POOL[(i + 3) % TAG_POOL.length]],
      reminder: { mode: 'before_start', minutesBefore: 10, time: null, recurrent: false, enabled: false },
      linkedGoalId: null,
      voiceNote: null,
      completedAt: status === 'completed' ? '2026-04-22T10:00:00.000Z' : null,
      archived: false,
      deletedAt: null,
      createdAt: '2026-04-22T08:00:00.000Z',
      updatedAt: '2026-04-22T08:00:00.000Z',
      autoDoneOverride: null,
      sortIndex: null,
      isInbox: false,
      startDate: null,
      endDate: null,
    });
  }

  return tasks;
}

// ─── PT-01 ────────────────────────────────────────────────────────────────────

describe('PT-01: getDayStats — продуктивність при великому наборі даних', () => {
  const BUDGET_MS = 10;

  it.each([
    [50],
    [100],
    [250],
    [500],
    [1000],
  ])('getDayStats(%i задач) виконується менше ніж %i мс', (count) => {
    const tasks = generateTasks(count);

    const start = performance.now();
    const stats = getDayStats(tasks);
    const elapsed = performance.now() - start;

    console.log(`getDayStats(${count} tasks): ${elapsed.toFixed(3)} ms`);

    expect(elapsed).toBeLessThan(BUDGET_MS);

    // Smoke-check: result is non-trivial
    expect(stats.totalCount).toBe(count);
    expect(stats.completedCount).toBeGreaterThan(0);
    expect(stats.completionRate).toBeGreaterThan(0);
  });

  it('результат є детермінованим — два послідовних виклики повертають однакові дані', () => {
    const tasks = generateTasks(500);

    const a = getDayStats(tasks);
    const b = getDayStats(tasks);

    expect(a).toEqual(b);
  });

  it('складність є лінійною — час для 1000 задач не перевищує 10× часу для 100', () => {
    const small = generateTasks(100);
    const large = generateTasks(1000);

    const t100Start = performance.now();
    getDayStats(small);
    const t100 = performance.now() - t100Start;

    const t1000Start = performance.now();
    getDayStats(large);
    const t1000 = performance.now() - t1000Start;

    console.log(`t100=${t100.toFixed(3)} ms, t1000=${t1000.toFixed(3)} ms, ratio=${(t1000 / (t100 || 0.001)).toFixed(1)}×`);

    // Лінійна складність: 10× більше даних → не більше ніж 15× часу (з запасом на JIT)
    expect(t1000).toBeLessThan(Math.max(t100 * 15, BUDGET_MS));
  });
});

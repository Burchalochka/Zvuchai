import { getDayStats } from '../../src/services/DaySummaryService';
import type { Task } from '../../src/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Build a minimal Task. Only override what the test cares about. */
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: Math.random().toString(),
    type: 'task',
    title: 'Task',
    description: '',
    date: '2026-03-24',
    startTime: '09:00',
    endTime: '10:00',
    status: 'pending',
    themeColor: '#FCFFC6',
    priority: 'medium',
    difficulty: 'medium',
    estimatedDuration: null,
    dueDate: null,
    deadline: null,
    tags: [],
    reminder: { mode: 'before_start', minutesBefore: 10, time: null, recurrent: false, enabled: false },
    linkedGoalId: null,
    voiceNote: null,
    completedAt: null,
    archived: false,
    deletedAt: null,
    createdAt: '2026-03-24T08:00:00.000Z',
    updatedAt: '2026-03-24T08:00:00.000Z',
    ...overrides,
  };
}

const completed = (overrides: Partial<Task> = {}) =>
  makeTask({ status: 'completed', completedAt: '2026-03-24T10:00:00.000Z', ...overrides });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getDayStats', () => {
  // ── Empty input ─────────────────────────────────────────────────────────────

  /**
   * Test 1: Empty array
   *
   * With no tasks the service must return all-zero stats without throwing.
   */
  it('returns all zeros for an empty task array', () => {
    const stats = getDayStats([]);

    expect(stats).toEqual({
      completedCount: 0,
      totalCount: 0,
      completionRate: 0,
      actualMinutes: 0,
      estimatedMinutes: 0,
      uniqueTagsCount: 0,
    });
  });

  // ── Completion counts ────────────────────────────────────────────────────────

  /**
   * Test 2: No completed tasks
   *
   * Pending/skipped/requires_review tasks must not increment completedCount.
   */
  it('returns completedCount=0 when no tasks are completed', () => {
    const tasks = [
      makeTask({ status: 'pending' }),
      makeTask({ status: 'skipped' }),
      makeTask({ status: 'requires_review' }),
    ];

    const { completedCount, totalCount, completionRate } = getDayStats(tasks);

    expect(completedCount).toBe(0);
    expect(totalCount).toBe(3);
    expect(completionRate).toBe(0);
  });

  /**
   * Test 3: All tasks completed
   */
  it('returns completedCount === totalCount when all tasks are completed', () => {
    const tasks = [completed(), completed(), completed()];

    const { completedCount, totalCount, completionRate } = getDayStats(tasks);

    expect(completedCount).toBe(3);
    expect(totalCount).toBe(3);
    expect(completionRate).toBe(100);
  });

  /**
   * Test 4: Mixed statuses
   *
   * 2 completed out of 5 → 40%.
   */
  it('counts only completed tasks in completedCount', () => {
    const tasks = [
      completed(),
      completed(),
      makeTask({ status: 'pending' }),
      makeTask({ status: 'skipped' }),
      makeTask({ status: 'requires_review' }),
    ];

    const { completedCount, totalCount, completionRate } = getDayStats(tasks);

    expect(completedCount).toBe(2);
    expect(totalCount).toBe(5);
    expect(completionRate).toBe(40);
  });

  /**
   * Test 5: requires_review must NOT count as completed
   *
   * This status is a transient Inbox state for low-confidence AI tasks.
   */
  it('does not count requires_review as completed', () => {
    const tasks = [makeTask({ status: 'requires_review' })];

    const { completedCount } = getDayStats(tasks);

    expect(completedCount).toBe(0);
  });

  it('counts autoDoneOverride completed even when status is pending', () => {
    const tasks = [makeTask({ status: 'pending', autoDoneOverride: 'completed' })];

    expect(getDayStats(tasks).completedCount).toBe(1);
  });

  it('does not count autoDoneOverride pending even when status is completed', () => {
    const tasks = [completed({ autoDoneOverride: 'pending' })];

    expect(getDayStats(tasks).completedCount).toBe(0);
  });

  /**
   * Test 6: completionRate rounds correctly
   *
   * 1 / 3 = 33.33... → should round to 33.
   */
  it('rounds completionRate to the nearest integer', () => {
    const tasks = [completed(), makeTask(), makeTask()];

    const { completionRate } = getDayStats(tasks);

    expect(completionRate).toBe(33);
  });

  // ── actualMinutes ────────────────────────────────────────────────────────────

  /**
   * Test 7: actualMinutes sums startTime→endTime diffs for completed tasks
   *
   * Task A: 09:00–10:30 = 90 min
   * Task B: 14:00–15:00 = 60 min
   * Total: 150 min
   */
  it('sums (endTime − startTime) for all completed tasks', () => {
    const tasks = [
      completed({ startTime: '09:00', endTime: '10:30' }),
      completed({ startTime: '14:00', endTime: '15:00' }),
      makeTask({ status: 'pending', startTime: '11:00', endTime: '12:00' }),
    ];

    const { actualMinutes } = getDayStats(tasks);

    expect(actualMinutes).toBe(150);
  });

  /**
   * Test 8: actualMinutes skips tasks without startTime or endTime
   */
  it('excludes completed tasks with missing startTime or endTime from actualMinutes', () => {
    const tasks = [
      completed({ startTime: '', endTime: '10:00' }),
      completed({ startTime: '09:00', endTime: '' }),
      completed({ startTime: '12:00', endTime: '13:00' }),
    ];

    const { actualMinutes } = getDayStats(tasks);

    expect(actualMinutes).toBe(60);
  });

  /**
   * Test 9: actualMinutes skips tasks where endTime <= startTime
   *
   * Guards against bad data (e.g. both fields default to "09:00").
   */
  it('excludes completed tasks where endTime is not after startTime', () => {
    const tasks = [
      completed({ startTime: '10:00', endTime: '09:00' }), // reversed
      completed({ startTime: '09:00', endTime: '09:00' }), // equal
      completed({ startTime: '08:00', endTime: '09:00' }), // valid: 60 min
    ];

    const { actualMinutes } = getDayStats(tasks);

    expect(actualMinutes).toBe(60);
  });

  // ── estimatedMinutes ─────────────────────────────────────────────────────────

  /**
   * Test 10: estimatedMinutes sums estimatedDuration for completed tasks
   */
  it('sums estimatedDuration for completed tasks', () => {
    const tasks = [
      completed({ estimatedDuration: 30 }),
      completed({ estimatedDuration: 45 }),
      makeTask({ status: 'pending', estimatedDuration: 60 }),
    ];

    const { estimatedMinutes } = getDayStats(tasks);

    expect(estimatedMinutes).toBe(75);
  });

  /**
   * Test 11: estimatedMinutes skips tasks where estimatedDuration is null
   */
  it('excludes completed tasks with null estimatedDuration from estimatedMinutes', () => {
    const tasks = [
      completed({ estimatedDuration: null }),
      completed({ estimatedDuration: 20 }),
    ];

    const { estimatedMinutes } = getDayStats(tasks);

    expect(estimatedMinutes).toBe(20);
  });

  // ── uniqueTagsCount ──────────────────────────────────────────────────────────

  /**
   * Test 12: uniqueTagsCount counts distinct tags across completed tasks
   *
   * 4 completed tasks: ['work','important'], ['work'], ['health'], ['important','health']
   * Unique set: {work, important, health} → 3
   */
  it('counts distinct tags across all completed tasks', () => {
    const tasks = [
      completed({ tags: ['work', 'important'] }),
      completed({ tags: ['work'] }),
      completed({ tags: ['health'] }),
      completed({ tags: ['important', 'health'] }),
    ];

    const { uniqueTagsCount } = getDayStats(tasks);

    expect(uniqueTagsCount).toBe(3);
  });

  /**
   * Test 13: uniqueTagsCount ignores tags on non-completed tasks
   */
  it('does not count tags from pending or skipped tasks', () => {
    const tasks = [
      completed({ tags: ['work'] }),
      makeTask({ status: 'pending', tags: ['personal', 'urgent'] }),
      makeTask({ status: 'skipped', tags: ['fitness'] }),
    ];

    const { uniqueTagsCount } = getDayStats(tasks);

    expect(uniqueTagsCount).toBe(1);
  });

  /**
   * Test 14: uniqueTagsCount is 0 when completed tasks have no tags
   */
  it('returns uniqueTagsCount=0 when completed tasks have empty tag arrays', () => {
    const tasks = [completed({ tags: [] }), completed({ tags: [] })];

    const { uniqueTagsCount } = getDayStats(tasks);

    expect(uniqueTagsCount).toBe(0);
  });
});

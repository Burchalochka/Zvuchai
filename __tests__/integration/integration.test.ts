/**
 * Integration Tests — IT-01, IT-02, IT-03
 *
 * Strategy: mock only src/storage/storage (the MMKV singleton) with a
 * controllable in-memory Map. StorageService, TaskCreationService, and
 * DaySummaryService all run their real code — only the persistence layer
 * is swapped out.
 */

import { createTask } from '../../src/services/TaskCreationService';
import { TaskStorage, PreferencesStorage } from '../../src/services/StorageService';
import { getDayStats } from '../../src/services/DaySummaryService';
import type { Task, UserPreferences } from '../../src/types';

// ─── Storage mock ─────────────────────────────────────────────────────────────

const mockStorageMap = new Map<string, string>();

jest.mock('../../src/storage/storage', () => ({
  storage: {
    getString: (key: string) => mockStorageMap.get(key),
    set: (key: string, value: string) => { mockStorageMap.set(key, value); },
  },
}));

beforeEach(() => {
  mockStorageMap.clear();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const noZonePrefs: UserPreferences = {
  deadZones: [],
  eveningReportTime: '21:00',
};

const sleepPrefs: UserPreferences = {
  deadZones: [
    { id: 'dz-sleep', name: 'Сон', startTime: '23:00', endTime: '07:00' },
    { id: 'dz-lunch', name: 'Обід', startTime: '13:00', endTime: '14:00' },
  ],
  eveningReportTime: '21:00',
};

function basePayload(
  overrides: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> = {},
): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    type: 'task',
    title: 'Тестова задача',
    description: '',
    date: '2026-04-22',
    startTime: '10:00',
    endTime: '11:00',
    status: 'pending',
    themeColor: '#FCFFC6',
    priority: 'medium',
    difficulty: 'medium',
    estimatedDuration: 60,
    dueDate: null,
    deadline: null,
    tags: [],
    reminder: { mode: 'before_start', minutesBefore: 10, time: null, recurrent: false, enabled: false },
    linkedGoalId: null,
    voiceNote: null,
    completedAt: null,
    archived: false,
    deletedAt: null,
    ...overrides,
  };
}

// ─── IT-01: Повний цикл задачі ────────────────────────────────────────────────

describe('IT-01: Повний цикл задачі через сервісний рівень', () => {
  beforeEach(() => {
    PreferencesStorage.save(noZonePrefs);
  });

  it('createTask повертає задачу з auto-заповненими id, createdAt, updatedAt', () => {
    const task = createTask(basePayload());

    expect(task.id).toBeDefined();
    expect(task.id).toMatch(/^\d+$/);
    expect(task.createdAt).toBeDefined();
    expect(task.updatedAt).toBeDefined();
    expect(new Date(task.createdAt!).toISOString()).toBe(task.createdAt);
  });

  it('збережена задача доступна через TaskStorage.getAll()', () => {
    const task = createTask(basePayload({ title: 'Зустріч з командою' }));

    const all = TaskStorage.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(task.id);
    expect(all[0].title).toBe('Зустріч з командою');
  });

  it('задача зі статусом pending зберігає status без змін', () => {
    const task = createTask(basePayload({ status: 'pending' }));
    expect(task.status).toBe('pending');
    expect(TaskStorage.getAll()[0].status).toBe('pending');
  });

  it('кілька задач накопичуються у сховищі без перезапису', () => {
    createTask(basePayload({ title: 'Задача А', startTime: '09:00', endTime: '09:30' }));
    createTask(basePayload({ title: 'Задача Б', startTime: '10:00', endTime: '10:30' }));
    createTask(basePayload({ title: 'Задача В', startTime: '11:00', endTime: '11:30' }));

    const all = TaskStorage.getAll();
    expect(all).toHaveLength(3);
    expect(all.map(t => t.title)).toEqual(['Задача А', 'Задача Б', 'Задача В']);
  });

  it('незапланована задача (date: null) зберігається без перевірок', () => {
    const task = createTask(basePayload({ date: null, startTime: '' }));
    expect(task.id).toBeDefined();
    expect(TaskStorage.getAll()).toHaveLength(1);
  });
});

// ─── IT-02: createTask → getDayStats ─────────────────────────────────────────

describe('IT-02: createTask + getDayStats повертають узгоджені дані', () => {
  beforeEach(() => {
    PreferencesStorage.save(noZonePrefs);
  });

  it('статистика дня коректна для 2 виконаних і 1 pending задачі', () => {
    const taskA = createTask(basePayload({
      title: 'Задача А',
      startTime: '09:00',
      endTime: '10:00',
      estimatedDuration: 60,
      tags: ['work'],
    }));
    const taskB = createTask(basePayload({
      title: 'Задача Б',
      startTime: '11:00',
      endTime: '12:30',
      estimatedDuration: 90,
      tags: ['work', 'important'],
    }));
    const taskC = createTask(basePayload({
      title: 'Задача В',
      startTime: '14:00',
      endTime: '15:00',
      estimatedDuration: 60,
      tags: ['health'],
    }));

    const completedA: Task = { ...taskA, status: 'completed' };
    const completedB: Task = { ...taskB, status: 'completed' };

    const stats = getDayStats([completedA, completedB, taskC]);

    expect(stats.completedCount).toBe(2);
    expect(stats.totalCount).toBe(3);
    expect(stats.completionRate).toBe(67); // round(2/3*100)
    expect(stats.actualMinutes).toBe(150); // 60 + 90
    expect(stats.estimatedMinutes).toBe(150);
    expect(stats.uniqueTagsCount).toBe(2); // {work, important} — health не зараховується (taskC pending)
  });

  it('getDayStats повертає нулі якщо жодна задача не виконана', () => {
    createTask(basePayload({ startTime: '09:00', endTime: '10:00' }));
    createTask(basePayload({ startTime: '11:00', endTime: '12:00' }));

    const all = TaskStorage.getAll(); // всі pending
    const stats = getDayStats(all);

    expect(stats.completedCount).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.actualMinutes).toBe(0);
  });

  it('autoDoneOverride=completed враховується у статистиці', () => {
    const task = createTask(basePayload({
      startTime: '08:00',
      endTime: '09:00',
      estimatedDuration: 60,
      tags: ['focus'],
    }));

    const overridden: Task = { ...task, autoDoneOverride: 'completed' };
    const stats = getDayStats([overridden]);

    expect(stats.completedCount).toBe(1);
    expect(stats.actualMinutes).toBe(60);
    expect(stats.uniqueTagsCount).toBe(1);
  });
});

// ─── IT-03: Dead zone з реальним PreferencesStorage ──────────────────────────

describe('IT-03: Dead zone validation з даними з PreferencesStorage', () => {
  beforeEach(() => {
    PreferencesStorage.save(sleepPrefs);
  });

  it('задача о 02:00 кидає DEAD_ZONE_CONFLICT для зони Сон', () => {
    expect(() =>
      createTask(basePayload({ startTime: '02:00', endTime: '03:00' })),
    ).toThrow(expect.objectContaining({ code: 'DEAD_ZONE_CONFLICT', zoneName: 'Сон' }));
  });

  it('задача о 13:30 кидає DEAD_ZONE_CONFLICT для зони Обід', () => {
    expect(() =>
      createTask(basePayload({ startTime: '13:30', endTime: '14:00' })),
    ).toThrow(expect.objectContaining({ code: 'DEAD_ZONE_CONFLICT', zoneName: 'Обід' }));
  });

  it('задача о 08:00 зберігається — поза всіма dead zone', () => {
    const task = createTask(basePayload({ startTime: '08:00', endTime: '09:00' }));
    expect(task.id).toBeDefined();
    expect(TaskStorage.getAll()).toHaveLength(1);
  });

  it('22:59 — за хвилину до зони Сон (estimatedDuration: 0) → задача зберігається', () => {
    // Point event (0 duration): 22:59 is not inside [23:00, 07:00) → allowed
    const task = createTask(basePayload({ startTime: '22:59', endTime: '22:59', estimatedDuration: 0 }));
    expect(task.id).toBeDefined();
  });

  it('23:00 — рівно початок зони Сон → DEAD_ZONE_CONFLICT', () => {
    expect(() =>
      createTask(basePayload({ startTime: '23:00', endTime: '23:30' })),
    ).toThrow(expect.objectContaining({ code: 'DEAD_ZONE_CONFLICT' }));
  });

  it('07:00 — рівно кінець зони Сон (виключна межа) → задача зберігається', () => {
    const task = createTask(basePayload({ startTime: '07:00', endTime: '08:00' }));
    expect(task.id).toBeDefined();
  });

  it('задача 22:30 + 60 хв → заходить у зону Сон → DEAD_ZONE_CONFLICT', () => {
    expect(() =>
      createTask(basePayload({ startTime: '22:30', endTime: '23:30', estimatedDuration: 60 })),
    ).toThrow(expect.objectContaining({ code: 'DEAD_ZONE_CONFLICT' }));
  });

  it('з forceSave: true задача о 02:00 зберігається попри dead zone', () => {
    const task = createTask(
      basePayload({ startTime: '02:00', endTime: '03:00' }),
      { forceSave: true },
    );
    expect(task.id).toBeDefined();
    expect(TaskStorage.getAll()).toHaveLength(1);
  });

  it('PreferencesStorage.get() повертає ті ж дані, що були збережені', () => {
    const loaded = PreferencesStorage.get();
    expect(loaded?.deadZones).toHaveLength(2);
    expect(loaded?.deadZones[0].name).toBe('Сон');
    expect(loaded?.deadZones[1].name).toBe('Обід');
  });
});

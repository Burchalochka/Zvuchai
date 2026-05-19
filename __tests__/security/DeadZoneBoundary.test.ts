/**
 * Security Test — ST-01
 *
 * Verifies that checkTimeOverlap (via createTask) correctly enforces dead zone
 * boundaries, including midnight-crossing zones, leaving no exploitable gaps
 * at exact boundary timestamps.
 */

import { createTask } from '../../src/services/TaskCreationService';
import { TaskStorage, PreferencesStorage } from '../../src/services/StorageService';
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

const sleepPrefs: UserPreferences = {
  deadZones: [
    { id: 'dz-sleep', name: 'Сон', startTime: '23:00', endTime: '07:00' },
  ],
  eveningReportTime: '21:00',
};

function payload(startTime: string, durationMin = 0): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    type: 'task',
    title: 'Boundary test task',
    description: '',
    date: '2026-04-22',
    startTime,
    endTime: null,
    status: 'pending',
    themeColor: '#FCFFC6',
    priority: 'medium',
    difficulty: 'medium',
    estimatedDuration: durationMin,
    dueDate: null,
    deadline: null,
    tags: [],
    reminder: { mode: 'before_start', minutesBefore: 10, time: null, recurrent: false, enabled: false },
    linkedGoalId: null,
    voiceNote: null,
    completedAt: null,
    archived: false,
    deletedAt: null,
    isInbox: false,
    autoDoneOverride: null,
    sortIndex: null,
    startDate: null,
    endDate: null,
  };
}

// ─── ST-01 ────────────────────────────────────────────────────────────────────

describe('ST-01: Dead zone boundary conditions — зона Сон 23:00–07:00', () => {
  beforeEach(() => {
    PreferencesStorage.save(sleepPrefs);
  });

  // Дозволені часи

  it('ST-01-a: 22:59 — за хвилину до початку зони → задача дозволена', () => {
    const task = createTask(payload('22:59', 0));
    expect(task.id).toBeDefined();
  });

  it('ST-01-e: 07:00 — рівно кінець зони (виключна межа) → задача дозволена', () => {
    const task = createTask(payload('07:00', 0));
    expect(task.id).toBeDefined();
  });

  it('07:01 — після закінчення зони → задача дозволена', () => {
    const task = createTask(payload('07:01', 0));
    expect(task.id).toBeDefined();
  });

  it('12:00 — нейтральний час → задача дозволена', () => {
    const task = createTask(payload('12:00', 0));
    expect(task.id).toBeDefined();
  });

  // Заборонені часи

  it('ST-01-b: 23:00 — рівно початок зони (включна межа) → DEAD_ZONE_CONFLICT', () => {
    expect(() => createTask(payload('23:00', 0))).toThrow(
      expect.objectContaining({ code: 'DEAD_ZONE_CONFLICT', zoneName: 'Сон' }),
    );
  });

  it('ST-01-c: 02:00 — всередині нічної зони → DEAD_ZONE_CONFLICT', () => {
    expect(() => createTask(payload('02:00', 0))).toThrow(
      expect.objectContaining({ code: 'DEAD_ZONE_CONFLICT' }),
    );
  });

  it('ST-01-d: 06:59 — за хвилину до кінця зони → DEAD_ZONE_CONFLICT', () => {
    expect(() => createTask(payload('06:59', 0))).toThrow(
      expect.objectContaining({ code: 'DEAD_ZONE_CONFLICT' }),
    );
  });

  it('00:00 — північ всередині зони → DEAD_ZONE_CONFLICT', () => {
    expect(() => createTask(payload('00:00', 0))).toThrow(
      expect.objectContaining({ code: 'DEAD_ZONE_CONFLICT' }),
    );
  });

  // Тривалість що заходить у зону

  it('ST-01-f: 22:30 + 60 хв → задача закінчується о 23:30 → DEAD_ZONE_CONFLICT', () => {
    expect(() => createTask(payload('22:30', 60))).toThrow(
      expect.objectContaining({ code: 'DEAD_ZONE_CONFLICT' }),
    );
  });

  it('22:00 + 59 хв → закінчується о 22:59 → задача дозволена', () => {
    const task = createTask(payload('22:00', 59));
    expect(task.id).toBeDefined();
  });

  it('22:00 + 60 хв → закінчується рівно о 23:00 (виключна межа) → задача дозволена', () => {
    // Half-open interval: taskEnd (23:00) > dzStart (23:00) є false → конфлікту немає
    const task = createTask(payload('22:00', 60));
    expect(task.id).toBeDefined();
  });

  // Незаплановані задачі

  it('ST-01-g: date: null → всі перевірки пропускаються, задача зберігається', () => {
    const unscheduled = { ...payload('02:00', 0), date: null };
    const task = createTask(unscheduled);
    expect(task.id).toBeDefined();
    expect(TaskStorage.getAll()).toHaveLength(1);
  });

  // forceSave

  it('forceSave: true дозволяє зберегти задачу всередині dead zone', () => {
    const task = createTask(payload('03:00', 30), { forceSave: true });
    expect(task.id).toBeDefined();
    expect(TaskStorage.getAll()).toHaveLength(1);
  });

  // Без dead zone

  it('при порожньому deadZones[] будь-який час дозволений', () => {
    mockStorageMap.clear();
    PreferencesStorage.save({ deadZones: [], eveningReportTime: '21:00' });

    const t1 = createTask(payload('02:00', 0));
    const t2 = createTask(payload('23:30', 0));

    expect(TaskStorage.getAll()).toHaveLength(2);
    expect(t1.id).toBeDefined();
    expect(t2.id).toBeDefined();
  });
});

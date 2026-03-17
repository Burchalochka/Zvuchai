import { createTask } from '../../src/services/TaskCreationService';
import { TaskStorage, PreferencesStorage } from '../../src/services/StorageService';
import type { Task, UserPreferences } from '../../src/types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../src/services/StorageService', () => ({
  TaskStorage: {
    getAll: jest.fn(),
    saveAll: jest.fn(),
  },
  PreferencesStorage: {
    get: jest.fn(),
  },
}));

const mockTaskStorage = TaskStorage as jest.Mocked<typeof TaskStorage>;
const mockPrefsStorage = PreferencesStorage as jest.Mocked<typeof PreferencesStorage>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sleepPrefs: UserPreferences = {
  deadZones: [{ id: 'dz-1', name: 'Сон', startTime: '23:00', endTime: '07:00' }],
  eveningReportTime: '21:00',
};

/** Minimal valid task payload scheduled on a given date and start time. */
function makePayload(
  date: string | null,
  startTime: string,
  overrides: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> = {},
): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    type: 'task',
    title: 'Test task',
    description: '',
    date,
    startTime,
    endTime: '10:00',
    status: 'pending',
    themeColor: '#E8E0D5',
    priority: 'medium',
    difficulty: 'medium',
    estimatedDuration: 30,
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

beforeEach(() => {
  jest.clearAllMocks(); // reset call counts between tests
  mockTaskStorage.getAll.mockReturnValue([]);
  mockTaskStorage.saveAll.mockImplementation(() => {});
  mockPrefsStorage.get.mockReturnValue(sleepPrefs);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createTask', () => {
  /**
   * Test 1: Dead zone conflict
   *
   * A task at 02:00 falls inside the Sleep dead zone (23:00–07:00).
   * The service must throw a DEAD_ZONE_CONFLICT error without saving.
   */
  it('throws DEAD_ZONE_CONFLICT when task falls inside a dead zone', () => {
    const payload = makePayload('2026-03-18', '02:00');

    expect(() => createTask(payload)).toThrow(
      expect.objectContaining({ code: 'DEAD_ZONE_CONFLICT', zoneName: 'Сон' }),
    );
    expect(mockTaskStorage.saveAll).not.toHaveBeenCalled();
  });

  /**
   * Test 2: forceSave bypasses dead zone check
   *
   * The same 02:00 task must save successfully when forceSave is true,
   * simulating the user confirming the conflict alert.
   */
  it('saves successfully with forceSave: true even inside a dead zone', () => {
    const payload = makePayload('2026-03-18', '02:00');

    const task = createTask(payload, { forceSave: true });

    expect(task.id).toBeDefined();
    expect(mockTaskStorage.saveAll).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 3: Unscheduled task skips all validation
   *
   * When date is null there is no time to validate against.
   * The task must be saved without any dead zone or overlap checks.
   */
  it('saves an unscheduled task (null date) without running any time checks', () => {
    const payload = makePayload(null, '');

    const task = createTask(payload);

    expect(task.id).toBeDefined();
    expect(task.status).toBe('pending');
    expect(mockTaskStorage.saveAll).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 4: Low confidence score forces requires_review status
   *
   * When the AI parses a voice note with confidence < 80 the task's status
   * must be forced to 'requires_review' regardless of what the AI returned.
   */
  it('forces status to requires_review when confidenceScore < 80', () => {
    const payload = makePayload('2026-03-18', '10:00');

    const task = createTask(payload, { confidenceScore: 65 });

    expect(task.status).toBe('requires_review');
  });

  /**
   * Test 5: Task-task overlap throws TASK_OVERLAP
   *
   * A new task at 10:00–10:30 (30 min) must conflict with an existing task
   * that runs 10:15–11:00 on the same date.
   */
  it('throws TASK_OVERLAP when the new task overlaps an existing scheduled task', () => {
    const existingTask: Task = {
      ...makePayload('2026-03-18', '10:15'),
      id: 'existing-1',
      title: 'Morning standup',
      endTime: '11:00',
      estimatedDuration: 45,
      createdAt: '2026-03-01T08:00:00.000Z',
      updatedAt: '2026-03-01T08:00:00.000Z',
    };
    mockTaskStorage.getAll.mockReturnValue([existingTask]);
    mockPrefsStorage.get.mockReturnValue({ deadZones: [], eveningReportTime: '21:00' });

    const newPayload = makePayload('2026-03-18', '10:00');

    expect(() => createTask(newPayload)).toThrow(
      expect.objectContaining({
        code: 'TASK_OVERLAP',
        conflictingTaskTitle: 'Morning standup',
      }),
    );
    expect(mockTaskStorage.saveAll).not.toHaveBeenCalled();
  });
});

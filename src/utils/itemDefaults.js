// Default templates for creating new items.
// Dynamic fields (id, createdAt, updatedAt) are generated at creation time.
// Import the relevant factory and spread over it with user-provided values.

// ─── Shared defaults (all types) ────────────────────────────────────────────

const baseDefaults = {
  id: null,                  // generated: Date.now().toString()
  type: null,                // 'task' | 'habit' | 'goal'
  title: '',
  description: '',
  date: null,                // generated: 'YYYY-MM-DD' of creation day
  startTime: '09:00',
  endTime: '10:00',
  status: 'pending',         // 'pending' | 'completed' | 'skipped'
  themeColor: '#E8E0D5',
  priority: 'medium',        // 'low' | 'medium' | 'high'
  difficulty: 'medium',      // 'easy' | 'medium' | 'hard'
  estimatedDuration: null,   // minutes
  dueDate: null,             // 'YYYY-MM-DD'
  deadline: null,            // 'YYYY-MM-DD'
  tags: [],
  reminder: {
    mode: 'before_start',    // 'before_start' | 'at_time'
    minutesBefore: 10,       // used when mode is 'before_start'
    time: null,              // 'HH:MM' used when mode is 'at_time'
    recurrent: false,
    enabled: false,
  },
  linkedGoalId: null,
  completedAt: null,         // generated: ISO datetime when status → 'completed'
  archived: false,
  deletedAt: null,           // generated: ISO datetime when deleted
  createdAt: null,           // generated: new Date().toISOString()
  updatedAt: null,           // generated: new Date().toISOString()
};

// ─── Task ────────────────────────────────────────────────────────────────────

export const taskDefaults = {
  ...baseDefaults,
  type: 'task',
};

// ─── Habit ───────────────────────────────────────────────────────────────────

export const habitDefaults = {
  ...baseDefaults,
  type: 'habit',
  recurrence: {
    type: 'daily',           // 'daily' | 'weekly' | 'custom'
    days: [0, 1, 2, 3, 4, 5, 6], // weekday indices; 0 = Sunday
  },
  streak: 0,
  bestStreak: 0,
  completionDates: [],       // 'YYYY-MM-DD'[]
};

// ─── Goal ────────────────────────────────────────────────────────────────────

export const goalDefaults = {
  ...baseDefaults,
  type: 'goal',
  target: {
    value: 0,
    unit: '',
    progress: 0,
    targetDate: null,        // 'YYYY-MM-DD'
    milestones: [],          // { id, title, value, completedAt }[]
  },
};

// ─── Factory helpers ─────────────────────────────────────────────────────────
// Usage: const newTask = createTask({ title: 'Buy milk', priority: 'low' });

const today = () => new Date().toISOString().split('T')[0];
const now = () => new Date().toISOString();
const newId = () => Date.now().toString();

export const createTask = (overrides = {}) => ({
  ...taskDefaults,
  id: newId(),
  date: today(),
  createdAt: now(),
  updatedAt: now(),
  ...overrides,
});

export const createHabit = (overrides = {}) => ({
  ...habitDefaults,
  id: newId(),
  date: today(),
  createdAt: now(),
  updatedAt: now(),
  ...overrides,
});

export const createGoal = (overrides = {}) => ({
  ...goalDefaults,
  id: newId(),
  date: today(),
  createdAt: now(),
  updatedAt: now(),
  ...overrides,
});

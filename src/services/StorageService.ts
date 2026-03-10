import { storage } from '../storage/storage';
import type { Task, Habit, Goal, UserPreferences } from '../types';

const KEYS = {
  tasks: 'tasks',
  habits: 'habits',
  goals: 'goals',
  preferences: 'user_preferences',
} as const;

// ─── Generic helpers ──────────────────────────────────────────────────────────

function readAll<T>(key: string): T[] {
  const raw = storage.getString(key);
  return raw ? (JSON.parse(raw) as T[]) : [];
}

function writeAll<T>(key: string, items: T[]): void {
  storage.set(key, JSON.stringify(items));
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const TaskStorage = {
  getAll: (): Task[] => readAll<Task>(KEYS.tasks),
  saveAll: (tasks: Task[]): void => writeAll(KEYS.tasks, tasks),
};

// ─── Habits ───────────────────────────────────────────────────────────────────

export const HabitStorage = {
  getAll: (): Habit[] => readAll<Habit>(KEYS.habits),
  saveAll: (habits: Habit[]): void => writeAll(KEYS.habits, habits),
};

// ─── Goals ────────────────────────────────────────────────────────────────────

export const GoalStorage = {
  getAll: (): Goal[] => readAll<Goal>(KEYS.goals),
  saveAll: (goals: Goal[]): void => writeAll(KEYS.goals, goals),
};

// ─── UserPreferences ──────────────────────────────────────────────────────────

export const PreferencesStorage = {
  get: (): UserPreferences | null => {
    const raw = storage.getString(KEYS.preferences);
    return raw ? (JSON.parse(raw) as UserPreferences) : null;
  },
  save: (prefs: UserPreferences): void => {
    storage.set(KEYS.preferences, JSON.stringify(prefs));
  },
};

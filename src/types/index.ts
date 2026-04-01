// ─── Shared ──────────────────────────────────────────────────────────────────

export type ItemType = 'task' | 'habit' | 'goal';
export type ItemStatus = 'pending' | 'completed' | 'skipped' | 'requires_review';
export type Priority = 'low' | 'medium' | 'high';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Reminder {
  mode: 'before_start' | 'at_time';
  minutesBefore: number;
  time: string | null;
  recurrent: boolean;
  enabled: boolean;
}

export interface BaseItem {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  date: string | null;           // 'YYYY-MM-DD'
  startTime: string;             // 'HH:MM'
  endTime: string;               // 'HH:MM'
  status: ItemStatus;
  themeColor: string;
  priority: Priority;
  difficulty: Difficulty;
  estimatedDuration: number | null;
  dueDate: string | null;        // 'YYYY-MM-DD'
  deadline: string | null;       // 'YYYY-MM-DD'
  tags: string[];
  reminder: Reminder;
  linkedGoalId: string | null;
  voiceNote: string | null;
  completedAt: string | null;
  archived: boolean;
  deletedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// ─── Task ────────────────────────────────────────────────────────────────────

export interface Task extends BaseItem {
  type: 'task';
}

// ─── Habit ───────────────────────────────────────────────────────────────────

export type RecurrenceType = 'daily' | 'weekly' | 'custom';

export interface Recurrence {
  type: RecurrenceType;
  days: number[]; // weekday indices; 0 = Sunday
}

export interface Habit extends BaseItem {
  type: 'habit';
  recurrence: Recurrence;
  streak: number;
  bestStreak: number;
  completionDates: string[]; // 'YYYY-MM-DD'[]
}

// ─── Goal ────────────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  title: string;
  value: number;
  completedAt: string | null;
}

export interface GoalTarget {
  value: number;
  unit: string;
  progress: number;
  targetDate: string | null; // 'YYYY-MM-DD'
  milestones: Milestone[];
}

export interface Goal extends BaseItem {
  type: 'goal';
  target: GoalTarget;
}

// ─── DeadZone & UserPreferences ──────────────────────────────────────────────

export interface DeadZone {
  id: string;
  name: string;      // наприклад: 'Сон', 'Особистий час', 'Спорт'
  startTime: string; // 'HH:mm'
  endTime: string;   // 'HH:mm'
  color?: string;    // Колір для відображення на діаграмі (наприклад, '#FFB6C1')
}

// Типи для нових відповідей з онбордингу
export type ProductiveTime = 'morning' | 'afternoon' | 'evening' | 'night' | 'dont_know';
export type WorkType = 'mental' | 'physical';
export type WorkFormat = 'single_tasking' | 'multi_tasking';
export type HasDistractions = 'yes' | 'no'; // Діти або домашні улюбленці
export type FatigueLevel = 'rarely' | 'sometimes' | 'almost_daily';

export interface UserPreferences {
  deadZones: DeadZone[];
  eveningReportTime: string; // за замовчуванням '21:00'
  
  // Нові поля з онбордингу
  sleepSchedule: {
    start: string; // 'HH:mm'
    end: string;   // 'HH:mm'
  } | null;
  productiveTime: ProductiveTime | null;
  workType: WorkType | null;
  workFormat: WorkFormat | null;
  hasDistractions: HasDistractions | null;
  fatigueLevel: FatigueLevel | null;
  isOnboardingCompleted: boolean; // Прапорець, щоб знати, чи показувати онбординг знову
}
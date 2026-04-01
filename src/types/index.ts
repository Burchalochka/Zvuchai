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
  /** Optional manual ordering inside a day (used for drag & drop). */
  sortIndex?: number | null;
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
  name: string;      // e.g. 'Сон', 'Особистий час'
  startTime: string; // 'HH:mm'
  endTime: string;   // 'HH:mm'
}

export interface UserPreferences {
  deadZones: DeadZone[];
  eveningReportTime: string; // default '21:00'
}

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
  date: string | null;
  startTime: string;
  endTime: string;
  status: ItemStatus;
  themeColor: string;
  priority: Priority;
  difficulty: Difficulty;
  estimatedDuration: number | null;
  dueDate: string | null;
  deadline: string | null;
  tags: string[];
  reminder: Reminder;
  linkedGoalId: string | null;
  voiceNote: string | null;
  completedAt: string | null;
  archived: boolean;
  deletedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sortIndex?: number | null;
  autoDoneOverride?: 'pending' | 'completed' | null;
}

export interface Task extends BaseItem {
  type: 'task';
}

export type RecurrenceType = 'daily' | 'weekly' | 'custom';

export interface Recurrence {
  type: RecurrenceType;
  days: number[];
}

export interface Habit extends BaseItem {
  type: 'habit';
  recurrence: Recurrence;
  streak: number;
  bestStreak: number;
  completionDates: string[];
}

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
  targetDate: string | null;
  milestones: Milestone[];
}

export interface Goal extends BaseItem {
  type: 'goal';
  target: GoalTarget;
}

export interface DeadZone {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface UserPreferences {
  deadZones: DeadZone[];
  eveningReportTime: string;
}

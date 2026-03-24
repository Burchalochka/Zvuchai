import type { Goal } from '../src/types';
import { dayOffset } from './tasks';

export function getSeedGoals(): Goal[] {
  const today = dayOffset(0);
  const now = new Date().toISOString();

  return [
    {
      id: 'seed-goal-001',
      type: 'goal',
      title: 'Прочитати 12 книг',
      description: 'По одній книзі на місяць протягом року',
      date: today,
      startTime: '09:00',
      endTime: '10:00',
      status: 'pending',
      themeColor: '#E0D5FF',
      priority: 'medium',
      difficulty: 'medium',
      estimatedDuration: null,
      dueDate: dayOffset(275),
      deadline: null,
      tags: ['навчання', 'особисте'],
      reminder: {
        mode: 'before_start',
        minutesBefore: 10,
        time: null,
        recurrent: false,
        enabled: false,
      },
      linkedGoalId: null,
      voiceNote: null,
      completedAt: null,
      archived: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      target: {
        value: 12,
        unit: 'книги',
        progress: 4,
        targetDate: dayOffset(275),
        milestones: [
          { id: 'seed-ms-001', title: 'Перші 3 книги', value: 3, completedAt: dayOffset(-30) },
          { id: 'seed-ms-002', title: 'Половина шляху', value: 6, completedAt: null },
          { id: 'seed-ms-003', title: 'Фінішна пряма', value: 9, completedAt: null },
        ],
      },
    },
    {
      id: 'seed-goal-002',
      type: 'goal',
      title: 'Пробігти 100 км',
      description: 'Сумарний кілометраж за 3 місяці',
      date: today,
      startTime: '09:00',
      endTime: '10:00',
      status: 'pending',
      themeColor: '#BAFFC9',
      priority: 'high',
      difficulty: 'hard',
      estimatedDuration: null,
      dueDate: dayOffset(90),
      deadline: null,
      tags: ['здоровʼя'],
      reminder: {
        mode: 'before_start',
        minutesBefore: 10,
        time: null,
        recurrent: false,
        enabled: false,
      },
      linkedGoalId: null,
      voiceNote: null,
      completedAt: null,
      archived: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      target: {
        value: 100,
        unit: 'км',
        progress: 37,
        targetDate: dayOffset(90),
        milestones: [
          { id: 'seed-ms-004', title: 'Перші 25 км', value: 25, completedAt: dayOffset(-14) },
          { id: 'seed-ms-005', title: 'Половина — 50 км', value: 50, completedAt: null },
          { id: 'seed-ms-006', title: 'Останній рывок — 75 км', value: 75, completedAt: null },
        ],
      },
    },
  ];
}

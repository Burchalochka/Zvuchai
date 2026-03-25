import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
  BlurView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SwipeableTaskItem from '../components/tasks/SwipeableTaskItem';
import DeleteTaskModal from '../components/modals/DeleteTaskModal';
import RescheduleTaskModal from '../components/modals/RescheduleTaskModal';
import { FONTS, SPACING, COLORS } from '../styles/theme';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TASKS = [
  {
    id: '1',
    title: 'Ранкова медитація',
    startTime: '07:00',
    endTime: '07:30',
    tag: "Здоров'я",
    tagColor: '#EDE7FF',
    tagTextColor: '#7C4DFF',
    completed: true,
  },
  {
    id: '2',
    title: 'Зустріч з клієнтом',
    startTime: '14:00',
    endTime: '15:00',
    tag: 'Робота',
    tagColor: '#E0F7FA',
    tagTextColor: '#0097A7',
    completed: true,
  },
  {
    id: '3',
    title: 'Прочитати книгу',
    startTime: '18:15',
    endTime: '19:00',
    tag: 'Саморозвиток',
    tagColor: '#FCE4EC',
    tagTextColor: '#E91E63',
    completed: true,
  },
  {
    id: '4',
    title: 'Тренування',
    startTime: undefined,
    endTime: undefined,
    tag: undefined,
    completed: false,
  },
  {
    id: '5',
    title: 'Купити продукти',
    startTime: undefined,
    endTime: undefined,
    tag: 'Побут',
    tagColor: '#FFF9C4',
    tagTextColor: '#F9A825',
    completed: false,
  },
];

const today = new Date();
const formatDate = (d) => {
  const day = d.getDate();
  const months = [
    'січня','лютого','березня','квітня','травня','червня',
    'липня','серпня','вересня','жовтня','листопада','грудня',
  ];
  const weekdays = ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота'];
  return `${day} ${months[d.getMonth()]} • ${weekdays[d.getDay()]}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const DailySummaryScreen = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const tags = [...new Set(tasks.map((t) => t.tag).filter(Boolean))];

  // Загальний час (mock: підрахунок завершених що мають час)
  const workedMinutes = tasks
    .filter((t) => t.completed && t.startTime && t.endTime)
    .reduce((acc, t) => {
      const [sh, sm] = t.startTime.split(':').map(Number);
      const [eh, em] = t.endTime.split(':').map(Number);
      return acc + (eh * 60 + em) - (sh * 60 + sm);
    }, 0);
  const workedHours = Math.floor(workedMinutes / 60);
  const workedMins = workedMinutes % 60;
  const workedLabel = workedMins > 0 ? `${workedHours}г ${workedMins}хв` : `${workedHours}г`;

  const handleToggle = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteConfirm = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeleteTarget(null);
  };

  const isSameDay = (a, b) => {
    if (!a || !b) return false;

    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  };

  const handleRescheduleConfirm = (id, newDate) => {
    const today = new Date();

    if (isSameDay(newDate, today)) {
    // 👉 Нічого не робимо — таска залишається
      setRescheduleTarget(null);
      return;
    }

  // 👉 Інакше — переносимо (поки що просто видаляємо зі списку дня)
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setRescheduleTarget(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.3)" barStyle="light-content" />

      {/* Напівпрозорий фон — натиснути щоб закрити */}
      <TouchableOpacity
        style={styles.dimOverlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Основна картка (займає більшу частину екрану) */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Ручка */}
        <View style={styles.handle} />

        {/* Заголовок */}
        <Text style={styles.title}>Підсумки дня</Text>
        <Text style={styles.dateLabel}>{formatDate(today)}</Text>

        {/* Статистика */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Виконано</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{workedLabel}</Text>
            <Text style={styles.statLabel}>Працювали</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tags.length}</Text>
            <Text style={styles.statLabel}>Теги</Text>
          </View>
        </View>

        {/* Список завдань */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {tasks.map((task) => (
            <SwipeableTaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDeleteRequest={setDeleteTarget}
              onRescheduleRequest={setRescheduleTarget}
            />
          ))}
        </ScrollView>

        {/* Кнопка завершити день */}
        <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
          <Text style={styles.finishBtnText}>Завершити день</Text>
        </TouchableOpacity>
      </View>

      {/* Попап видалення */}
      <DeleteTaskModal
        visible={!!deleteTarget}
        task={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Попап перенесення */}
      <RescheduleTaskModal
        visible={!!rescheduleTarget}
        task={rescheduleTarget}
        onConfirm={handleRescheduleConfirm}
        onCancel={() => setRescheduleTarget(null)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  dimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '12%',
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
   handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#2C1A00',
    textAlign: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: FONTS.sizes.sm,
    color: '#8A7A6A',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F5E9',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#DDD5C0',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: '#2C1A00',
    lineHeight: 28,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: '#8A7A6A',
    fontFamily: 'Montserrat-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
  },
  finishBtn: {
    marginTop: 12,
    backgroundColor: '#452C16',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontSize: FONTS.sizes.md,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },
});

export default DailySummaryScreen;

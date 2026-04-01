import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SwipeableTaskItem from '../components/tasks/SwipeableTaskItem';
import DeleteTaskModal from '../components/modals/DeleteTaskModal';
import RescheduleTaskModal from '../components/modals/RescheduleTaskModal';
import { FONTS, SPACING, COLORS } from '../styles/theme';
import { useTasks } from '../context/TasksContext';
import { useSelectedDate } from '../context/SelectedDateContext';
import { getDayStats } from '../services/DaySummaryService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateKey = (d) => {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDate = (d) => {
  const day = d.getDate();
  const months = [
    'січня','лютого','березня','квітня','травня','червня',
    'липня','серпня','вересня','жовтня','листопада','грудня',
  ];
  const weekdays = ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота'];
  return `${day} ${months[d.getMonth()]} • ${weekdays[d.getDay()]}`;
};

const formatMinutes = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}хв`;
  return m > 0 ? `${h}г ${m}хв` : `${h}г`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const DailySummaryScreen = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { tasks: allTasks, toggleTaskComplete, deleteTask, rescheduleTask } = useTasks();
  const { selectedDate } = useSelectedDate();

  const [localTasks, setLocalTasks] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  // Sync local list when context or selected date changes
  useEffect(() => {
    const key = toDateKey(selectedDate);
    const filtered = (allTasks || []).filter((t) => t && t.date === key);
    setLocalTasks(filtered);
  }, [allTasks, selectedDate]);

  const stats = getDayStats(localTasks);
  const workedLabel = formatMinutes(stats.actualMinutes);

  const handleToggle = (id) => {
    // Persist completion state via context/storage so HomeScreen reflects it too.
    toggleTaskComplete(id);
    // Keep local UI responsive; effect will resync from context shortly after.
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
          : t
      )
    );
  };

  const handleDeleteConfirm = (id) => {
    deleteTask(id);
    setLocalTasks((prev) => prev.filter((t) => t.id !== id));
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
    if (isSameDay(newDate, selectedDate)) {
      setRescheduleTarget(null);
      return;
    }
    const newKey = toDateKey(newDate);
    if (newKey) {
      rescheduleTask(id, newKey);
    }
    setLocalTasks((prev) => prev.filter((t) => t.id !== id));
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
        <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>

        {/* Статистика */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completedCount}</Text>
            <Text style={styles.statLabel}>Виконано</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{workedLabel}</Text>
            <Text style={styles.statLabel}>Працювали</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.uniqueTagsCount}</Text>
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
          {localTasks.map((task) => (
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

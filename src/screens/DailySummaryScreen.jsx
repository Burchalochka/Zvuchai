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
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { getDayStats } from '../services/DaySummaryService';
import {
  toLocalDateKey,
  resolveCalendarListDateKey,
  isItemOnCalendarDay,
} from '../utils/calendarDay';

const formatDate = (d, language) => {
  const day = d.getDate();
  const months_uk = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
  const months_en = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekdays_uk = ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота'];
  const weekdays_en = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = language === 'en' ? months_en : months_uk;
  const weekdays = language === 'en' ? weekdays_en : weekdays_uk;
  return `${day} ${months[d.getMonth()]} • ${weekdays[d.getDay()]}`;
};

const formatMinutes = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}хв`;
  return m > 0 ? `${h}г ${m}хв` : `${h}г`;
};

const DailySummaryScreen = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { tasks: allTasks, setTaskCompleted, deleteTask, rescheduleTask } = useTasks();
  const { selectedDate, todayCalendar } = useSelectedDate();
  const { language } = useLanguage();

  const [localTasks, setLocalTasks] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  useEffect(() => {
    const key = resolveCalendarListDateKey(selectedDate, todayCalendar);
    const filtered = (allTasks || []).filter((t) => isItemOnCalendarDay(t, key));
    setLocalTasks(filtered);
  }, [allTasks, selectedDate, todayCalendar]);

  const stats = getDayStats(localTasks);
  const workedLabel = formatMinutes(stats.actualMinutes);

  const handleToggle = (id, nextCompleted) => {
    setTaskCompleted(id, nextCompleted);
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
            ...t,
            status: nextCompleted ? 'completed' : 'pending',
            autoDoneOverride: nextCompleted ? 'completed' : 'pending',
          }
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
    const newKey = toLocalDateKey(newDate);
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

      <TouchableOpacity
        style={styles.dimOverlay}
        activeOpacity={1}
        onPress={onClose}
      />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />

        <Text style={styles.title}>{getTranslation('dailySummaryTitle', language)}</Text>
        <Text style={styles.dateLabel}>{formatDate(selectedDate, language)}</Text>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completedCount}</Text>
            <Text style={styles.statLabel}>{getTranslation('statCompleted', language)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{workedLabel}</Text>
            <Text style={styles.statLabel}>{getTranslation('statWorked', language)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.uniqueTagsCount}</Text>
            <Text style={styles.statLabel}>{getTranslation('statTags', language)}</Text>
          </View>
        </View>

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

        <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
          <Text style={styles.finishBtnText}>{getTranslation('finishDay', language)}</Text>
        </TouchableOpacity>
      </View>

      {/* Попап видалення */}
      <DeleteTaskModal
        visible={!!deleteTarget}
        task={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

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

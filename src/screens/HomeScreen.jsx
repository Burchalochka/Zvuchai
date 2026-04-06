import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import Svg, { Line } from 'react-native-svg';
import Header from '../components/common/Header';
import Calendar from '../components/calendar/Calendar';
import TaskTimelineItem from '../components/tasks/TaskTimelineItem';
import DayTimeline from '../components/day/DayTimeline';
import DailySummaryScreen from './DailySummaryScreen';
import DeleteTaskModal from '../components/modals/DeleteTaskModal';
import EditTaskModal from '../components/modals/EditTaskModal';
import RescheduleTaskModal from '../components/modals/RescheduleTaskModal';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import { useSelectedDate } from '../context/SelectedDateContext';
import { useModal } from '../context/ModalContext';
import { getTranslation } from '../utils/translations';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { getTasksForDate } from '../services/DataLayerService';
import { getDayStats } from '../services/DaySummaryService';
import {
  toDateKey,
  resolveCalendarListDateKey,
  isItemOnCalendarDay,
  itemScheduledDayKey,
  buildTaskCountsByDateForCalendar,
} from '../utils/calendarDay';
import {
  TIMELINE_SCALE_COLUMN_WIDTH_PX,
  TIMELINE_RAIL_CENTER_X_PX,
  TIMELINE_RAIL_STROKE_WIDTH_PX,
  TIMELINE_RAIL_AXIS_STROKE,
} from '../constants/timelineLayout';

const TAB_BAR_HEIGHT = 80;
const TAB_BAR_EXTRA_BG = 90;
const TIMELINE_SCROLL_BOTTOM_EXTRA = 0;

const DAY_TABS_SEGMENT_H = 48;
const DAY_TABS_RAIL_BRIDGE_H = DAY_TABS_SEGMENT_H + SPACING.md;

const HomeScreen = () => {
  const navigation = useNavigation();
  const {
    tasks,
    habits,
    toggleTaskComplete,
    toggleHabitComplete,
    setTaskCompleted,
    setHabitCompleted,
    deleteTask,
    deleteHabit,
    rescheduleTask,
    rescheduleHabit,
    updateTask,
    updateHabit,
    reorderTasksForDate,
    reorderHabitsForDate,
  } = useTasks();
  const { language } = useLanguage();
  const { selectedDate, todayKyiv } = useSelectedDate();
  useModal();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isDailySummaryVisible, setIsDailySummaryVisible] = useState(false);
  const [calendarMenuVisible, setCalendarMenuVisible] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState('day');
  const [calendarStripMode, setCalendarStripMode] = useState('week');
  const [actionsTarget, setActionsTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const scrollBottomPadding = TAB_BAR_HEIGHT + insets.bottom + TAB_BAR_EXTRA_BG;
  const timelineScrollBottomPad = TAB_BAR_HEIGHT + insets.bottom + TIMELINE_SCROLL_BOTTOM_EXTRA;
  const { height: windowHeight } = useWindowDimensions();
  const isCalendarStripExpanded = calendarStripMode === 'month';
  const tasksBlockMaxHeightWhenMonthOpen = Math.max(220, Math.min(380, Math.round(windowHeight * 0.36)));

  useEffect(() => {
    setSelectedItemId(null);
  }, [activeTab]);

  useEffect(() => {
    getTasksForDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (calendarStripMode === 'year') setCalendarStripMode('month');
  }, [calendarStripMode]);

  const selectedKey = resolveCalendarListDateKey(selectedDate, todayKyiv);
  const tasksForDay = (tasks || []).filter((t) => isItemOnCalendarDay(t, selectedKey));
  const habitsForDay = (habits || []).filter((h) => isItemOnCalendarDay(h, selectedKey));



  const sortedTasks = [...tasksForDay].sort((a, b) => {
    const aIdx = Number.isFinite(a?.sortIndex) ? a.sortIndex : null;
    const bIdx = Number.isFinite(b?.sortIndex) ? b.sortIndex : null;
    if (aIdx !== null && bIdx !== null) return aIdx - bIdx;
    if (aIdx !== null) return -1;
    if (bIdx !== null) return 1;
    const aStr = (a && a.startTime) ? String(a.startTime) : '09:00';
    const bStr = (b && b.startTime) ? String(b.startTime) : '09:00';
    const [aHours, aMinutes] = aStr.split(':').map(Number);
    const [bHours, bMinutes] = bStr.split(':').map(Number);
    return (aHours || 0) * 60 + (aMinutes || 0) - (bHours || 0) * 60 - (bMinutes || 0);
  });

  const sortedHabits = [...habitsForDay].sort((a, b) => {
    const aIdx = Number.isFinite(a?.sortIndex) ? a.sortIndex : null;
    const bIdx = Number.isFinite(b?.sortIndex) ? b.sortIndex : null;
    if (aIdx !== null && bIdx !== null) return aIdx - bIdx;
    if (aIdx !== null) return -1;
    if (bIdx !== null) return 1;
    const aStr = (a && a.startTime) ? String(a.startTime) : '09:00';
    const bStr = (b && b.startTime) ? String(b.startTime) : '09:00';
    const [aHours, aMinutes] = aStr.split(':').map(Number);
    const [bHours, bMinutes] = bStr.split(':').map(Number);
    return (aHours || 0) * 60 + (aMinutes || 0) - (bHours || 0) * 60 - (bMinutes || 0);
  });

  const hasAnyScheduledTaskElsewhere = useMemo(
    () =>
      (tasks || []).some((t) => {
        if (!t || t.deletedAt || t.archived) return false;
        return !!itemScheduledDayKey(t.date);
      }),
    [tasks],
  );

  const hasAnyScheduledHabitElsewhere = useMemo(
    () =>
      (habits || []).some((h) => {
        if (!h || h.deletedAt || h.archived) return false;
        return !!itemScheduledDayKey(h.date);
      }),
    [habits],
  );

  const emptyTasksHint = useMemo(() => {
    if (sortedTasks.length > 0) return null;
    if (hasAnyScheduledTaskElsewhere) {
      return {
        title: getTranslation('emptyDayNoTasksTitle', language),
        sub: getTranslation('emptyDayNoTasksHint', language),
      };
    }
    return {
      title: getTranslation('startJourneyTasks', language),
      sub: getTranslation('addFirstTask', language),
    };
  }, [sortedTasks.length, hasAnyScheduledTaskElsewhere, language]);

  const emptyHabitsHint = useMemo(() => {
    if (sortedHabits.length > 0) return null;
    if (hasAnyScheduledHabitElsewhere) {
      return {
        title: getTranslation('emptyDayNoHabitsTitle', language),
        sub: getTranslation('emptyDayNoHabitsHint', language),
      };
    }
    return {
      title: getTranslation('startJourneyHabits', language),
      sub: getTranslation('addFirstHabit', language),
    };
  }, [sortedHabits.length, hasAnyScheduledHabitElsewhere, language]);

  const showDayRailBridge =
    calendarViewMode === 'day' &&
    ((activeTab === 'tasks' && sortedTasks.length > 0) ||
      (activeTab === 'habits' && sortedHabits.length > 0));

  const listIsEmptyForActiveTab =
    activeTab === 'tasks' ? sortedTasks.length === 0 : sortedHabits.length === 0;

  const monthOpenListShellStyle =
    isCalendarStripExpanded && listIsEmptyForActiveTab
      ? {
          flex: 0,
          maxHeight: tasksBlockMaxHeightWhenMonthOpen,
          minHeight: tasksBlockMaxHeightWhenMonthOpen,
        }
      : null;

  const moveDayItemOrder = (item, delta) => {
    if (!item || !selectedKey) return;
    const isHabit = activeTab === 'habits';
    const list = isHabit ? sortedHabits : sortedTasks;
    const idx = list.findIndex((x) => x.id === item.id);
    const j = idx + delta;
    if (idx < 0 || j < 0 || j >= list.length) return;
    const next = list.map((x) => x.id);
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    if (isHabit) reorderHabitsForDate(selectedKey, next);
    else reorderTasksForDate(selectedKey, next);
    setActionsTarget(null);
  };

  const stats = getDayStats(tasksForDay);

  const taskCountsByDate = buildTaskCountsByDateForCalendar(tasks);

  const handleRescheduleConfirm = (id, newDate) => {
    const item = rescheduleTarget;
    if (!item || String(item.id) !== String(id)) {
      setRescheduleTarget(null);
      return;
    }
    const newKey = toDateKey(newDate);
    if (!newKey || newKey === item.date) {
      setRescheduleTarget(null);
      return;
    }
    if (item.type === 'habit') {
      rescheduleHabit(id, newKey);
    } else {
      rescheduleTask(id, newKey);
    }
    setRescheduleTarget(null);
  };

  const renderItem = ({ item }) => (
    <TaskTimelineItem
      task={item}
      selected={selectedItemId === item.id}
      onPressOpenEdit={() => setEditTarget(item)}
      onLongPressCard={() => setActionsTarget(item)}
      onToggleComplete={(id, nextCompleted) => (
        activeTab === 'tasks'
          ? setTaskCompleted(id, nextCompleted)
          : setHabitCompleted(id, nextCompleted)
      )}
      onOpenActions={(t) => setActionsTarget(t)}
    />
  );

  const renderDragItem = ({ item, drag }) => (
    <TaskTimelineItem
      task={item}
      selected={selectedItemId === item.id}
      onPressOpenEdit={() => setEditTarget(item)}
      onLongPressCard={drag}
      onToggleComplete={(id, nextCompleted) => setTaskCompleted(id, nextCompleted)}
      onOpenActions={(t) => setActionsTarget(t)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View
        pointerEvents="none"
        style={[styles.bottomWhiteUnderlay, { height: scrollBottomPadding }]}
      />
      <Header onCalendarPress={() => setCalendarMenuVisible(true)} />
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.statsCard}
          onPress={() => setIsDailySummaryVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {stats.completedCount}
              <Text style={styles.statNumberMinor}>/{stats.totalCount}</Text>
            </Text>
            <Text style={styles.statLabel}>{getTranslation('completed', language)}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.flameContainer}>
              <Text style={styles.statNumber}>0</Text>
              <Image
                source={require('../assets/icons/5e7dd1907f8677660224a5cc413fab5fbf1ba689.png')}
                style={styles.flameIcon}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>{getTranslation('progress', language)}</Text>
          </View>
        </TouchableOpacity>

        <Calendar
          taskCountsByDate={taskCountsByDate}
          viewMode={calendarStripMode}
          onViewModeChange={(m) => {
            if (m === 'week' || m === 'month') setCalendarStripMode(m);
          }}
        />

        <View
          style={[
            styles.whiteSectionShell,
            isCalendarStripExpanded && listIsEmptyForActiveTab
              ? styles.whiteSectionUnderOpenMonth
              : styles.whiteSectionExpand,
          ]}
        >
          <View
            style={[styles.tabsPanel, isCalendarStripExpanded && styles.tabsPanelMonthStripOpen]}
          >
            <View
              style={[
                styles.segmentedWrapper,
                isCalendarStripExpanded && styles.segmentedWrapperMonthStripOpen,
              ]}
            >
              <View style={styles.segmentedBaseBg} pointerEvents="none" />
              <View
                style={[
                  styles.segmentedActiveBg,
                  activeTab === 'tasks' ? styles.segmentLeftActiveBg : styles.segmentRightActiveBg,
                ]}
                pointerEvents="none"
              />
              {showDayRailBridge ? (
                <View style={styles.tabsRailUnderSegment} pointerEvents="none">
                  <Svg width={TIMELINE_SCALE_COLUMN_WIDTH_PX} height={DAY_TABS_RAIL_BRIDGE_H}>
                    <Line
                      x1={TIMELINE_RAIL_CENTER_X_PX}
                      y1={DAY_TABS_SEGMENT_H}
                      x2={TIMELINE_RAIL_CENTER_X_PX}
                      y2={DAY_TABS_RAIL_BRIDGE_H}
                      stroke={TIMELINE_RAIL_AXIS_STROKE}
                      strokeWidth={TIMELINE_RAIL_STROKE_WIDTH_PX}
                      strokeLinecap="butt"
                    />
                  </Svg>
                </View>
              ) : null}
              <View style={styles.segmentedButtons}>
                <TouchableOpacity style={styles.segmentButton} onPress={() => setActiveTab('tasks')}>
                  <Text style={activeTab === 'tasks' ? styles.segmentActiveText : styles.segmentText}>
                    {getTranslation('tasks', language)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.segmentButton} onPress={() => setActiveTab('habits')}>
                  <Text style={activeTab === 'habits' ? styles.segmentActiveText : styles.segmentText}>
                    {getTranslation('habits', language)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {calendarViewMode === 'day' ? (
            <View
              style={[
                styles.listExpand,
                styles.dayTimelineHost,
                monthOpenListShellStyle,
              ]}
            >
              {activeTab === 'tasks' ? (
                sortedTasks.length > 0 ? (
                  <DayTimeline
                    dateKey={selectedKey}
                    items={sortedTasks}
                    onPressItem={(item) => setEditTarget(item)}
                    onLongPressItem={(item) => setActionsTarget(item)}
                    onToggleComplete={toggleTaskComplete}
                    onSetCompleted={setTaskCompleted}
                    onUpdateItem={updateTask}
                    onRescheduleItem={rescheduleTask}
                    bottomPadding={timelineScrollBottomPad}
                  />
                ) : (
                  <View
                    style={[
                      styles.dayFirstRunPlaceholder,
                      isCalendarStripExpanded && styles.dayFirstRunPlaceholderUnderOpenMonth,
                      { paddingBottom: scrollBottomPadding },
                    ]}
                  >
                    <View style={styles.dayEmptyMessageInner}>
                      <Text style={styles.dayEmptyHintTitle}>
                        {emptyTasksHint.title}
                      </Text>
                      <Text style={styles.dayEmptyHintSub}>{emptyTasksHint.sub}</Text>
                    </View>
                  </View>
                )
              ) : sortedHabits.length > 0 ? (
                <DayTimeline
                  dateKey={selectedKey}
                  items={sortedHabits}
                  onPressItem={(item) => setEditTarget(item)}
                  onLongPressItem={(item) => setActionsTarget(item)}
                  onToggleComplete={toggleHabitComplete}
                  onSetCompleted={setHabitCompleted}
                  onUpdateItem={updateHabit}
                  onRescheduleItem={rescheduleHabit}
                  bottomPadding={timelineScrollBottomPad}
                />
              ) : (
                <View
                  style={[
                    styles.dayFirstRunPlaceholder,
                    isCalendarStripExpanded && styles.dayFirstRunPlaceholderUnderOpenMonth,
                    { paddingBottom: scrollBottomPadding },
                  ]}
                >
                  <View style={styles.dayEmptyMessageInner}>
                    <Text style={styles.dayEmptyHintTitle}>
                      {emptyHabitsHint.title}
                    </Text>
                    <Text style={styles.dayEmptyHintSub}>{emptyHabitsHint.sub}</Text>
                  </View>
                </View>
              )}
            </View>
          ) : activeTab === 'tasks' ? (
            Platform.OS === 'android' ? (
              <FlatList
                data={sortedTasks}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                style={[styles.listExpand, monthOpenListShellStyle]}
                contentContainerStyle={[
                  styles.listContent,
                  listIsEmptyForActiveTab &&
                    (isCalendarStripExpanded
                      ? styles.listContentEmptyUnderOpenMonth
                      : styles.listContentEmptyCentered),
                  { paddingBottom: scrollBottomPadding },
                ]}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                ListEmptyComponent={
                  <View style={styles.tasksPlaceholder}>
                    <View style={styles.monthEmptyMessageInner}>
                      <Text style={styles.dayEmptyHintTitle}>
                        {emptyTasksHint.title}
                      </Text>
                      <Text style={styles.dayEmptyHintSub}>{emptyTasksHint.sub}</Text>
                    </View>
                  </View>
                }
              />
            ) : (
              <DraggableFlatList
                data={sortedTasks}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderDragItem}
                onDragEnd={({ data }) => {
                  const ids = data.map((t) => t.id);
                  reorderTasksForDate(selectedKey, ids);
                }}
                removeClippedSubviews={false}
                initialNumToRender={12}
                windowSize={7}
                style={[styles.listExpand, monthOpenListShellStyle]}
                contentContainerStyle={[
                  styles.listContent,
                  listIsEmptyForActiveTab &&
                    (isCalendarStripExpanded
                      ? styles.listContentEmptyUnderOpenMonth
                      : styles.listContentEmptyCentered),
                  { paddingBottom: scrollBottomPadding },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.tasksPlaceholder}>
                    <View style={styles.monthEmptyMessageInner}>
                      <Text style={styles.dayEmptyHintTitle}>
                        {emptyTasksHint.title}
                      </Text>
                      <Text style={styles.dayEmptyHintSub}>{emptyTasksHint.sub}</Text>
                    </View>
                  </View>
                }
              />
            )
          ) : (
            <FlatList
              data={sortedHabits}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              style={[styles.listExpand, monthOpenListShellStyle]}
              contentContainerStyle={[
                styles.listContent,
                listIsEmptyForActiveTab &&
                  (isCalendarStripExpanded
                    ? styles.listContentEmptyUnderOpenMonth
                    : styles.listContentEmptyCentered),
                { paddingBottom: scrollBottomPadding },
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              ListEmptyComponent={
                <View style={styles.tasksPlaceholder}>
                  <View style={styles.monthEmptyMessageInner}>
                    <Text style={styles.dayEmptyHintTitle}>
                      {emptyHabitsHint.title}
                    </Text>
                    <Text style={styles.dayEmptyHintSub}>{emptyHabitsHint.sub}</Text>
                  </View>
                </View>
              }
            />
          )}
        </View>
      </View>

      <DailySummaryScreen
        visible={isDailySummaryVisible}
        onClose={() => setIsDailySummaryVisible(false)}
      />

      <Modal
        visible={!!actionsTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setActionsTarget(null)}
      >
        <TouchableOpacity
          style={styles.actionsBackdrop}
          activeOpacity={1}
          onPress={() => setActionsTarget(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.actionsCard}>
              <Text style={styles.actionsTitle} numberOfLines={1}>
                {actionsTarget?.title}
              </Text>
              <TouchableOpacity
                style={styles.actionsBtn}
                onPress={() => {
                  setEditTarget(actionsTarget);
                  setActionsTarget(null);
                }}
              >
                <Text style={styles.actionsBtnText}>Редагувати</Text>
              </TouchableOpacity>
              {calendarViewMode === 'day' &&
              (activeTab === 'tasks' ? sortedTasks.length > 1 : sortedHabits.length > 1) ? (
                <>
                  <TouchableOpacity
                    style={styles.actionsBtn}
                    onPress={() => moveDayItemOrder(actionsTarget, -1)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionsBtnText}>Вище в дні</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionsBtn}
                    onPress={() => moveDayItemOrder(actionsTarget, 1)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionsBtnText}>Нижче в дні</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              <TouchableOpacity
                style={[styles.actionsBtn, styles.actionsDeleteBtn]}
                onPress={() => {
                  setDeleteTarget(actionsTarget);
                  setActionsTarget(null);
                }}
              >
                <Text style={[styles.actionsBtnText, styles.actionsDeleteText]}>Видалити</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <EditTaskModal
        key={editTarget?.id != null ? String(editTarget.id) : 'edit-closed'}
        visible={!!editTarget}
        task={editTarget}
        onCancel={() => setEditTarget(null)}
        onSave={(patch) => {
          if (!editTarget) return;
          if (editTarget.type === 'habit') {
            updateHabit(editTarget.id, patch);
          } else {
            updateTask(editTarget.id, patch);
          }
          setEditTarget(null);
        }}
        onRequestDelete={() => {
          setDeleteTarget(editTarget);
          setEditTarget(null);
        }}
        onRequestReschedule={() => {
          setRescheduleTarget(editTarget);
          setEditTarget(null);
        }}
      />

      <DeleteTaskModal
        visible={!!deleteTarget}
        task={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(id) => {
          const t = deleteTarget;
          if (t?.type === 'habit') {
            deleteHabit(id);
          } else {
            deleteTask(id);
          }
          setDeleteTarget(null);
        }}
      />

      <RescheduleTaskModal
        visible={!!rescheduleTarget}
        task={rescheduleTarget}
        onCancel={() => setRescheduleTarget(null)}
        onConfirm={handleRescheduleConfirm}
      />

      <Modal
        visible={calendarMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.calendarMenuBackdrop}
          activeOpacity={1}
          onPress={() => setCalendarMenuVisible(false)}
        >
          <View style={styles.calendarMenuCard}>
            <TouchableOpacity
              style={[
                styles.calendarMenuItem,
                calendarViewMode === 'day' ? styles.calendarMenuItemActive : null,
              ]}
              onPress={() => {
                setCalendarViewMode('day');
                setCalendarStripMode('week');
                setCalendarMenuVisible(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.calendarMenuIconSlot}>
                <Image
                  source={require('../assets/icons/Vector1.png')}
                  style={
                    calendarViewMode === 'day'
                      ? styles.calendarMenuIconActive
                      : styles.calendarMenuIconInactive
                  }
                  resizeMode="contain"
                />
              </View>
              <Text
                style={
                  calendarViewMode === 'day'
                    ? styles.calendarMenuTextActive
                    : styles.calendarMenuTextInactive
                }
              >
                День
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.calendarMenuItem,
                calendarViewMode === 'week' ? styles.calendarMenuItemActive : null,
              ]}
              onPress={() => {
                setCalendarViewMode('day');
                setCalendarMenuVisible(false);
                navigation.navigate('WeekSchedule');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.calendarMenuIconSlot}>
                <Image
                  source={require('../assets/icons/Vector32.png')}
                  style={
                    calendarViewMode === 'week'
                      ? styles.calendarMenuIconActive
                      : styles.calendarMenuIconInactive
                  }
                  resizeMode="contain"
                />
              </View>
              <Text
                style={
                  calendarViewMode === 'week'
                    ? styles.calendarMenuTextActive
                    : styles.calendarMenuTextInactive
                }
              >
                Тиждень
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.calendarMenuItem,
                calendarViewMode === 'month' ? styles.calendarMenuItemActive : null,
              ]}
              onPress={() => {
                setCalendarViewMode('month');
                setCalendarStripMode('month');
                setCalendarMenuVisible(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.calendarMenuIconSlot}>
                <Image
                  source={require('../assets/icons/calendar 3.png')}
                  style={
                    calendarViewMode === 'month'
                      ? styles.calendarMenuIconActive
                      : styles.calendarMenuIconInactive
                  }
                  resizeMode="contain"
                />
              </View>
              <Text
                style={
                  calendarViewMode === 'month'
                    ? styles.calendarMenuTextActive
                    : styles.calendarMenuTextInactive
                }
              >
                Місяць
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.calendarMenuItem,
                calendarViewMode === 'threeDays' ? styles.calendarMenuItemActive : null,
              ]}
              onPress={() => {
                setCalendarViewMode('threeDays');
                setCalendarStripMode('week');
                setCalendarMenuVisible(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.calendarMenuIconSlot}>
                <Image
                  source={require('../assets/icons/Vector45.png')}
                  style={
                    calendarViewMode === 'threeDays'
                      ? styles.calendarMenuIconActive
                      : styles.calendarMenuIconInactive
                  }
                  resizeMode="contain"
                />
              </View>
              <Text
                style={
                  calendarViewMode === 'threeDays'
                    ? styles.calendarMenuTextActive
                    : styles.calendarMenuTextInactive
                }
              >
                3 дні
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  bottomWhiteUnderlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  calendarMenuBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  calendarMenuCard: {
    position: 'absolute',
    top: 72,
    right: SPACING.md,
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(69, 44, 22, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    paddingVertical: 8,
  },
  calendarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  calendarMenuItemActive: {
    backgroundColor: 'rgba(69, 44, 22, 0.20)',
    borderRadius: 5,
  },
  calendarMenuIconSlot: {
    width: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMenuIconPng: {
    width: 18,
    height: 18,
    tintColor: COLORS.primaryDark,
  },
  calendarMenuIconInactive: {
    width: 19,
    height: 19,
    tintColor: '#000000',
  },
  calendarMenuIconActive: {
    width: 19,
    height: 19,
    tintColor: '#452C16',
  },
  calendarMenuTextInactive: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#282828',
    marginLeft: 10,
  },
  calendarMenuTextActive: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#452C16',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  listExpand: {
    flex: 1,
    minHeight: 0,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    alignSelf: 'stretch',
  },
  dayTimelineHost: {
    position: 'relative',
    minHeight: 0,
  },
  dayFirstRunPlaceholder: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  dayFirstRunPlaceholderUnderOpenMonth: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.lg,
  },
  dayEmptyMessageInner: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 360,
    paddingHorizontal: SPACING.sm,
  },
  monthEmptyMessageInner: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 360,
    paddingHorizontal: SPACING.sm,
  },
  dayEmptyHintTitle: {
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
    color: COLORS.textSecondary,
    fontFamily: 'Montserrat-Medium',
    fontStyle: 'italic',
    textAlign: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  dayEmptyHintSub: {
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
    color: '#898989',
    fontFamily: 'Montserrat-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  listContent: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  listContentEmptyCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  listContentEmptyUnderOpenMonth: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  actionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  actionsCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  actionsTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  actionsBtn: {
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: COLORS.panelLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  actionsBtnText: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'Montserrat-Medium',
    color: COLORS.text,
  },
  actionsDeleteBtn: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F3C1C1',
  },
  actionsDeleteText: {
    color: '#B42318',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.panelLight,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingVertical: SPACING.lg,
    borderRadius: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'Montserrat-Medium',
    color: '#000000',
    lineHeight: 36,
  },
  statNumberMinor: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Montserrat-Medium',
    color: '#000000',
  },
  statLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primaryDark,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: 'normal',
  },
  flameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameIcon: {
    width: 32,
    height: 32,
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  whiteSectionShell: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginHorizontal: 0,
    marginTop: SPACING.sm,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  whiteSectionExpand: {
    flex: 1,
    minHeight: 260,
  },
  whiteSectionUnderOpenMonth: {
    flexGrow: 0,
    flexShrink: 0,
    flex: 0,
    minHeight: 0,
  },
  tabsPanel: {
    backgroundColor: COLORS.panelLight,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    position: 'relative',
    zIndex: 100,
    elevation: 0,
    overflow: 'visible',
  },
  tabsPanelMonthStripOpen: {
    elevation: 0,
  },
  segmentedWrapperMonthStripOpen: {
    elevation: 0,
  },
  tabsRailUnderSegment: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TIMELINE_SCALE_COLUMN_WIDTH_PX,
    height: DAY_TABS_RAIL_BRIDGE_H,
    zIndex: 102,
    elevation: 0,
  },
  segmentedWrapper: {
    position: 'relative',
    height: 48,
    width: '100%',
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    alignSelf: 'center',
    zIndex: 101,
    elevation: 0,
  },
  segmentedBaseBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: COLORS.panelLight,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  segmentedActiveBg: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '50%',
    backgroundColor: COLORS.accentBrown,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  segmentLeftActiveBg: {
    left: 0,
  },
  segmentRightActiveBg: {
    right: 0,
  },
  segmentedButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.accentBrown,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  segmentActiveText: {
    fontSize: FONTS.sizes.lg,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Montserrat-Medium',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.grayLight,
    minHeight: 40,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    fontSize: FONTS.sizes.md,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tasksPlaceholder: {
    alignSelf: 'stretch',
    width: '100%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksList: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  centerActionWrapper: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerActionPill: {
    flexDirection: 'row',
    backgroundColor: COLORS.panelLight,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    overflow: 'hidden',
  },
  centerActionSegment: {
    width: 64,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
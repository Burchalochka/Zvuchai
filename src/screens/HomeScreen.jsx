import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Modal, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList from 'react-native-draggable-flatlist';
import Header from '../components/common/Header';
import Calendar from '../components/calendar/Calendar';
import TaskTimelineItem from '../components/tasks/TaskTimelineItem';
import DailySummaryScreen from './DailySummaryScreen';
import DeleteTaskModal from '../components/modals/DeleteTaskModal';
import EditTaskModal from '../components/modals/EditTaskModal';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import { useSelectedDate } from '../context/SelectedDateContext';
import { useModal } from '../context/ModalContext';
import { getTranslation } from '../utils/translations';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { getTasksForDate } from '../services/DataLayerService';
import { getDayStats } from '../services/DaySummaryService';

const TAB_BAR_HEIGHT = 74;

const toDateKey = (d) => {
  if (!d) return null;
  const x = new Date(d);
  if (isNaN(x.getTime())) return null;
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const HomeScreen = () => {
  const { tasks, habits, toggleTaskComplete, toggleHabitComplete, deleteTask, updateTask, reorderTasksForDate } = useTasks();
  const { language } = useLanguage();
  const { selectedDate } = useSelectedDate();
  useModal();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isDailySummaryVisible, setIsDailySummaryVisible] = useState(false);
  const [calendarMenuVisible, setCalendarMenuVisible] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState('day'); // week | month | day | threeDays
  const [actionsTarget, setActionsTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const scrollBottomPadding = TAB_BAR_HEIGHT + insets.bottom + SPACING.lg;

  useEffect(() => {
    setSelectedItemId(null);
  }, [activeTab]);

  useEffect(() => {
    getTasksForDate(selectedDate);
  }, [selectedDate]);

  const selectedKey = toDateKey(selectedDate);
  const tasksForDay = (tasks || []).filter(
    (t) => t && t.date === selectedKey && !t.deletedAt && !t.archived,
  );
  const habitsForDay = (habits || []).filter(
    (h) => h && h.date === selectedKey && !h.deletedAt && !h.archived,
  );

  // (no dev logs)
  useEffect(() => {
    if (!__DEV__) return;
    if (activeTab !== 'tasks') return;
    const first = (tasksForDay || [])[0];
    console.log('[HomeScreen][tasks] selectedKey=', selectedKey, 'tasksForDay=', (tasksForDay || []).length);
    console.log('[HomeScreen][tasks] first=', first ? {
      id: first.id,
      title: first.title,
      startTime: first.startTime,
      endTime: first.endTime,
      date: first.date,
      type: first.type,
      status: first.status,
    } : null);
  }, [activeTab, selectedKey, tasksForDay]);

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
    const aStr = (a && a.startTime) ? String(a.startTime) : '09:00';
    const bStr = (b && b.startTime) ? String(b.startTime) : '09:00';
    const [aHours, aMinutes] = aStr.split(':').map(Number);
    const [bHours, bMinutes] = bStr.split(':').map(Number);
    return (aHours || 0) * 60 + (aMinutes || 0) - (bHours || 0) * 60 - (bMinutes || 0);
  });

  // const currentItems = activeTab === 'tasks' ? sortedTasks : sortedHabits;

  const stats = getDayStats(tasksForDay);

  const taskCountsByDate = (tasks || []).reduce((acc, task) => {
    const key = task && task.date;
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setEditTarget(item)}
      onLongPress={() => setActionsTarget(item)}
    >
      <TaskTimelineItem
        task={item}
        selected={selectedItemId === item.id}
        onToggleComplete={activeTab === 'tasks' ? toggleTaskComplete : toggleHabitComplete}
        onOpenActions={(t) => setActionsTarget(t)}
      />
    </TouchableOpacity>
  );

  const renderDragItem = ({ item, drag }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setEditTarget(item)}
      onLongPress={drag}
    >
      <TaskTimelineItem
        task={item}
        selected={selectedItemId === item.id}
        onToggleComplete={toggleTaskComplete}
        onOpenActions={(t) => setActionsTarget(t)}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header onCalendarPress={() => setCalendarMenuVisible(true)} />
      <View style={styles.content}>
        {/* Статистика — натискання відкриває DailySummary */}
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
          viewMode={calendarViewMode === 'month' ? 'month' : 'week'}
          onViewModeChange={(m) => setCalendarViewMode(m)}
        />

        <View style={styles.whiteSection}>
          <View style={styles.tabsPanel}>
            <View style={styles.segmentedWrapper}>
              <View style={styles.segmentedBaseBg} pointerEvents="none" />
              <View
                style={[
                  styles.segmentedActiveBg,
                  activeTab === 'tasks' ? styles.segmentLeftActiveBg : styles.segmentRightActiveBg,
                ]}
                pointerEvents="none"
              />
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
          {activeTab === 'tasks' ? (
            Platform.OS === 'android' ? (
              <FlatList
                data={sortedTasks}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                style={styles.list}
                contentContainerStyle={[
                  styles.listContent,
                  { paddingBottom: scrollBottomPadding },
                  !sortedTasks.length ? styles.listContentEmpty : null,
                ]}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                ListEmptyComponent={
                  <View style={styles.tasksPlaceholder}>
                    <View style={styles.placeholderInner}>
                      <Text style={styles.habitsHint}>
                        {getTranslation('startJourney', language)}
                      </Text>
                      <Text style={styles.habitsHintSub}>
                        {getTranslation('addFirst', language)}
                      </Text>
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
                style={styles.list}
                contentContainerStyle={[
                  styles.listContent,
                  { paddingBottom: scrollBottomPadding },
                  !sortedTasks.length ? styles.listContentEmpty : null,
                ]}
                showsVerticalScrollIndicator={false}
              />
            )
          ) : (
            <FlatList
              data={sortedHabits}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              style={styles.list}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: scrollBottomPadding },
                !sortedHabits.length ? styles.listContentEmpty : null,
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              ListEmptyComponent={
                <View style={styles.tasksPlaceholder}>
                  <View style={styles.placeholderInner}>
                    <Text style={styles.habitsHint}>
                      {getTranslation('startJourney', language)}
                    </Text>
                    <Text style={styles.habitsHintSub}>
                      {getTranslation('addFirst', language)}
                    </Text>
                  </View>
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* Екран підсумків дня */}
      <DailySummaryScreen
        visible={isDailySummaryVisible}
        onClose={() => setIsDailySummaryVisible(false)}
      />

      {/* Actions (simple inline sheet) */}
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
        visible={!!editTarget}
        task={editTarget}
        onCancel={() => setEditTarget(null)}
        onSave={(patch) => {
          updateTask(editTarget.id, patch);
          setEditTarget(null);
        }}
      />

      <DeleteTaskModal
        visible={!!deleteTarget}
        task={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(id) => {
          deleteTask(id);
          setDeleteTarget(null);
        }}
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
                setCalendarViewMode('week');
                setCalendarMenuVisible(false);
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
  list: {
    flex: 1,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  listContentEmpty: {
    flexGrow: 1,
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
  whiteSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginHorizontal: 0,
    marginTop: SPACING.sm,
    minHeight: 260,
  },
  tabsPanel: {
    backgroundColor: COLORS.panelLight,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  segmentedWrapper: {
    position: 'relative',
    height: 48,
    width: '100%',
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    alignSelf: 'center',
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
    flex: 1,
    marginTop: SPACING.lg,
    padding: SPACING.xl,
    minHeight: 120,
  },
  placeholderInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FONTS.sizes.xs,
    color: '#898989',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
  placeholderSubtext: {
    fontSize: FONTS.sizes.xs,
    color: '#898989',
    marginTop: SPACING.xs,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
  habitsHint: {
    fontSize: FONTS.sizes.xs,
    color: '#898989',
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 1,
    fontFamily: 'Montserrat-Regular',
  },
  habitsHintSub: {
    fontSize: FONTS.sizes.xs,
    color: '#898989',
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 1,
    marginTop: SPACING.xs,
    fontFamily: 'Montserrat-Regular',
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
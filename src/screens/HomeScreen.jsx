import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import Calendar from '../components/calendar/Calendar';
import TaskTimelineItem from '../components/tasks/TaskTimelineItem';
import DailySummaryScreen from './DailySummaryScreen';
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
  const { tasks, habits, goals, addTask, addHabit, addGoal, toggleTaskComplete, toggleHabitComplete } = useTasks();
  const { language } = useLanguage();
  const { selectedDate } = useSelectedDate();
  const { openAddModal } = useModal();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const [totalContentHeight, setTotalContentHeight] = useState(0);
  const [isDailySummaryVisible, setIsDailySummaryVisible] = useState(false);
  const isScrollEnabled = totalContentHeight > scrollViewportHeight + 1;
  const scrollBottomPadding = TAB_BAR_HEIGHT + insets.bottom + SPACING.lg;

  useEffect(() => {
    setSelectedItemId(null);
  }, [activeTab]);

  useEffect(() => {
    getTasksForDate(selectedDate);
  }, [selectedDate]);

  const selectedKey = toDateKey(selectedDate);
  const tasksForDay = (tasks || []).filter((t) => t && t.date === selectedKey && t.isInbox !== true);
  const habitsForDay = (habits || []).filter((h) => h && h.date === selectedKey);

  const sortedTasks = [...tasksForDay].sort((a, b) => {
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

  const currentItems = activeTab === 'tasks' ? sortedTasks : sortedHabits;
  const hasItems = currentItems.length > 0;

  const stats = getDayStats(tasksForDay);

  const taskCountsByDate = (tasks || []).reduce((acc, task) => {
    const key = task && task.date;
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        onLayout={(e) => setScrollViewportHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(w, h) => setTotalContentHeight(h)}
        scrollEnabled={isScrollEnabled}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
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

        <Calendar taskCountsByDate={taskCountsByDate} />

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
          {hasItems ? (
            <View style={styles.tasksList}>
              {currentItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedItemId((id) => (id === item.id ? null : item.id))}
                >
                  <TaskTimelineItem
                    task={item}
                    selected={selectedItemId === item.id}
                    onToggleComplete={activeTab === 'tasks' ? toggleTaskComplete : toggleHabitComplete}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.tasksPlaceholder}>
              <View style={styles.placeholderInner}>
                {activeTab === 'tasks' ? (
                  <>
                    <Text style={styles.placeholderText}>{getTranslation('noTasks', language)}</Text>
                    <Text style={styles.placeholderSubtext}>
                      {getTranslation('createFirst', language)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.habitsHint}>
                      {getTranslation('startJourney', language)}
                    </Text>
                    <Text style={styles.habitsHintSub}>
                      {getTranslation('addFirst', language)}
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Екран підсумків дня */}
      <DailySummaryScreen
        visible={isDailySummaryVisible}
        onClose={() => setIsDailySummaryVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: SPACING.lg,
    marginHorizontal: 0,
    marginTop: SPACING.sm,
    overflow: 'hidden',
    minHeight: 200,
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
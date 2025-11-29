import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import Calendar from '../components/calendar/Calendar';
import TaskTimelineItem from '../components/tasks/TaskTimelineItem';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { COLORS, SPACING, FONTS } from '../styles/theme';

const HomeScreen = () => {
  const { tasks, habits, goals, addTask, addHabit, addGoal, toggleTaskComplete, toggleHabitComplete } = useTasks();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('tasks');
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const [totalContentHeight, setTotalContentHeight] = useState(0);
  const isScrollEnabled = totalContentHeight > scrollViewportHeight + 1;

  const sortedTasks = [...tasks].sort((a, b) => {
    const [aHours, aMinutes] = a.startTime.split(':').map(Number);
    const [bHours, bMinutes] = b.startTime.split(':').map(Number);
    return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
  });

  const sortedHabits = [...habits].sort((a, b) => {
    const [aHours, aMinutes] = a.startTime.split(':').map(Number);
    const [bHours, bMinutes] = b.startTime.split(':').map(Number);
    return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
  });

  const currentItems = activeTab === 'tasks' ? sortedTasks : sortedHabits;
  const hasItems = currentItems.length > 0;
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        onLayout={(e) => setScrollViewportHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(w, h) => setTotalContentHeight(h)}
        scrollEnabled={isScrollEnabled}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={styles.zeroRow}>
              <Text style={styles.zeroLarge}>0</Text>
              <Text style={styles.zeroSlash}>/</Text>
              <Text style={styles.zeroSmall}>0</Text>
            </View>
            <Text style={styles.statLabel}>{getTranslation('completed', language)}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.flameContainer}>
              <Text style={styles.statValue}>0</Text>
              <Image 
                source={require('../assets/icons/5e7dd1907f8677660224a5cc413fab5fbf1ba689.png')} 
                style={styles.flameIcon}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={styles.percentRow}>
              <Text style={styles.percentZero}>0</Text>
              <Text style={styles.percentSymbol}>%</Text>
            </View>
            <Text style={styles.statLabel}>{getTranslation('progress', language)}</Text>
          </View>
        </View>

        <Calendar />

        <View style={styles.whiteSection}>
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
          {hasItems ? (
            <View style={styles.tasksList}>
              {currentItems.map((item) => (
                <TaskTimelineItem
                  key={item.id}
                  task={item}
                  onToggleComplete={activeTab === 'tasks' ? toggleTaskComplete : toggleHabitComplete}
                />
              ))}
            </View>
          ) : (
            <View style={styles.tasksPlaceholder}>
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
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 0,
    flexGrow: 1,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#98CFC7',
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
  statValue: {
    fontSize: 40,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
    color: '#1B4332',
    lineHeight: 40,
  },
  zeroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zeroBaseWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zeroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  zeroLarge: {
    fontSize: 40,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
    color: '#1B4332',
    lineHeight: 40,
    includeFontPadding: false,
  },
  superscriptGroup: {
    position: 'absolute',
    top: FONTS.sizes.sm,
    left: FONTS.sizes.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  zeroSlash: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: '#1B4332',
    lineHeight: FONTS.sizes.lg,
    includeFontPadding: false,
  },
  zeroSmall: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: '#1B4332',
    lineHeight: FONTS.sizes.lg,
    marginLeft: 2,
    marginTop: -2,
    includeFontPadding: false,
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  percentZero: {
    fontSize: 40,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
    color: '#1B4332',
    lineHeight: 40,
    includeFontPadding: false,
  },
  percentSymbol: {
    position: 'absolute',
    top: FONTS.sizes.sm,
    right: -FONTS.sizes.md,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: '#1B4332',
    lineHeight: FONTS.sizes.lg,
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: FONTS.sizes.md,
    color: '#1B4332',
    marginTop: SPACING.xs,
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
    flexGrow: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: SPACING.md,
    paddingTop: 0,
    paddingBottom: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  segmentedWrapper: {
    position: 'relative',
    height: 48,
    width: '100%',
    marginLeft: -SPACING.lg,
    marginRight: -SPACING.lg,
    marginTop: 0,
    alignSelf: 'center',
  },
  segmentedBaseBg: {
    position: 'absolute',
    top: 0,
    left: -SPACING.lg,
    right: -SPACING.lg,
    height: '100%',
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  segmentedActiveBg: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '65%',
    backgroundColor: COLORS.primaryStrong,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  segmentLeftActiveBg: {
    left: -SPACING.lg,
    marginLeft: -SPACING.md,
  },
  segmentRightActiveBg: {
    right: -SPACING.lg,
    marginRight: -SPACING.md,
  },
  segmentedButtons: {
    position: 'absolute',
    top: 0,
    left: -SPACING.lg,
    right: -SPACING.lg,
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
    color: COLORS.text,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  segmentActiveText: {
    fontSize: FONTS.sizes.lg,
    color: '#FFFFFF',
    fontWeight: '500',
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
    marginTop: SPACING.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.7,
    fontFamily: 'Montserrat-Medium',
  },
  placeholderSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.7,
    fontFamily: 'Montserrat-Medium',
  },
  habitsHint: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.7,
    fontFamily: 'Montserrat-Medium',
  },
  habitsHintSub: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.7,
    marginTop: SPACING.xs,
    fontFamily: 'Montserrat-Medium',
  },
  tasksList: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
});

export default HomeScreen;
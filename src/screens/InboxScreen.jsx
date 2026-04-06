import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import { useTasks } from '../context/TasksContext';
import { COLORS, SPACING, FONTS } from '../styles/theme';

const TAB_BAR_HEIGHT = 74;

/**
 * @typedef {'pending' | 'completed' | 'requires_review'} TaskStatus
 */

/**
 * @typedef {Object} InboxTask
 * @property {string} id
 * @property {string} title
 * @property {string | undefined} startTime
 * @property {number | undefined} durationMinutes
 * @property {TaskStatus} status
 * @property {number | undefined} confidenceScore
 * @property {'none' | 'flexible' | 'exact' | undefined} deadlineType
 * @property {string | undefined} dateInfo
 * @property {string | undefined} timeInfo
 * @property {string | undefined} dateRange
 */

/** @type {InboxTask[]} */
const MOCK_TASKS = [
  {
    id: 't1',
    title: 'Спланувати тиждень у Zvychai',
    startTime: undefined,
    durationMinutes: 30,
    status: 'requires_review',
    confidenceScore: 65,
    deadlineType: 'exact',
    dateInfo: 'Сьогодні',
    timeInfo: '14:00',
    dateRange: undefined,
  },
  {
    id: 't2',
    title: 'Написати список бажань на весну',
    startTime: undefined,
    durationMinutes: undefined,
    status: 'requires_review',
    confidenceScore: 72,
    deadlineType: 'flexible',
    dateInfo: 'Цього тижня',
    timeInfo: undefined,
    dateRange: '23 лютого — 1 березня',
  },
  {
    id: 't3',
    title: 'Розібрати нотатки в блокноті',
    startTime: undefined,
    durationMinutes: 45,
    status: 'pending',
    confidenceScore: undefined,
    deadlineType: 'none',
    dateInfo: 'Без дедлайну',
    timeInfo: undefined,
    dateRange: undefined,
  },
  {
    id: 't4',
    title: 'Зробити резервну копію важливих файлів',
    startTime: undefined,
    durationMinutes: 60,
    status: 'pending',
    confidenceScore: undefined,
    deadlineType: 'flexible',
    dateInfo: 'Цього тижня',
    timeInfo: undefined,
    dateRange: '23 лютого — 1 березня',
  },
];

const MAIN_TABS = {
  NO_DEADLINE: 'no_deadline',
  AI_UNSURE: 'ai_unsure',
};

const SUB_TABS = {
  TODAY: 'today',
  ALL: 'all',
  FAVORITES: 'favorites',
};

const InboxScreen = () => {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();

  const [activeMainTab, setActiveMainTab] = useState(MAIN_TABS.NO_DEADLINE);
  const [activeSubTab, setActiveSubTab] = useState(SUB_TABS.ALL);
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);

  // Convert real tasks to inbox task format
  const inboxTasks = useMemo(() => {
    return tasks
      .filter(task => task.isInbox === true)
      .map(task => {
        // Determine date info based on task date
        let dateInfo = 'Без дати';
        if (task.date) {
          const today = new Date().toISOString().split('T')[0];
          if (task.date === today) {
            dateInfo = 'Сьогодні';
          } else {
            dateInfo = task.date;
          }
        } else if (task.startDate && task.endDate) {
          dateInfo = 'Діапазон дат';
        }

        // Determine deadline type based on task properties
        let deadlineType = 'none';
        if (task.deadline) {
          deadlineType = 'exact';
        } else if (task.startDate && task.endDate) {
          deadlineType = 'flexible';
        }

        // Determine status for AI unsure tab
        const status = task.status === 'requires_review' ? 'requires_review' : 'pending';

        return {
          id: task.id,
          title: task.title,
          startTime: task.startTime,
          durationMinutes: task.estimatedDuration,
          status,
          confidenceScore: task.confidenceScore || undefined,
          deadlineType,
          dateInfo,
          timeInfo: task.startTime,
          dateRange: task.startDate && task.endDate ? `${task.startDate} — ${task.endDate}` : undefined,
        };
      });
  }, [tasks]);

  const handleMainTabChange = (tabKey) => {
    setActiveMainTab(tabKey);
    if (tabKey === MAIN_TABS.AI_UNSURE) {
      setActiveSubTab(SUB_TABS.TODAY);
    } else {
      setActiveSubTab(SUB_TABS.ALL);
    }
  };

  const handleSubTabPress = (subKey) => {
    if (subKey === SUB_TABS.FAVORITES) {
      setActiveSubTab(SUB_TABS.FAVORITES);
      setIsCalendarModalVisible(true);
      return;
    }
    setActiveSubTab(subKey);
  };

  const filteredTasks = useMemo(() => {
    const base =
      activeMainTab === MAIN_TABS.AI_UNSURE
        ? inboxTasks.filter((t) => t.status === 'requires_review')
        : inboxTasks.filter((t) => t.status !== 'requires_review');

    if (activeMainTab === MAIN_TABS.AI_UNSURE && activeSubTab === SUB_TABS.TODAY) {
      return base.filter((t) => (t.dateInfo || '').toLowerCase().includes('сьогодні'));
    }

    return base;
  }, [activeMainTab, activeSubTab, inboxTasks]);

  const scrollBottomPadding = TAB_BAR_HEIGHT + insets.bottom + SPACING.lg;

  const renderSubTabs = () => {
    const isAiTab = activeMainTab === MAIN_TABS.AI_UNSURE;

    if (isAiTab) {
      const subSegments = [
        { key: SUB_TABS.TODAY, label: 'Сьогодні' },
        { key: SUB_TABS.ALL, label: 'Усі' },
        { key: SUB_TABS.FAVORITES, label: 'Обране' },
      ];
      const activeIndex = subSegments.findIndex((s) => s.key === activeSubTab);

      return (
        <View style={styles.subTabsContainer}>
          <View style={styles.subSegmentedWrapper3}>
            <View style={styles.subSegmentedBaseBg} pointerEvents="none" />
            <View
              style={[
                styles.subSegmentedActiveBg,
                activeIndex === 0 && styles.subSegmentLeftBg,
                activeIndex === 1 && styles.subSegmentCenterBg,
                activeIndex === 2 && styles.subSegmentRightBg,
              ]}
              pointerEvents="none"
            />
            <View style={styles.subSegmentedButtons}>
              {subSegments.map((seg) => (
                <TouchableOpacity
                  key={seg.key}
                  style={styles.subSegmentButton}
                  onPress={() => handleSubTabPress(seg.key)}
                >
                  <Text
                    style={
                      activeSubTab === seg.key
                        ? styles.subSegmentActiveText
                        : styles.subSegmentText
                    }
                  >
                    {seg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    const subSegments2 = [
      { key: SUB_TABS.ALL, label: 'Усі' },
      { key: SUB_TABS.FAVORITES, label: 'Обране' },
    ];
    const activeIndex2 = subSegments2.findIndex((s) => s.key === activeSubTab);

    return (
      <View style={styles.subTabsContainer}>
        <View style={styles.subSegmentedWrapper2}>
          <View style={styles.subSegmentedBaseBg} pointerEvents="none" />
          <View
            style={[
              styles.subSegmentedActiveBgTwo,
              activeIndex2 === 0 ? styles.subSegmentLeftBg : styles.subSegmentRightBgTwo,
            ]}
            pointerEvents="none"
          />
          <View style={styles.subSegmentedButtons}>
            {subSegments2.map((seg) => (
              <TouchableOpacity
                key={seg.key}
                style={styles.subSegmentButton}
                onPress={() => handleSubTabPress(seg.key)}
              >
                <Text
                  style={
                    activeSubTab === seg.key
                      ? styles.subSegmentActiveText
                      : styles.subSegmentText
                  }
                >
                  {seg.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header onMenuPress={() => setIsSideMenuVisible((prev) => !prev)} />

      {/* Main segmented control — flush to header */}
      <View style={styles.mainSegmentedWrapper}>
        <View style={styles.mainSegmentedBaseBg} pointerEvents="none" />
        <View
          style={[
            styles.mainSegmentedActiveBg,
            activeMainTab === MAIN_TABS.NO_DEADLINE
              ? styles.segmentLeftActiveBg
              : styles.segmentRightActiveBg,
          ]}
          pointerEvents="none"
        />
        <View style={styles.mainSegmentedButtons}>
          <TouchableOpacity
            style={styles.segmentButton}
            onPress={() => handleMainTabChange(MAIN_TABS.NO_DEADLINE)}
          >
            <Text
              style={
                activeMainTab === MAIN_TABS.NO_DEADLINE
                  ? styles.segmentActiveText
                  : styles.segmentText
              }
            >
              Без дедлайну
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.segmentButton}
            onPress={() => handleMainTabChange(MAIN_TABS.AI_UNSURE)}
          >
            <Text
              style={
                activeMainTab === MAIN_TABS.AI_UNSURE
                  ? styles.segmentActiveText
                  : styles.segmentText
              }
            >
              ШІ не впевнений
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub tabs */}
      {renderSubTabs()}

      <View style={styles.content}>
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InboxTaskCard
              task={item}
              showConfidence={activeMainTab === MAIN_TABS.AI_UNSURE}
              mainTab={activeMainTab}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: scrollBottomPadding },
            filteredTasks.length === 0 && styles.listEmptyContent,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Image style={styles.emptyImage} resizeMode="contain" />
              <Text style={styles.emptyText}>
                Усе розкладено по поличках. Нерозпізнаних завдань немає.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        />
      </View>

      {isSideMenuVisible && (
        <Pressable
          style={styles.sideMenuOverlay}
          onPress={() => setIsSideMenuVisible(false)}
        >
          <View style={styles.sideMenuPill}>
            <Icon name="list-outline" size={24} color="#514134" style={styles.sideMenuIcon} />
            <Icon name="calendar-outline" size={24} color="#514134" style={styles.sideMenuIcon} />
            <Icon name="star-outline" size={24} color="#514134" style={styles.sideMenuIcon} />
            <Icon name="settings-outline" size={24} color="#514134" style={styles.sideMenuIcon} />
          </View>
        </Pressable>
      )}

      <CalendarRangeModal
        visible={isCalendarModalVisible}
        onClose={() => setIsCalendarModalVisible(false)}
      />
    </SafeAreaView>
  );
};

// ─── Task Card ────────────────────────────────────────────────────────────────

const InboxTaskCard = ({ task, showConfidence, mainTab }) => {
  const isNoDeadline = mainTab === MAIN_TABS.NO_DEADLINE;
  const hasConfidence = showConfidence && typeof task.confidenceScore === 'number';

  if (isNoDeadline) {
    // "Без дедлайну" layout: content left, action buttons top-right stacked
    return (
      <View style={styles.cardContainer}>
        {/* Content */}
        <View style={styles.cardContentNoDeadline}>
          <Text style={styles.cardTitle}>{task.title}</Text>
          <View style={styles.cardDateRow}>
            <Icon name="calendar-outline" size={15} color="#514134" style={styles.cardDateIcon} />
            <View>
              <Text style={styles.cardDateText}>{task.dateInfo || 'Без дати'}</Text>
              {task.dateRange ? (
                <Text style={styles.cardDateSubText}>{task.dateRange}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Top-right action buttons */}
        <View style={styles.noDeadlineActions}>
          <TouchableOpacity style={styles.circleActionBtn}>
            <Icon name="close-outline" size={18} color="#514134" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleActionBtn, { marginTop: 6 }]}>
            <Icon name="pencil-outline" size={16} color="#514134" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // "ШІ не впевнений" layout: compact, actions inline with date row
  return (
    <View style={styles.cardContainerAi}>
      {/* Header row: title + confidence badge */}
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitleAi}>{task.title}</Text>
        {hasConfidence && (
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{`${task.confidenceScore}%`}</Text>
          </View>
        )}
      </View>

      {/* Bottom row: date info + action buttons on the right */}
      <View style={styles.cardBottomRow}>
        <View style={styles.cardDateRow}>
          <Icon name="calendar-outline" size={15} color="#514134" style={styles.cardDateIcon} />
          <View>
            <Text style={styles.cardDateText}>
              {task.dateInfo}
              {task.timeInfo ? ` • ${task.timeInfo}` : ''}
            </Text>
            {task.dateRange ? (
              <Text style={styles.cardDateSubText}>{task.dateRange}</Text>
            ) : null}
          </View>
        </View>

        {/* Action buttons: check, X, pencil — neutral colors */}
        <View style={styles.aiActionsRow}>
          <TouchableOpacity style={styles.circleActionBtn}>
            <Icon name="checkmark-outline" size={17} color="#514134" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleActionBtn, { marginHorizontal: 4 }]}>
            <Icon name="close-outline" size={17} color="#514134" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleActionBtn}>
            <Icon name="pencil-outline" size={15} color="#514134" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── Calendar Modal ───────────────────────────────────────────────────────────

const CalendarRangeModal = ({ visible, onClose }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Період виконання</Text>
          <Text style={styles.modalSubtitle}>Оберіть початкову та кінцеву дату</Text>

          <DateRangeCalendar
            startDate={startDate}
            endDate={endDate}
            onChange={(nextStart, nextEnd) => {
              setStartDate(nextStart);
              setEndDate(nextEnd);
            }}
          />

          <TouchableOpacity style={styles.modalConfirmButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.modalConfirmText}>Підтвердити</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Date Range Calendar ──────────────────────────────────────────────────────

const MONTH_NAMES_UA = [
  'Січень','Лютий','Березень','Квітень','Травень','Червень',
  'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень',
];
const WEEK_DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

const startOfDay = (date) => {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return startOfDay(a).getTime() === startOfDay(b).getTime();
};

const isBetweenExclusive = (date, start, end) => {
  if (!start || !end) return false;
  const t = startOfDay(date).getTime();
  return t > startOfDay(start).getTime() && t < startOfDay(end).getTime();
};

const buildMonthDays = (currentMonthDate) => {
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const days = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ date: prevMonthDays - i, isCurrentMonth: false, fullDate: new Date(year, month - 1, prevMonthDays - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: i, isCurrentMonth: true, fullDate: new Date(year, month, i) });
  }
  const totalSlots = Math.ceil(days.length / 7) * 7;
  const nextMonthDate = new Date(year, month + 1, 1);
  let extraDay = 1;
  while (days.length < totalSlots) {
    days.push({ date: extraDay, isCurrentMonth: false, fullDate: new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), extraDay) });
    extraDay += 1;
  }
  return days;
};

const DateRangeCalendar = ({ startDate, endDate, onChange }) => {
  const [currentMonth, setCurrentMonth] = useState(() => startOfDay(startDate) || new Date());
  const monthDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);

  const handleDayPress = (day) => {
    const selectedDate = startOfDay(day.fullDate);
    if (!startDate || (startDate && endDate)) {
      onChange(selectedDate, null);
      return;
    }
    const s = startOfDay(startDate);
    if (selectedDate.getTime() <= s.getTime()) {
      onChange(selectedDate, null);
    } else {
      onChange(startDate, selectedDate);
    }
  };

  const handleChangeMonth = (direction) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(next);
  };

  const headerLabel = `${MONTH_NAMES_UA[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  return (
    <View style={styles.rangeCalendarContainer}>
      <View style={styles.rangeCalendarHeader}>
        <TouchableOpacity style={styles.rangeMonthButton} onPress={() => handleChangeMonth(-1)} activeOpacity={0.8}>
          <Icon name="chevron-back" size={20} color="#514134" />
        </TouchableOpacity>
        <Text style={styles.rangeCalendarHeaderText}>{headerLabel}</Text>
        <TouchableOpacity style={styles.rangeMonthButton} onPress={() => handleChangeMonth(1)} activeOpacity={0.8}>
          <Icon name="chevron-forward" size={20} color="#514134" />
        </TouchableOpacity>
      </View>
      <View style={styles.rangeWeekDaysRow}>
        {WEEK_DAYS_SHORT.map((label) => (
          <Text key={label} style={styles.rangeWeekDayLabel}>{label}</Text>
        ))}
      </View>
      <View style={styles.rangeMonthGrid}>
        {monthDays.map((day, index) => {
          const isStart = isSameDay(day.fullDate, startDate);
          const isEnd = isSameDay(day.fullDate, endDate);
          const inRange = isBetweenExclusive(day.fullDate, startDate, endDate);
          return (
            <TouchableOpacity
              key={`${day.fullDate.toISOString()}-${index}`}
              style={styles.rangeDayWrapper}
              activeOpacity={0.8}
              onPress={() => handleDayPress(day)}
            >
              <View style={[
                styles.rangeDayInner,
                !day.isCurrentMonth && styles.rangeDayOtherMonth,
                inRange && styles.rangeDayInRange,
                (isStart || isEnd) && styles.rangeDayEdge,
              ]}>
                <Text style={[
                  styles.rangeDayText,
                  !day.isCurrentMonth && styles.rangeDayTextOther,
                  (isStart || isEnd) && styles.rangeDayTextEdge,
                ]}>
                  {day.date}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F9',
  },
  content: {
    flex: 1,
    backgroundColor: '#FAF9F9',
  },

  // ── Main segmented control (flush to header, full width, rounded top) ──
  mainSegmentedWrapper: {
    position: 'relative',
    height: 52,
    width: '100%',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    overflow: 'hidden',
    marginTop: 12,
  },
  mainSegmentedBaseBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.base,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
  },
  mainSegmentedActiveBg: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '50%',
    backgroundColor: COLORS.primaryDark,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
  },
  segmentLeftActiveBg: { left: 0 },
  segmentRightActiveBg: { right: 0 },
  mainSegmentedButtons: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: FONTS.sizes.md,
    color: '#514134',
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  segmentActiveText: {
    fontSize: FONTS.sizes.md,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },

  // ── Sub tabs ──
  subTabsContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FAF9F9',
  },
  subSegmentedWrapper2: {
    position: 'relative',
    height: 38,
    width: '55%',
    maxWidth: 220,
    alignSelf: 'center',
  },
  subSegmentedWrapper3: {
    position: 'relative',
    height: 38,
    width: '78%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  subSegmentedBaseBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: '100%',
    backgroundColor: '#F8F5E9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#452C16',
  },
  subSegmentedActiveBg: {
    position: 'absolute',
    top: 1,
    bottom: 1,
    height: undefined,
    width: '33.33%',
    backgroundColor: COLORS.primaryDark || '#514134',
    borderRadius: 18,
  },
  subSegmentedActiveBgTwo: {
    position: 'absolute',
    top: 1,
    bottom: 1,
    height: undefined,
    width: '50%',
    backgroundColor: COLORS.primaryDark || '#514134',
    borderRadius: 18,
  },
  subSegmentLeftBg: { left: 1 },
  subSegmentCenterBg: { left: '33.33%' },
  subSegmentRightBg: { left: '66.66%' },
  subSegmentRightBgTwo: { left: '50%' },
  subSegmentedButtons: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
  },
  subSegmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subSegmentText: {
    fontSize: FONTS.sizes.sm,
    color: '#514134',
    fontFamily: 'Montserrat-Medium',
  },
  subSegmentActiveText: {
    fontSize: FONTS.sizes.sm,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },

  // ── List ──
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // ── Card: Без дедлайну ──
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 14,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E4DCC8',
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardContentNoDeadline: {
    flex: 1,
    paddingRight: 8,
  },
  noDeadlineActions: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 10,
  },

  // ── Card: ШІ не впевнений ──
  cardContainerAi: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E4DCC8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleAi: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: '#514134',
    fontFamily: 'Montserrat-SemiBold',
    marginRight: SPACING.sm,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },

  // ── Shared card elements ──
  cardTitle: {
    fontSize: FONTS.sizes.md,
    color: '#514134',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
    marginRight: 8,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardDateIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  cardDateText: {
    fontSize: FONTS.sizes.sm,
    color: '#514134',
    fontFamily: 'Montserrat-Regular',
  },
  cardDateSubText: {
    fontSize: FONTS.sizes.xs,
    color: '#888',
    fontFamily: 'Montserrat-Regular',
    marginTop: 1,
  },

  // ── Confidence badge ──
  confidenceBadge: {
    minWidth: 44,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F8F5E9',
    borderWidth: 1,
    borderColor: '#514134',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceText: {
    fontSize: FONTS.sizes.xs,
    color: '#514134',
    fontFamily: 'Montserrat-Medium',
  },

  // ── Circle action button (neutral, for both tabs) ──
  circleActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8F5E9',
    borderWidth: 1,
    borderColor: '#E4DCC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Empty state ──
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyImage: {
    width: 180,
    height: 140,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: '#514134',
    textAlign: 'center',
    fontFamily: 'Montserrat-Medium',
  },

  // ── Side menu ──
  sideMenuOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  sideMenuPill: {
    marginLeft: SPACING.md,
    height: '50%',
    maxHeight: 320,
    width: 70,
    backgroundColor: '#F8F5E9',
    borderRadius: 999,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sideMenuIcon: {
    marginVertical: SPACING.xs,
  },

  // ── Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    color: '#514134',
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: '#514134',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  modalConfirmButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryDark || '#514134',
    borderRadius: 24,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: FONTS.sizes.md,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },

  // ── Range Calendar ──
  rangeCalendarContainer: {
    marginTop: SPACING.lg,
  },
  rangeCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  rangeMonthButton: {
    padding: SPACING.xs,
  },
  rangeCalendarHeaderText: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'Montserrat-Medium',
    color: '#514134',
  },
  rangeWeekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  rangeWeekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    color: '#514134',
    fontFamily: 'Montserrat-Medium',
  },
  rangeMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rangeDayWrapper: {
    width: '14.28%',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeDayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeDayInRange: {
    backgroundColor: '#F8F5E9',
  },
  rangeDayEdge: {
    backgroundColor: '#FEFDEB',
    borderWidth: 1,
    borderColor: '#514134',
  },
  rangeDayOtherMonth: {
    opacity: 0.35,
  },
  rangeDayText: {
    fontSize: FONTS.sizes.sm,
    color: '#514134',
    fontFamily: 'Montserrat-Medium',
  },
  rangeDayTextOther: {
    color: '#8F8F8F',
  },
  rangeDayTextEdge: {
    color: '#321E00',
    fontWeight: '600',
  },
});

export default InboxScreen;

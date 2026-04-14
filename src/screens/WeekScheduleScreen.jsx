import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { FONTS, SPACING, COLORS } from '../styles/theme';
import Header from '../components/common/Header';
import { useTasks } from '../context/TasksContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

const KYIV_TZ = 'Europe/Kiev';

function getLocalHoursMinutes() {
  const now = new Date();
  try {
    const fmt = new Intl.DateTimeFormat([], {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: KYIV_TZ,
    });
    const parts = fmt.formatToParts(now);
    const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
    const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
    return { hours: h, minutes: m };
  } catch {
    return { hours: now.getHours(), minutes: now.getMinutes() };
  }
}

function getLocalNow() {
  return new Date();
}
const PAGES = [[0, 1, 2], [3, 4, 5], [6]];
const DAY_NAMES = [
  'ПОНЕДІЛОК',
  'ВІВТОРОК',
  'СЕРЕДА',
  'ЧЕТВЕР',
  "П'ЯТНИЦЯ",
  'СУБОТА',
  'НЕДІЛЯ',
];
const MONTH_NAMES = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];
const MONTH_NAMES_SHORT = [
  'Січ',
  'Лют',
  'Бер',
  'Квіт',
  'Трав',
  'Черв',
  'Лип',
  'Серп',
  'Вер',
  'Жовт',
  'Лист',
  'Груд',
];
const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BRAND = '#452C16';
const TIME_GUTTER = 50;
const NAV_BTN_SIZE = 28;
const COL_GAP = 6;
const STRIP_WIDTH = 16;

const TASK_COLORS = [
  { bg: '#F0F5C8', border: '#C8D44A', text: '#3A4A00' },
  { bg: '#D4EAF7', border: '#6AAED6', text: '#1A3A5C' },
  { bg: '#F5D4D4', border: '#E07070', text: '#5C1A1A' },
  { bg: '#D4F0D4', border: '#70B870', text: '#1A4A1A' },
  { bg: '#F0D4F0', border: '#B870B8', text: '#4A1A4A' },
  { bg: '#FFE8C8', border: '#E8A850', text: '#5C3A00' },
];

const THEME_COLOR_MAP = {
  '#E8E0D5': { bg: '#F5F0EA', border: '#C8B89A', text: '#3A2A10' },
  '#FFE5B4': { bg: '#FFF3D4', border: '#E8A850', text: '#5C3A00' },
  '#E0D5FF': { bg: '#EDE8FF', border: '#9B85E8', text: '#2A1A5C' },
  '#FFB3BA': { bg: '#FFD4D8', border: '#E07070', text: '#5C1A1A' },
  '#BAFFC9': { bg: '#D4F0D4', border: '#70B870', text: '#1A4A1A' },
  '#BAE1FF': { bg: '#D4EAF7', border: '#6AAED6', text: '#1A3A5C' },
  '#FFFFBA': { bg: '#FFFFF0', border: '#C8D44A', text: '#3A4A00' },
  '#D4A5F5': { bg: '#EDD4FF', border: '#B870B8', text: '#4A1A4A' },
};

function getTaskColorScheme(task, fallbackIndex) {
  if (task.themeColor && THEME_COLOR_MAP[task.themeColor]) {
    return THEME_COLOR_MAP[task.themeColor];
  }
  return TASK_COLORS[fallbackIndex % TASK_COLORS.length];
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isSameWeek(mA, mB) {
  return mA.getTime() === mB.getTime();
}
function pad2(n) {
  return String(n).padStart(2, '0');
}
function formatDate(date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
}
function formatWeekRange(monday) {
  const sunday = addDays(monday, 6);
  const mM = MONTH_NAMES_SHORT[monday.getMonth()];
  const sM = MONTH_NAMES_SHORT[sunday.getMonth()];
  if (monday.getMonth() === sunday.getMonth())
    return `${mM} ${pad2(monday.getDate())}-${pad2(sunday.getDate())}`;
  return `${mM} ${pad2(monday.getDate())} - ${sM} ${pad2(sunday.getDate())}`;
}
function timeToMinutes(t) {
  if (!t || typeof t !== 'string' || !t.includes(':')) return null;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}
function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function getWeeksOfMonth(year, month) {
  const start = getMonday(new Date(year, month, 1));
  const weeks = [];
  let cur = new Date(start);
  while (true) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cur, i)));
    cur = addDays(cur, 7);
    if (cur.getMonth() !== month && weeks.length >= 4) break;
    if (weeks.length > 6) break;
  }
  return weeks;
}

// ─── Логіка перекриттів ───────────────────────────────────────────────────────
// Чи перекриваються два завдання в часі (строго, без дотику)
function overlapsInTime(a, b) {
  const startA = timeToMinutes(a.startTime) ?? 0;
  const endA = timeToMinutes(a.endTime) ?? 0;
  const startB = timeToMinutes(b.startTime) ?? 0;
  const endB = timeToMinutes(b.endTime) ?? 0;
  return startA < endB && endA > startB && endA !== startB && endB !== startA;
}

// Визначає для кожного завдання: БЛОК чи СМУЖКА.
// БЛОК — якщо не перекривається з жодним раніше визначеним БЛОКОМ.
// СМУЖКА — якщо перекривається хоча б з одним БЛОКОМ.
// БЛОК звужується якщо з ним перекриваються смужки.
function computeLayout(tasks) {
  if (tasks.length === 0) return [];

  const taskKey = t => t.id ?? t.title ?? JSON.stringify(t);

  const sorted = [...tasks].sort((a, b) => {
    const sA = timeToMinutes(a.startTime) ?? 0;
    const sB = timeToMinutes(b.startTime) ?? 0;
    if (sA !== sB) return sA - sB;
    const eA = timeToMinutes(a.endTime) ?? 0;
    const eB = timeToMinutes(b.endTime) ?? 0;
    return eB - eA;
  });

  const role = new Map();

  for (let i = 0; i < sorted.length; i++) {
    const ki = taskKey(sorted[i]);
    if (role.has(ki)) continue;
    let overlapsWithBlock = false;
    for (let j = 0; j < i; j++) {
      if (
        role.get(taskKey(sorted[j])) === 'block' &&
        overlapsInTime(sorted[i], sorted[j])
      ) {
        overlapsWithBlock = true;
        break;
      }
    }
    role.set(ki, overlapsWithBlock ? 'strip' : 'block');
  }

  // Всі смужки (для визначення чи треба звужувати блоки)
  const allStrips = sorted.filter(t => role.get(taskKey(t)) === 'strip');

  return sorted.map(task => {
    const k = taskKey(task);
    const isBlock = role.get(k) === 'block';
    if (isBlock) {
      // Блок звужується якщо БУДЬ-ЯКА смужка перекривається з ним в часі
      // (навіть якщо та смужка є дочірньою від іншого блоку)
      const overlappingStrips = allStrips.filter(
        o => taskKey(o) !== k && overlapsInTime(task, o),
      );
      return { task, isBlock: true, overlappingStrips };
    } else {
      const parentBlock = sorted.find(
        o =>
          taskKey(o) !== k &&
          role.get(taskKey(o)) === 'block' &&
          overlapsInTime(task, o),
      );
      return { task, isBlock: false, parentBlock, overlappingStrips: [] };
    }
  });
}

// ─── WeekPickerOverlay ────────────────────────────────────────────────────────

function WeekPickerOverlay({
  calYear,
  calMonth,
  setCalYear,
  setCalMonth,
  selectedWeekStart,
  onSelectWeek,
  onClose,
}) {
  const today = getLocalNow();
  const weeks = getWeeksOfMonth(calYear, calMonth);
  const DAY_ABBR = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  const [pendingWeek, setPendingWeek] = React.useState(
    getMonday(selectedWeekStart),
  );

  function prevMonth() {
    if (calMonth === 0) {
      setCalYear(y => y - 1);
      setCalMonth(11);
    } else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) {
      setCalYear(y => y + 1);
      setCalMonth(0);
    } else setCalMonth(m => m + 1);
  }

  function handleConfirm() {
    onSelectWeek(pendingWeek);
    onClose();
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[StyleSheet.absoluteFill, calStyles.blurFallback]}>
        <TouchableOpacity
          style={calStyles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity activeOpacity={1} style={calStyles.card}>
            <View style={calStyles.monthRow}>
              <TouchableOpacity
                onPress={prevMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image
                  source={require('../assets/icons/arrow.png')}
                  style={calStyles.monthArrow}
                />
              </TouchableOpacity>
              <Text style={calStyles.monthTitle}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity
                onPress={nextMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image
                  source={require('../assets/icons/arrow.png')}
                  style={[calStyles.monthArrow, calStyles.monthArrowFlipped]}
                />
              </TouchableOpacity>
            </View>

            <View style={calStyles.dayHeaderRow}>
              {DAY_ABBR.map(d => (
                <Text key={d} style={calStyles.dayAbbr}>
                  {d}
                </Text>
              ))}
            </View>

            {weeks.map((week, wi) => {
              const weekMonday = week[0];
              const isPending = isSameWeek(getMonday(weekMonday), pendingWeek);
              return (
                <TouchableOpacity
                  key={wi}
                  style={[
                    calStyles.weekRow,
                    isPending && calStyles.weekRowSelected,
                  ]}
                  onPress={() => setPendingWeek(getMonday(weekMonday))}
                  activeOpacity={0.75}
                >
                  {week.map((date, di) => (
                    <View key={di} style={calStyles.dayCell}>
                      <Text
                        style={[
                          calStyles.dayText,
                          date.getMonth() !== calMonth &&
                            calStyles.dayTextOtherMonth,
                          isSameDay(date, today) && calStyles.dayTextToday,
                          isPending && calStyles.dayTextSelected,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  ))}
                </TouchableOpacity>
              );
            })}

            <View style={calStyles.actionRow}>
              <TouchableOpacity style={calStyles.cancelBtn} onPress={onClose}>
                <Text style={calStyles.cancelBtnText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={calStyles.confirmBtn}
                onPress={handleConfirm}
              >
                <Text style={calStyles.confirmBtnText}>Вибрати</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── EventBlock ───────────────────────────────────────────────────────────────

function EventBlock({ task, colorScheme, rightInset = 2 }) {
  const startMin = timeToMinutes(task.startTime);
  const endMin = timeToMinutes(task.endTime);
  if (startMin === null || endMin === null || endMin <= startMin) return null;
  const top = (startMin / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);
  const isCompleted = task.status === 'completed';
  const hasNote = !!task.note && height > 52;

  return (
    <View
      style={[
        styles.eventBlock,
        isCompleted && styles.eventBlockCompleted,
        { top, height, backgroundColor: colorScheme.bg, right: rightInset },
      ]}
      pointerEvents="none"
    >
      <View
        style={[styles.eventStripe, { backgroundColor: colorScheme.border }]}
      />
      <View style={styles.eventContent}>
        <Text style={[styles.eventTime, { color: colorScheme.text }]}>
          {task.startTime}–{task.endTime}
        </Text>
        <Text
          style={[styles.eventTitle, { color: colorScheme.text }]}
          numberOfLines={hasNote ? 1 : height > 36 ? 3 : 1}
        >
          {isCompleted ? '✓ ' : ''}
          {task.title}
        </Text>
        {hasNote && (
          <Text
            style={[styles.eventNote, { color: colorScheme.text }]}
            numberOfLines={2}
          >
            {task.note}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── CompactStrip ─────────────────────────────────────────────────────────────

function CompactStrip({ task, colorScheme, onPress }) {
  const startMin = timeToMinutes(task.startTime);
  const endMin = timeToMinutes(task.endTime);
  if (startMin === null || endMin === null || endMin <= startMin) return null;
  const top = (startMin / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 14);

  return (
    <TouchableOpacity
      style={[
        styles.compactStrip,
        {
          top,
          height,
          backgroundColor: colorScheme.bg,
          borderLeftColor: colorScheme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    />
  );
}

// ─── GroupPopup ───────────────────────────────────────────────────────────────

function GroupPopup({ group, onClose }) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={popupStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={popupStyles.card}
          activeOpacity={1}
          onPress={() => {}}
        >
          <Text style={popupStyles.heading}>
            Завдань у цей час: {group.length}
          </Text>
          {group.map((task, i) => {
            const scheme = getTaskColorScheme(task, task.colorIndex ?? i);
            const isCompleted = task.status === 'completed';
            return (
              <View
                key={task.id ?? i}
                style={[popupStyles.row, { backgroundColor: scheme.bg }]}
              >
                <View
                  style={[
                    popupStyles.stripe,
                    { backgroundColor: scheme.border },
                  ]}
                />
                <View style={popupStyles.rowContent}>
                  <Text style={[popupStyles.rowTime, { color: scheme.text }]}>
                    {task.startTime}–{task.endTime}
                  </Text>
                  <Text
                    style={[popupStyles.rowTitle, { color: scheme.text }]}
                    numberOfLines={2}
                  >
                    {isCompleted ? '✓ ' : ''}
                    {task.title}
                  </Text>
                  {!!task.note && (
                    <Text
                      style={[popupStyles.rowNote, { color: scheme.text }]}
                      numberOfLines={2}
                    >
                      {task.note}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={popupStyles.closeBtn} onPress={onClose}>
            <Text style={popupStyles.closeBtnText}>Закрити</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── OverlapCount ─────────────────────────────────────────────────────────────

function OverlapCount({ count, anchorTask, onPress }) {
  const startMin = timeToMinutes(anchorTask.startTime);
  const endMin = timeToMinutes(anchorTask.endTime);
  if (startMin === null || endMin === null) return null;
  const blockBottom = (endMin / 60) * HOUR_HEIGHT;
  const top = blockBottom - 22 - 4;

  return (
    <TouchableOpacity
      style={[styles.overlapCount, { top }]}
      onPress={onPress}
      activeOpacity={0.75}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text style={styles.overlapCountText}>+{count}</Text>
    </TouchableOpacity>
  );
}

// ─── DayEventsLayer ───────────────────────────────────────────────────────────

function DayEventsLayer({ date, tasks, onGroupPress }) {
  const dateKey = toDateKey(date);
  const dayTasks = tasks.filter(t => {
    if (t.type && t.type !== 'task') return false;
    if (!t.startTime || !t.endTime || !t.date) return false;
    const tKey =
      typeof t.date === 'string' && t.date.includes('-')
        ? t.date
        : toDateKey(t.date);
    return tKey === dateKey;
  });

  if (dayTasks.length === 0) return null;

  const taskKey = t => t.id ?? t.title ?? JSON.stringify(t);
  const layout = computeLayout(dayTasks);

  return (
    <>
      {layout.map(({ task, isBlock, overlappingStrips, parentBlock }, gi) => {
        const colorScheme = getTaskColorScheme(task, task.colorIndex ?? gi);

        if (isBlock) {
          const hasStrips = overlappingStrips.length > 0;
          // Якщо є смужки що перекриваються — звужуємо блок щоб смужки були видні
          const rightInset = hasStrips ? STRIP_WIDTH + 3 : 2;
          const popupGroup = hasStrips ? [task, ...overlappingStrips] : null;

          return (
            <React.Fragment key={taskKey(task)}>
              <EventBlock
                task={task}
                colorScheme={colorScheme}
                rightInset={rightInset}
              />
              {hasStrips && (
                <OverlapCount
                  count={overlappingStrips.length}
                  anchorTask={task}
                  onPress={() => onGroupPress(popupGroup)}
                />
              )}
            </React.Fragment>
          );
        }

        // Смужка — натискання відкриває popup з батьківським блоком
        const popupGroup = parentBlock ? [parentBlock, task] : [task];
        return (
          <CompactStrip
            key={taskKey(task)}
            task={task}
            colorScheme={colorScheme}
            onPress={() => onGroupPress(popupGroup)}
          />
        );
      })}
    </>
  );
}

// ─── WeekScheduleScreen ───────────────────────────────────────────────────────

const _initMonday = getMonday(getLocalNow());
const _initDayIdx =
  getLocalNow().getDay() === 0 ? 6 : getLocalNow().getDay() - 1;
const _initialPageIndex = Math.max(
  0,
  PAGES.findIndex(p => p.includes(_initDayIdx)),
);

export default function WeekScheduleScreen() {
  const todayMonday = _initMonday;
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const { tasks } = useTasks();
  const [weekStart, setWeekStart] = useState(todayMonday);
  const [pageIndex, setPageIndex] = useState(_initialPageIndex);
  const [gridWidth, setGridWidth] = useState(0);
  const [colsLayout, setColsLayout] = useState({ x: TIME_GUTTER, width: 0 });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [calYear, setCalYear] = useState(todayMonday.getFullYear());
  const [calMonth, setCalMonth] = useState(todayMonday.getMonth());
  const [overlapGroup, setOverlapGroup] = useState(null);
  const [calendarMenuVisible, setCalendarMenuVisible] = useState(false);
  const [highlightedDayIdx, setHighlightedDayIdx] = useState(null);
  const [localTime, setLocalTime] = useState(getLocalHoursMinutes());
  const highlightAnimRef = useRef(new Animated.Value(0));
  useEffect(() => {
    const timer = setInterval(
      () => setLocalTime(getLocalHoursMinutes()),
      60_000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isFocused) {
      const now = getLocalNow();
      const monday = getMonday(now);
      const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const pg = Math.max(
        0,
        PAGES.findIndex(p => p.includes(dayIdx)),
      );
      setWeekStart(monday);
      setPageIndex(pg);
      pageIndexRef.current = pg;
    }
  }, [isFocused]);

  const today = getLocalNow();
  const isCurrentWeek = isSameWeek(weekStart, getMonday(today));
  const todayDayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const nowTop =
    ((localTime.hours * 60 + localTime.minutes) / 60) * HOUR_HEIGHT;

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const pageIndexRef = useRef(pageIndex);
  pageIndexRef.current = pageIndex;
  const labelAnim = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);
  const swipeToRef = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dy) < 40,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) swipeToRef.current(1);
        else if (g.dx > 50) swipeToRef.current(-1);
      },
    }),
  ).current;

  useEffect(() => {
    const { hours, minutes } = getLocalHoursMinutes();
    const offset = ((hours * 60 + minutes) / 60) * HOUR_HEIGHT - 80;
    setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          y: Math.max(0, offset),
          animated: false,
        }),
      100,
    );
  }, []);

  function fadeTransition(callback) {
    fadeAnim.stopAnimation(() => {
      fadeAnim.setValue(1);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        callback();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    });
  }

  function animateLabel(direction, callback) {
    const outX = direction > 0 ? -30 : direction < 0 ? 30 : 0;
    Animated.parallel([
      Animated.timing(labelAnim, {
        toValue: outX,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(labelOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      labelAnim.setValue(-outX);
      Animated.parallel([
        Animated.timing(labelAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  function swipeTo(direction) {
    const cur = pageIndexRef.current;
    const next = cur + direction;

    if (next < 0) {
      fadeTransition(() => {
        setWeekStart(w => addDays(w, -7));
        setPageIndex(2);
        pageIndexRef.current = 2;
      });
      return;
    }
    if (next > 2) {
      fadeTransition(() => {
        setWeekStart(w => addDays(w, 7));
        setPageIndex(0);
        pageIndexRef.current = 0;
      });
      return;
    }
    fadeTransition(() => {
      setPageIndex(next);
      pageIndexRef.current = next;
    });
  }
  swipeToRef.current = swipeTo;

  function highlightDay(dayIdx) {
    const anim = highlightAnimRef.current;
    setHighlightedDayIdx(dayIdx);
    anim.setValue(1);
    Animated.sequence([
      Animated.delay(2500),
      Animated.timing(anim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start(() => setHighlightedDayIdx(null));
  }

  function goToPrevWeek() {
    animateLabel(-1, () => {
      fadeTransition(() => {
        setWeekStart(w => addDays(w, -7));
        setPageIndex(0);
      });
    });
  }
  function goToNextWeek() {
    animateLabel(1, () => {
      fadeTransition(() => {
        setWeekStart(w => addDays(w, 7));
        setPageIndex(0);
      });
    });
  }
  function goToToday() {
    const idx = today.getDay() === 0 ? 6 : today.getDay() - 1;
    animateLabel(0, () => {
      fadeTransition(() => {
        setWeekStart(getMonday(today));
        setPageIndex(PAGES.findIndex(p => p.includes(idx)) ?? 0);
      });
    });
  }
  function openPicker() {
    setCalYear(weekStart.getFullYear());
    setCalMonth(weekStart.getMonth());
    setPickerVisible(true);
  }
  function handlePickerSelect(monday) {
    animateLabel(0, () => {
      fadeTransition(() => {
        setWeekStart(getMonday(monday));
        setPageIndex(0);
      });
    });
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const currentPageDayIndices = PAGES[pageIndex];
  const showNowLine =
    isCurrentWeek && currentPageDayIndices.includes(todayDayIdx);
  const isLastPage = pageIndex === 2;
  const nextWeekMonday = addDays(weekStart, 7);
  const nextWeekPeekDays = [
    addDays(nextWeekMonday, 0),
    addDays(nextWeekMonday, 1),
  ];
  const todayLabel = `${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;
  const dayColumnCount = currentPageDayIndices.length;
  const colsWidth = colsLayout.width > 0 ? colsLayout.width : gridWidth;
  const perDayWidth =
    colsWidth > 0
      ? (colsWidth - (dayColumnCount - 1) * COL_GAP) / dayColumnCount
      : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header onCalendarPress={() => setCalendarMenuVisible(true)} />
      <View style={styles.whiteBlock}>
        {/* Top row */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={goToToday} activeOpacity={0.7}>
            <Text style={styles.todayLabel}>{todayLabel}</Text>
          </TouchableOpacity>
          <View style={styles.weekNavPill}>
            <TouchableOpacity
              style={styles.pillArrowBtn}
              onPress={goToPrevWeek}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 2 }}
            >
              <Image
                source={require('../assets/icons/arrow.png')}
                style={styles.pillArrowIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pillLabelWrap}
              onPress={openPicker}
              activeOpacity={0.7}
            >
              <Animated.Text
                numberOfLines={1}
                style={[
                  styles.weekRangeText,
                  {
                    transform: [{ translateX: labelAnim }],
                    opacity: labelOpacity,
                  },
                ]}
              >
                {formatWeekRange(weekStart)}
              </Animated.Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pillArrowBtn}
              onPress={goToNextWeek}
              hitSlop={{ top: 10, bottom: 10, left: 2, right: 6 }}
            >
              <Image
                source={require('../assets/icons/arrow.png')}
                style={[styles.pillArrowIcon, styles.pillArrowIconFlipped]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Day header row */}
        <View style={styles.daysHeaderRow}>
          <View style={styles.timeGutterHeader}>
            <TouchableOpacity
              style={styles.dayNavBtn}
              onPress={() => swipeToRef.current(-1)}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Image
                source={require('../assets/icons/arrow.png')}
                style={styles.dayNavIcon}
              />
            </TouchableOpacity>
          </View>
          <Animated.View
            style={[styles.dayColsWrap, { opacity: fadeAnim }]}
            onLayout={e => {
              const { x, width } = e.nativeEvent.layout;
              setColsLayout({ x, width });
            }}
          >
            {currentPageDayIndices.map(dayIdx => {
              const date = weekDays[dayIdx];
              const isToday = isCurrentWeek && isSameDay(date, today);
              const isHighlighted = highlightedDayIdx === dayIdx;
              return (
                <TouchableOpacity
                  key={dayIdx}
                  activeOpacity={0.85}
                  onPress={() => highlightDay(dayIdx)}
                  style={[
                    styles.dayHeaderCol,
                    isToday && styles.dayHeaderColActive,
                    isHighlighted && styles.dayHeaderColHighlighted,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayName,
                      isHighlighted && styles.dayNameHighlighted,
                    ]}
                  >
                    {DAY_NAMES[dayIdx]}
                  </Text>
                  <Text
                    style={[
                      styles.dayNum,
                      isHighlighted && styles.dayNumHighlighted,
                    ]}
                  >
                    {formatDate(date)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {isLastPage &&
              nextWeekPeekDays.map((date, i) => (
                <TouchableOpacity
                  key={`peek-${i}`}
                  style={[styles.dayHeaderCol, styles.dayHeaderColPeek]}
                  onPress={() => {
                    setWeekStart(nextWeekMonday);
                    setPageIndex(0);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dayName}>{DAY_NAMES[i]}</Text>
                  <Text style={styles.dayNum}>{formatDate(date)}</Text>
                </TouchableOpacity>
              ))}
          </Animated.View>
          <TouchableOpacity
            style={styles.dayNavBtn}
            onPress={() => swipeToRef.current(1)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Image
              source={require('../assets/icons/arrow.png')}
              style={[styles.dayNavIcon, styles.dayNavIconFlipped]}
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable time grid */}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridArea} {...panResponder.panHandlers}>
            {HOURS.map(hour => (
              <View
                key={hour}
                style={[styles.hourRow, { top: hour * HOUR_HEIGHT }]}
              >
                <View style={styles.timeGutter}>
                  <Text style={styles.hourText}>{pad2(hour)}:00</Text>
                </View>
                <View style={styles.hourTickWrap}>
                  <View style={styles.hourTickLine} />
                </View>
              </View>
            ))}
            {showNowLine && (
              <View
                style={[styles.nowRow, { top: nowTop }]}
                pointerEvents="none"
              >
                <View style={styles.nowLabelBox}>
                  <Text style={styles.nowLabelText}>
                    {pad2(localTime.hours)}:{pad2(localTime.minutes)}
                  </Text>
                </View>
                <View style={styles.nowDashedWrap}>
                  {Array.from({ length: 40 }).map((_, i) => (
                    <View key={i} style={styles.nowDash} />
                  ))}
                </View>
              </View>
            )}
            <Animated.View
              style={[
                styles.eventsLayer,
                { left: colsLayout.x, opacity: fadeAnim },
              ]}
              onLayout={e => setGridWidth(e.nativeEvent.layout.width)}
            >
              {perDayWidth > 0 &&
                currentPageDayIndices.map((dayIdx, colPos) => (
                  <View
                    key={dayIdx}
                    style={[
                      styles.dayEventsColumn,
                      {
                        left: colPos * (perDayWidth + COL_GAP),
                        width: perDayWidth,
                      },
                    ]}
                  >
                    <DayEventsLayer
                      date={weekDays[dayIdx]}
                      tasks={tasks}
                      onGroupPress={setOverlapGroup}
                    />
                    {highlightedDayIdx === dayIdx && (
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.dayColumnHighlight,
                          { opacity: highlightAnimRef.current },
                        ]}
                      />
                    )}
                  </View>
                ))}
            </Animated.View>
          </View>
        </ScrollView>
      </View>

      {pickerVisible && (
        <WeekPickerOverlay
          calYear={calYear}
          calMonth={calMonth}
          setCalYear={setCalYear}
          setCalMonth={setCalMonth}
          selectedWeekStart={weekStart}
          onSelectWeek={handlePickerSelect}
          onClose={() => setPickerVisible(false)}
        />
      )}

      {overlapGroup !== null && (
        <GroupPopup
          group={overlapGroup}
          onClose={() => setOverlapGroup(null)}
        />
      )}

      <Modal
        visible={calendarMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarMenuVisible(false)}
      >
        <TouchableOpacity
          style={calMenuStyles.backdrop}
          activeOpacity={1}
          onPress={() => setCalendarMenuVisible(false)}
        >
          <View style={calMenuStyles.card}>
            <TouchableOpacity
              style={calMenuStyles.item}
              onPress={() => {
                setCalendarMenuVisible(false);
                navigation.navigate('Home');
              }}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/icons/Vector1.png')}
                style={calMenuStyles.icon}
                resizeMode="contain"
              />
              <Text style={calMenuStyles.text}>День</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[calMenuStyles.item, calMenuStyles.itemActive]}
              activeOpacity={0.8}
              onPress={() => setCalendarMenuVisible(false)}
            >
              <Image
                source={require('../assets/icons/Vector32.png')}
                style={[calMenuStyles.icon, calMenuStyles.iconActive]}
                resizeMode="contain"
              />
              <Text style={[calMenuStyles.text, calMenuStyles.textActive]}>
                Тиждень
              </Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  whiteBlock: {
    flex: 1,
    marginTop: SPACING.sm,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginBottom: -150,
    paddingBottom: 150,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  todayLabel: {
    fontFamily: FONTS.semiBold ?? FONTS.medium,
    fontSize: 14,
    color: '#282828',
  },
  weekNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B5B5B5',
    borderRadius: 24,
    paddingVertical: 7,
  },
  pillArrowBtn: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillArrowIcon: { width: 16, height: 16, tintColor: '#666460' },
  pillArrowIconFlipped: { transform: [{ rotate: '180deg' }] },
  pillLabelWrap: { alignItems: 'center', paddingHorizontal: 4 },
  weekRangeText: {
    fontFamily: FONTS.regular ?? FONTS.medium,
    fontSize: 12,
    color: '#666460',
    textAlign: 'center',
    flexShrink: 0,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  timeGutterHeader: {
    width: TIME_GUTTER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dayColsWrap: { flex: 1, flexDirection: 'row', gap: 6 },
  dayNavBtn: {
    width: NAV_BTN_SIZE,
    height: NAV_BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(69,44,22,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(69,44,22,0.40)',
  },
  dayHeaderColActive: { backgroundColor: 'rgba(69,44,22,0.20)' },
  dayHeaderColPeek: { opacity: 0.4 },
  dayName: {
    fontFamily: FONTS.light ?? FONTS.medium,
    fontSize: 10,
    color: '#282828',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  dayNum: {
    fontFamily: FONTS.regular ?? FONTS.medium,
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
  },
  scrollArea: { flex: 1 },
  gridArea: {
    position: 'relative',
    height: 24 * HOUR_HEIGHT + 16,
    marginTop: 8,
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeGutter: { width: TIME_GUTTER, alignItems: 'flex-end', paddingRight: 8 },
  hourText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#898989',
    lineHeight: 16,
    transform: [{ translateY: -8 }],
  },
  hourTickWrap: { position: 'absolute', left: TIME_GUTTER / 2 - 0.5, top: 10 },
  hourTickLine: {
    width: 1,
    height: HOUR_HEIGHT - 18,
    backgroundColor: '#898989',
    opacity: 0.4,
  },
  nowRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
    paddingRight: 16,
    transform: [{ translateY: -10 }],
  },
  nowLabelBox: {
    width: TIME_GUTTER,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowLabelText: { fontFamily: FONTS.medium, fontSize: 11, color: '#fff' },
  nowDashedWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
    overflow: 'hidden',
    gap: 4,
  },
  nowDash: { width: 6, height: 1.5, backgroundColor: 'rgba(69,44,22,0.70)' },
  eventsLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 24 * HOUR_HEIGHT + 16,
  },
  dayEventsColumn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'visible',
  },

  // ─── Event block ─────────────────────────────────────────────────────────
  eventBlock: {
    position: 'absolute',
    left: 0,
    right: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  eventStripe: {
    width: 4,
    borderRadius: 8,
    marginVertical: 7,
    marginLeft: 6,
    flexShrink: 0,
  },
  eventContent: { flex: 1, paddingHorizontal: 6, paddingVertical: 4 },
  eventBlockCompleted: { opacity: 0.55 },
  eventTitle: { fontFamily: FONTS.medium, fontSize: 11, lineHeight: 14 },
  eventTime: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 13,
    opacity: 0.75,
  },
  eventNote: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 2,
    opacity: 0.6,
  },

  // ─── Compact strip ──────────────────────────────────────────────────────
  compactStrip: {
    position: 'absolute',
    right: 0,
    width: STRIP_WIDTH,
    borderRadius: 5,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },

  // ─── Overlap count badge ──────────────────────────────────────────────────
  overlapCount: {
    position: 'absolute',
    right: STRIP_WIDTH + 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  overlapCountText: {
    fontFamily: FONTS.medium,
    fontSize: 9,
    color: '#fff',
    lineHeight: 11,
  },

  dayNavIcon: { width: 16, height: 16, tintColor: '#666460' },
  dayNavIconFlipped: { transform: [{ rotate: '180deg' }] },

  dayHeaderColHighlighted: {
    backgroundColor: 'rgba(69,44,22,0.28)',
    borderColor: BRAND,
  },
  dayNameHighlighted: { color: BRAND },
  dayNumHighlighted: { color: BRAND, fontFamily: FONTS.medium },
  dayColumnHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(69,44,22,0.07)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(69,44,22,0.25)',
  },
});

const calStyles = StyleSheet.create({
  blurFallback: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    width: SCREEN_WIDTH - 48,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthArrow: { width: 18, height: 18, tintColor: BRAND },
  monthArrowFlipped: { transform: [{ rotate: '180deg' }] },
  monthTitle: { fontFamily: FONTS.medium, fontSize: 16, color: '#282828' },
  dayHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  dayAbbr: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#898989',
  },
  weekRow: {
    flexDirection: 'row',
    borderRadius: 10,
    marginVertical: 2,
    paddingVertical: 6,
    position: 'relative',
  },
  weekRowSelected: { backgroundColor: 'rgba(69,44,22,0.12)' },
  dayCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: FONTS.regular, fontSize: 14, color: '#282828' },
  dayTextOtherMonth: { color: '#C0B8B0' },
  dayTextToday: { color: BRAND, fontFamily: FONTS.medium },
  dayTextSelected: { color: BRAND, fontFamily: FONTS.medium },
  currentWeekDot: {
    position: 'absolute',
    right: 6,
    top: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND,
    marginTop: -3,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(69,44,22,0.08)',
    alignItems: 'center',
  },
  cancelBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: '#666460' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: BRAND,
    alignItems: 'center',
  },
  confirmBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: '#fff' },
});

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    width: '100%',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  heading: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: '#282828',
    marginBottom: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'stretch',
    minHeight: 52,
  },
  stripe: {
    width: 4,
    borderRadius: 8,
    marginVertical: 8,
    marginLeft: 8,
    flexShrink: 0,
  },
  rowContent: { flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
  rowTime: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    opacity: 0.75,
    lineHeight: 14,
  },
  rowTitle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    lineHeight: 17,
    marginTop: 2,
  },
  rowNote: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 3,
    opacity: 0.6,
  },
  closeBtn: {
    marginTop: 6,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(69,44,22,0.08)',
  },
  closeBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: BRAND },
});

const calMenuStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  card: {
    position: 'absolute',
    top: 72,
    right: 16,
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  itemActive: {
    backgroundColor: 'rgba(69, 44, 22, 0.20)',
    borderRadius: 5,
  },
  icon: {
    width: 19,
    height: 19,
    tintColor: '#000000',
  },
  iconActive: {
    tintColor: '#452C16',
  },
  text: {
    fontSize: 14,
    fontFamily: FONTS.regular ?? FONTS.medium,
    color: '#282828',
    marginLeft: 10,
  },
  textActive: {
    color: '#452C16',
  },
});

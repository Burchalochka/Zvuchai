import React, { useState, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS, SPACING, FONTS, RADIUS } from '../../styles/theme';
import WheelPicker from './WheelPicker';
import { useLanguage } from '../../context/LanguageContext';
import { useSelectedDate } from '../../context/SelectedDateContext';
import { getTranslation } from '../../utils/translations';
import {
  getKyivYMD,
  getKyivWeekdayMon0,
  daysInMonthCivil,
  dateFromKyivYMD,
  ymdToDateKey,
  isSameKyivCalendarDay,
  toLocalDateKey,
  kyivMonthGridRowCount,
} from '../../utils/calendarDay';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const MONTH_SWIPE_HEADER_H = 36;
const MONTH_SWIPE_ROW_H = 56;

function monthGridViewportHeight(anchorDate) {
  const rows = kyivMonthGridRowCount(anchorDate);
  return MONTH_SWIPE_HEADER_H + rows * MONTH_SWIPE_ROW_H;
}

function addCalendarDays(date, deltaDays) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + deltaDays);
  return d;
}

function addCalendarMonths(date, deltaMonths) {
  const raw = date instanceof Date ? date : new Date(date);
  const k = getKyivYMD(raw);
  if (!k) {
    const t = new Date(raw);
    t.setMonth(t.getMonth() + deltaMonths);
    return t;
  }
  let { year, month, day } = k;
  const m0 = month - 1 + deltaMonths;
  const y = year + Math.floor(m0 / 12);
  const m = ((m0 % 12) + 12) % 12 + 1;
  const dim = daysInMonthCivil(y, m);
  return new Date(y, m - 1, Math.min(day, dim));
}

function getWeekForDate(anchorDate) {
  const raw = anchorDate instanceof Date ? anchorDate : new Date(anchorDate);
  const k = getKyivYMD(raw);
  if (!k) {
    const current = new Date(raw);
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(current);
    weekStart.setDate(current.getDate() + diff);
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      week.push(day);
    }
    return week;
  }
  const wd = getKyivWeekdayMon0(k.year, k.month, k.day);
  const start = new Date(k.year, k.month - 1, k.day);
  start.setDate(start.getDate() - wd);
  const week = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    week.push(day);
  }
  return week;
}

const Calendar = ({ taskCountsByDate = {}, viewMode, onViewModeChange }) => {
  const { language } = useLanguage();
  const { selectedDate: currentDate, setSelectedDate: setCurrentDate, todayCalendar } = useSelectedDate();

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerDraft, setPickerDraft] = useState({ m0: 0, yIdx: 50 });
  const [weekStripWidth, setWeekStripWidth] = useState(0);
  const [monthPagerWidth, setMonthPagerWidth] = useState(0);
  const [monthGridMeasuredHeight, setMonthGridMeasuredHeight] = useState(null);
  const weekSwipeRef = useRef(null);
  const monthSwipeRef = useRef(null);
  const ignoreWeekSwipeMomentumRef = useRef(false);
  const ignoreMonthSwipeMomentumRef = useRef(false);
  const lastWeekPagerCommitAtRef = useRef(0);
  const lastMonthPagerCommitAtRef = useRef(0);
  const lastStripModeToggleAtRef = useRef(0);

  const effectiveMode = viewMode === 'month' || viewMode === 'week' ? viewMode : 'week';

  const onViewModeChangeRef = useRef(onViewModeChange);
  useLayoutEffect(() => {
    onViewModeChangeRef.current = onViewModeChange;
  }, [onViewModeChange]);

  useLayoutEffect(() => {
    if (viewMode === 'year') {
      onViewModeChangeRef.current?.('month');
    }
  }, [viewMode]);

  const setStripMode = useCallback((nextMode) => {
    const now = Date.now();
    if (now - lastStripModeToggleAtRef.current < 450) return;
    lastStripModeToggleAtRef.current = now;
    if (nextMode !== 'week' && nextMode !== 'month') return;
    onViewModeChangeRef.current?.(nextMode);
  }, []);

  const effectiveModeRef = useRef(effectiveMode);
  effectiveModeRef.current = effectiveMode;

  const expandStrip = useCallback(() => {
    if (effectiveModeRef.current === 'week') setStripMode('month');
  }, [setStripMode]);

  const collapseStrip = useCallback(() => {
    if (effectiveModeRef.current === 'month') setStripMode('week');
  }, [setStripMode]);

  const verticalCalendarSwipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-22, 22])
        .failOffsetX([-72, 72])
        .onEnd((e) => {
          'worklet';
          const ty = e.translationY;
          const vy = e.velocityY ?? 0;
          const expand = ty > 36 || vy > 320;
          const collapse = ty < -36 || vy < -320;
          if (expand && !collapse) {
            runOnJS(expandStrip)();
          } else if (collapse && !expand) {
            runOnJS(collapseStrip)();
          }
        }),
    [expandStrip, collapseStrip],
  );

  useLayoutEffect(() => {
    if (effectiveMode !== 'month') {
      setMonthPagerWidth(0);
      setMonthGridMeasuredHeight(null);
    }
  }, [effectiveMode]);

  const MONTHS = [
    getTranslation('monthJanuary', language),
    getTranslation('monthFebruary', language),
    getTranslation('monthMarch', language),
    getTranslation('monthApril', language),
    getTranslation('monthMay', language),
    getTranslation('monthJune', language),
    getTranslation('monthJuly', language),
    getTranslation('monthAugust', language),
    getTranslation('monthSeptember', language),
    getTranslation('monthOctober', language),
    getTranslation('monthNovember', language),
    getTranslation('monthDecember', language),
  ];
  
  const DAYS = [
    getTranslation('dayMonday', language),
    getTranslation('dayTuesday', language),
    getTranslation('dayWednesday', language),
    getTranslation('dayThursday', language),
    getTranslation('dayFriday', language),
    getTranslation('daySaturday', language),
    getTranslation('daySunday', language),
  ];

  const getCurrentWeek = () => getWeekForDate(currentDate);

  useLayoutEffect(() => {
    if (effectiveMode !== 'week') return;
    if (weekStripWidth <= 0) return;
    ignoreWeekSwipeMomentumRef.current = true;
    weekSwipeRef.current?.scrollTo({ x: weekStripWidth, animated: false });
    const t = setTimeout(() => {
      ignoreWeekSwipeMomentumRef.current = false;
    }, 80);
    return () => clearTimeout(t);
  }, [effectiveMode, currentDate, weekStripWidth]);

  useLayoutEffect(() => {
    if (effectiveMode !== 'month') return;
    if (monthPagerWidth <= 0) return;
    ignoreMonthSwipeMomentumRef.current = true;
    monthSwipeRef.current?.scrollTo({ x: monthPagerWidth, animated: false });
    const t = setTimeout(() => {
      ignoreMonthSwipeMomentumRef.current = false;
    }, 80);
    return () => clearTimeout(t);
  }, [effectiveMode, currentDate, monthPagerWidth]);

  const getMonthDaysFor = (anyDateInMonth) => {
    const raw = anyDateInMonth instanceof Date ? anyDateInMonth : new Date(anyDateInMonth);
    const anchor = getKyivYMD(raw);
    const year = anchor?.year ?? raw.getFullYear();
    const month = anchor?.month ?? raw.getMonth() + 1;

    const dim = daysInMonthCivil(year, month);
    const startDay = getKyivWeekdayMon0(year, month, 1);

    const prevY = month === 1 ? year - 1 : year;
    const prevM = month === 1 ? 12 : month - 1;
    const prevMonthDayCount = daysInMonthCivil(prevY, prevM);

    const days = [];

    for (let i = startDay - 1; i >= 0; i--) {
      const dNum = prevMonthDayCount - i;
      days.push({
        date: dNum,
        isCurrentMonth: false,
        fullDate: new Date(prevY, prevM - 1, dNum),
        dateKey: ymdToDateKey(prevY, prevM, dNum),
        isPlaceholder: false,
      });
    }

    for (let i = 1; i <= dim; i += 1) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month - 1, i),
        dateKey: ymdToDateKey(year, month, i),
        isPlaceholder: false,
      });
    }

    const remainder = days.length % 7;
    if (remainder !== 0) {
      const toAdd = 7 - remainder;
      for (let i = 0; i < toAdd; i += 1) {
        days.push({
          date: null,
          isCurrentMonth: false,
          fullDate: null,
          dateKey: null,
          isPlaceholder: true,
        });
      }
    }

    return days;
  };

  const isSelectedDate = (date) => isSameKyivCalendarDay(date, currentDate);

  const getMonthYearText = () => {
    const k = getKyivYMD(currentDate);
    const monthIndex = (k?.month ?? currentDate.getMonth() + 1) - 1;
    const year = k?.year ?? currentDate.getFullYear();
    return `${MONTHS[monthIndex]} ${year}`;
  };

  const pickerYearValues = useMemo(() => {
    const t = todayCalendar instanceof Date ? todayCalendar : new Date();
    const cy = t.getFullYear();
    return Array.from({ length: 101 }, (_, idx) => cy - 50 + idx);
  }, [todayCalendar]);

  const openMonthPicker = useCallback(() => {
    const k = getKyivYMD(currentDate);
    const m0 = Math.max(0, Math.min(11, (k?.month ?? currentDate.getMonth() + 1) - 1));
    const yi = pickerYearValues.findIndex((y) => y === (k?.year ?? currentDate.getFullYear()));
    setPickerDraft({
      m0,
      yIdx: yi >= 0 ? yi : Math.min(pickerYearValues.length - 1, 50),
    });
    setShowMonthPicker(true);
  }, [currentDate, pickerYearValues]);

  const pickerDraftRef = useRef(pickerDraft);
  pickerDraftRef.current = pickerDraft;

  const closeMonthPicker = useCallback(() => {
    const { m0, yIdx } = pickerDraftRef.current;
    const y = pickerYearValues[yIdx];
    if (Number.isFinite(y) && yIdx >= 0 && yIdx < pickerYearValues.length) {
      setCurrentDate((prev) => {
        const k = getKyivYMD(prev);
        const anchorDay = k?.day ?? prev.getDate();
        const dim = daysInMonthCivil(y, m0 + 1);
        const day = Math.min(Math.max(1, anchorDay), dim);
        return dateFromKyivYMD(y, m0 + 1, day);
      });
    }
    setShowMonthPicker(false);
  }, [pickerYearValues, setCurrentDate]);

  const renderDayDots = (dateKey) => {
    if (!dateKey) return null;
    const count = taskCountsByDate[dateKey] || 0;
    if (!count) return null;
    const dots = Math.min(count, 3);
    const dotArray = Array.from({ length: dots });
    return (
      <View style={styles.dotsContainer}>
        {dotArray.map((_, idx) => (
          <View key={idx} style={styles.dot} />
        ))}
      </View>
    );
  };

  const handleWeekSwipeEnd = (event) => {
    if (ignoreWeekSwipeMomentumRef.current) return;
    if (weekStripWidth <= 0) return;
    const x = event.nativeEvent.contentOffset.x;
    const w = weekStripWidth;
    const page = Math.min(2, Math.max(0, Math.round(x / w)));
    if (page === 1) return;

    const now = Date.now();
    if (now - lastWeekPagerCommitAtRef.current < 320) return;
    lastWeekPagerCommitAtRef.current = now;

    if (page === 0) {
      setCurrentDate(addCalendarDays(currentDate, -7));
    } else if (page === 2) {
      setCurrentDate(addCalendarDays(currentDate, 7));
    }
  };

  const handleMonthSwipeEnd = (event) => {
    if (ignoreMonthSwipeMomentumRef.current) return;
    if (monthPagerWidth <= 0) return;
    const x = event.nativeEvent.contentOffset.x;
    const w = monthPagerWidth;
    const page = Math.min(2, Math.max(0, Math.round(x / w)));
    if (page === 1) return;

    const now = Date.now();
    if (now - lastMonthPagerCommitAtRef.current < 320) return;
    lastMonthPagerCommitAtRef.current = now;

    if (page === 0) {
      setCurrentDate(addCalendarMonths(currentDate, -1));
    } else if (page === 2) {
      setCurrentDate(addCalendarMonths(currentDate, 1));
    }
  };

  const renderWeekPage = (week, pageKey) => (
    <View
      key={pageKey}
      style={[
        styles.weekPage,
        weekStripWidth > 0 ? { width: weekStripWidth } : styles.weekPageMeasure,
      ]}
    >
      <View style={styles.weekContainer}>
        <View style={styles.weekDaysRow}>
          {DAYS.map((day, index) => (
            <Text key={index} style={styles.weekDayLabel}>
              {(day || '').slice(0, 2).toUpperCase()}
            </Text>
          ))}
        </View>
        <View style={styles.weekDatesRow}>
          {week.map((dateObj, index) => {
            const dayNum = dateObj.getDate();
            const isSelected = isSelectedDate(dateObj);
            return (
              <TouchableOpacity
                key={`${pageKey}-${index}`}
                style={styles.weekDateItem}
                onPress={() => {
                  setCurrentDate(dateObj);
                }}
              >
                <View style={[styles.weekNumberWrapper, isSelected && styles.selectedWeekItem]}>
                  <Text style={[styles.weekDateText, isSelected && styles.selectedText]}>
                    {dayNum}
                  </Text>
                </View>
                {renderDayDots(toLocalDateKey(dateObj))}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderWeekView = () => {
    const onStripLayout = (e) => {
      const w = Math.floor(e.nativeEvent.layout.width);
      if (w > 0 && w !== weekStripWidth) setWeekStripWidth(w);
    };

    if (weekStripWidth <= 0) {
      return (
        <View style={styles.weekSwipeFrame} onLayout={onStripLayout}>
          {renderWeekPage(getCurrentWeek(), 'measure')}
        </View>
      );
    }

    const prevWeek = getWeekForDate(addCalendarDays(currentDate, -7));
    const currWeek = getWeekForDate(currentDate);
    const nextWeek = getWeekForDate(addCalendarDays(currentDate, 7));

    return (
      <View style={styles.weekSwipeFrame} onLayout={onStripLayout}>
        <ScrollView
          ref={weekSwipeRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          onMomentumScrollEnd={handleWeekSwipeEnd}
          contentContainerStyle={styles.weekSwipeContent}
        >
          {renderWeekPage(prevWeek, 'prev')}
          {renderWeekPage(currWeek, 'curr')}
          {renderWeekPage(nextWeek, 'next')}
        </ScrollView>
      </View>
    );
  };

  const renderMonthPage = (anchorDate, pageKey) => {
    const days = getMonthDaysFor(anchorDate);
    return (
      <View
        key={pageKey}
        style={[
          styles.monthPage,
          monthPagerWidth > 0 ? { width: monthPagerWidth } : styles.monthPageMeasure,
        ]}
      >
        <View
          style={styles.monthContainer}
          onLayout={
            pageKey === 'measure' || pageKey === 'curr'
              ? (e) => {
                  const h = Math.ceil(e.nativeEvent.layout.height);
                  if (h > 0) {
                    setMonthGridMeasuredHeight((prev) => (prev === h ? prev : h));
                  }
                }
              : undefined
          }
        >
          <View style={styles.weekDaysRow}>
            {DAYS.map((day, index) => (
              <Text key={index} style={styles.weekDayLabel}>
                {(day || '').slice(0, 2).toUpperCase()}
              </Text>
            ))}
          </View>
          <View style={styles.monthDaysGrid}>
            {days.map((day, index) => {
              if (day.isPlaceholder) {
                return (
                  <View
                    key={`${pageKey}-ph-${index}`}
                    pointerEvents="none"
                    style={[styles.monthDateItem, styles.placeholderItem]}
                  />
                );
              }

              const isSelected = day.fullDate && isSelectedDate(day.fullDate);
              return (
                <TouchableOpacity
                  key={`${pageKey}-d-${index}`}
                  style={[
                    styles.monthDateItem,
                    !day.isCurrentMonth && styles.otherMonthItem,
                  ]}
                  onPress={() => {
                    if (day.fullDate) setCurrentDate(day.fullDate);
                  }}
                >
                  <View style={[styles.monthNumberWrapper, isSelected && styles.selectedWeekItem]}>
                    <Text
                      style={[
                        styles.monthDateText,
                        isSelected && styles.selectedText,
                        !day.isCurrentMonth && styles.otherMonthText,
                      ]}
                    >
                      {day.date}
                    </Text>
                  </View>
                  {day.isCurrentMonth && day.dateKey ? renderDayDots(day.dateKey) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderMonthView = () => {
    const onMonthStripLayout = (e) => {
      const w = Math.floor(e.nativeEvent.layout.width);
      if (w > 0 && w !== monthPagerWidth) setMonthPagerWidth(w);
    };

    const fallbackH = monthGridViewportHeight(currentDate);
    const viewportH =
      monthGridMeasuredHeight != null && monthGridMeasuredHeight > 0
        ? monthGridMeasuredHeight
        : fallbackH;

    const monthPagerReady =
      monthPagerWidth > 0 && monthGridMeasuredHeight != null && monthGridMeasuredHeight > 0;

    if (!monthPagerReady) {
      return (
        <View style={styles.monthSwipeFrame} onLayout={onMonthStripLayout}>
          {renderMonthPage(currentDate, 'measure')}
        </View>
      );
    }

    const prevMonthAnchor = addCalendarMonths(currentDate, -1);
    const nextMonthAnchor = addCalendarMonths(currentDate, 1);

    return (
      <View style={styles.monthSwipeFrame} onLayout={onMonthStripLayout}>
        <View style={[styles.monthSwipeViewport, { height: viewportH }]}>
          <ScrollView
            ref={monthSwipeRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            decelerationRate="fast"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            onMomentumScrollEnd={handleMonthSwipeEnd}
            contentContainerStyle={styles.monthSwipeContent}
            style={{ height: viewportH }}
          >
            {renderMonthPage(prevMonthAnchor, 'prev')}
            {renderMonthPage(currentDate, 'curr')}
            {renderMonthPage(nextMonthAnchor, 'next')}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderMonthPicker = () => (
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={closeMonthPicker}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeMonthPicker}
          />

          {showMonthPicker ? (
            <View style={styles.pickerCard}>
              <View style={styles.highlightBar} pointerEvents="none" />

              <View style={styles.pickerWheelsShell}>
                <WheelPicker
                  data={MONTHS}
                  selectedIndex={pickerDraft.m0}
                  onChange={(idx) => setPickerDraft((d) => ({ ...d, m0: idx }))}
                  width={150}
                  itemHeight={ITEM_HEIGHT}
                  visibleItems={5}
                  textStyle={styles.wheelItem}
                  selectedTextStyle={styles.wheelSelectedItem}
                  decel={Platform.OS === 'ios' ? 0.99 : 0.985}
                  delayPressIn={0}
                />

                <WheelPicker
                  data={pickerYearValues.map(String)}
                  selectedIndex={pickerDraft.yIdx}
                  onChange={(idx) => setPickerDraft((d) => ({ ...d, yIdx: idx }))}
                  width={100}
                  itemHeight={ITEM_HEIGHT}
                  visibleItems={5}
                  textStyle={styles.wheelItem}
                  selectedTextStyle={styles.wheelSelectedItem}
                  decel={Platform.OS === 'ios' ? 0.99 : 0.985}
                  delayPressIn={0}
                />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    );

  return (
    <GestureDetector gesture={verticalCalendarSwipe}>
      <View style={styles.calendarRoot}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerButton}>
              <TouchableOpacity
                onPress={openMonthPicker}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={getMonthYearText()}
              >
                <Text style={styles.headerText}>{getMonthYearText()}</Text>
              </TouchableOpacity>
              <View style={styles.headerChevronGroup}>
                {effectiveMode === 'month' ? (
                  <TouchableOpacity
                    onPress={collapseStrip}
                    hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="До тижня"
                  >
                    <Icon name="chevron-up" size={20} color={COLORS.primaryDark} />
                  </TouchableOpacity>
                ) : null}
                {effectiveMode === 'week' ? (
                  <TouchableOpacity
                    onPress={expandStrip}
                    hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Місяць"
                  >
                    <Icon name="chevron-down" size={20} color={COLORS.primaryDark} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.calendarIconButton}
              onPress={openMonthPicker}
            >
              <View style={styles.calendarIconContainer}>
                <Svg width={29} height={28} viewBox="0 0 29 28" fill="none">
                  <Path
                  d="M4.06376 0C2.8223 0 1.79151 1.04093 1.79151 2.2946V5.11784C1.41036 5.33085 1.06003 5.60267 0.778368 5.95182C0.123451 6.76289 -0.137898 7.8309 0.0698427 8.8571V8.85938C0.683555 11.8744 1.5367 16.0674 1.59069 16.3333C1.53678 16.5988 0.686997 20.7738 0.0743556 23.7891C-0.13508 24.8203 0.128305 25.8929 0.785137 26.708V26.7103C1.4437 27.5254 2.43203 28 3.47483 28H25.4775C26.5312 28 27.5302 27.5203 28.1965 26.6966V26.6943C28.8619 25.8697 29.1278 24.7856 28.9163 23.7435C28.3038 20.73 27.4627 16.5977 27.409 16.3333C27.463 16.0672 28.3171 11.8681 28.9298 8.85254C29.1378 7.82896 28.8781 6.76066 28.2236 5.94954L28.2213 5.94727C27.9395 5.59839 27.5896 5.32787 27.2082 5.11556V2.2946C27.2082 1.04093 26.1774 0 24.9359 0H4.06376ZM4.10212 2.33333H24.8976V4.66667H4.10212V2.33333ZM11.1558 11.7601C11.6872 11.7601 12.1722 11.8243 12.6089 11.9538C13.0468 12.0833 13.4229 12.2759 13.7372 12.5326C14.0514 12.7892 14.2961 13.107 14.4705 13.485C14.645 13.863 14.73 14.3016 14.73 14.7998C14.73 15.0296 14.6967 15.256 14.6262 15.4811C14.5557 15.7051 14.4523 15.9162 14.3148 16.1146C14.2594 16.1939 14.1764 16.2609 14.1117 16.3356H9.95535V17.9557H11.07C11.3358 17.9557 11.5761 17.9862 11.7921 18.0469C12.007 18.1075 12.1902 18.2023 12.3404 18.3294C12.4906 18.4566 12.6037 18.6209 12.6834 18.8239C12.7631 19.0269 12.803 19.2684 12.803 19.5508C12.803 19.7701 12.7675 19.9693 12.6947 20.1478C12.6219 20.3263 12.5163 20.4786 12.3788 20.6081C12.2413 20.7376 12.0731 20.8389 11.8756 20.9066C11.6769 20.9754 11.456 21.0091 11.2099 21.0091C10.987 21.0091 10.7811 20.9754 10.5917 20.9066C10.4034 20.8377 10.2407 20.7442 10.102 20.624C9.96454 20.5039 9.85675 20.3613 9.77935 20.1956C9.70194 20.03 9.66427 19.8472 9.66427 19.6465H7.56803C7.56803 20.1738 7.67152 20.6276 7.87716 21.0114C8.0828 21.3941 8.35329 21.7118 8.68948 21.9661C9.02567 22.2205 9.40709 22.4099 9.83801 22.5312C10.2678 22.6537 10.7086 22.7135 11.158 22.7135C11.6895 22.7135 12.183 22.6427 12.6405 22.5039C13.0969 22.3651 13.4935 22.1638 13.8274 21.8978C14.1613 21.6318 14.422 21.3042 14.6127 20.9134C14.8033 20.5226 14.8992 20.0786 14.8992 19.5804C14.8992 18.9947 14.7538 18.4876 14.4615 18.0583C14.1692 17.6289 13.7252 17.3068 13.1302 17.0921C13.3867 16.9755 13.6129 16.8317 13.8116 16.6637C13.9306 16.5622 14.0158 16.4464 14.114 16.3356H19.3354V22.5677H21.4317V16.3333H19.3354V14.4124L16.833 15.1963V13.4759L21.206 11.8923H21.4317V16.3333H25.051L25.0984 16.568C25.0984 16.568 26.0188 21.1035 26.6508 24.2129C26.7225 24.5693 26.6344 24.9373 26.4071 25.2201C26.1769 25.5047 25.8401 25.6667 25.4775 25.6667H3.47483C3.12432 25.6667 2.79853 25.5082 2.57676 25.2337C2.35664 24.9594 2.26758 24.6031 2.33757 24.2585C2.96955 21.148 3.90129 16.568 3.90129 16.568L3.94868 16.3333H9.95309H11.0339C11.4418 16.3333 11.9971 16.1664 12.2524 15.8981C12.5077 15.6298 12.636 15.2728 12.636 14.8294C12.636 14.6346 12.608 14.4517 12.5503 14.2826C12.4925 14.1146 12.4018 13.9686 12.284 13.8496C12.165 13.7306 12.0186 13.6382 11.8395 13.5693C11.6604 13.5005 11.4491 13.4668 11.2077 13.4668C11.0147 13.4668 10.8338 13.4928 10.6616 13.5488C10.4906 13.6048 10.3386 13.6854 10.2103 13.7881C10.0821 13.8908 9.9808 14.0159 9.90571 14.1641C9.83061 14.3134 9.79514 14.4799 9.79514 14.6654H7.6989C7.6989 14.2255 7.78829 13.8272 7.96967 13.4691C8.15106 13.1109 8.39786 12.8062 8.70979 12.5553C9.02172 12.3033 9.38815 12.1086 9.80868 11.9697C10.2292 11.8309 10.6775 11.7601 11.1558 11.7601Z"
                    fill={COLORS.primaryDark}
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          </View>

          {effectiveMode === 'month' ? renderMonthView() : renderWeekView()}

          {renderMonthPicker()}
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  calendarRoot: {
    marginHorizontal: 1,
    marginTop: SPACING.sm,
    position: 'relative',
  },
  container: {
    backgroundColor: '#FAFAFA',
    borderRadius: 35,
    paddingVertical: SPACING.md,
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginLeft: SPACING.md,
  },
  headerChevronGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
    color: '#321E00',
    lineHeight: 18,
  },
  calendarIconButton: {
    padding: SPACING.xs,
  },
  weekSwipeFrame: {
    width: '100%',
  },
  monthSwipeFrame: {
    width: '100%',
  },
  monthSwipeViewport: {
    width: '100%',
    overflow: 'hidden',
  },
  weekSwipeContent: {
    flexDirection: 'row',
  },
  monthSwipeContent: {
    flexDirection: 'row',
  },
  monthPage: {
    flexShrink: 0,
  },
  monthPageMeasure: {
    width: '100%',
  },
  weekPage: {
    flexShrink: 0,
  },
  weekPageMeasure: {
    width: '100%',
  },
  weekContainer: {
    paddingHorizontal: SPACING.md,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.sm,
  },
  weekDayLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    width: 40,
    textAlign: 'center',
  },
  weekDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekDateItem: {
    width: 40,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: RADIUS.sm,
  },
  weekNumberWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
  },
  todayItem: {
    backgroundColor: 'transparent',
    borderColor: COLORS.primaryDark,
    borderWidth: 1,
  },
  selectedWeekItem: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    borderRadius: 10,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDateText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  todayText: {
    color: '#321E00',
    fontWeight: '600',
  },
  selectedText: {
    color: '#321E00',
    fontWeight: '600',
  },
  calendarIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    marginRight: SPACING.sm,
  },
  calendarIconText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: -2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
    marginTop: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#452C16',
  },
  monthContainer: {
    paddingHorizontal: SPACING.md,
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDateItem: {
    width: '14.28%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  placeholderItem: {
    opacity: 0,
    overflow: 'hidden',
  },
  monthNumberWrapper: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherMonthItem: {
    opacity: 0.3,
  },
  monthDateText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  otherMonthText: {
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  pickerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.panelLight,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    position: 'relative',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  pickerWheelsShell: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    ...(Platform.OS === 'android' ? { elevation: 1 } : {}),
  },
  highlightBar: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    height: ITEM_HEIGHT,
    top: SPACING.lg + ITEM_HEIGHT * (VISIBLE_ITEMS / 2 - 0.5),
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 0,
  },
  monthPickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '80%',
    width: '85%',
  },
  monthPickerScroll: {
    maxHeight: 500,
  },
  yearLabel: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  monthItem: {
    width: '47%',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.grayLight,
  },
  selectedMonthItem: {
    backgroundColor: COLORS.primary,
  },
  monthItemText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  selectedMonthText: {
    fontWeight: 'bold',
    color: '#FAFAFA',
  },
  wheel: {
    width: 140,
    height: Platform.OS === 'ios' ? 220 : 200,
  },
  wheelItem: {
    color: COLORS.textSecondary,
    fontSize: 22,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    height: ITEM_HEIGHT,
    lineHeight: ITEM_HEIGHT,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  wheelSelectedItem: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  arrowButton: {
    padding: SPACING.xs,
  },
  yearColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
});

export default Calendar;
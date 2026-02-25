import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../styles/theme';
import WheelPicker from './WheelPicker';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const Calendar = () => {
  const { language } = useLanguage();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  
  const [expanded, setExpanded] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
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

  const getCurrentWeek = () => {
    const current = new Date(currentDate);
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const weekStart = new Date(current);
    weekStart.setDate(current.getDate() + diff);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const days = [];
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonthDays - i),
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i),
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i),
      });
    }
    
    return days;
  };

  const isToday = (date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getMonthYearText = () => {
    const month = MONTHS[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    return `${month} ${year}`;
  };

  const changeMonth = (monthIndex, year, close = false) => {
    setCurrentDate(new Date(year, monthIndex, 1));
    if (close) setShowMonthPicker(false);
  };

  const renderDayDots = (date) => {
    return null;
  };

  const renderWeekView = () => {
    const week = getCurrentWeek();
    return (
      <View style={styles.weekContainer}>
        <View style={styles.weekDaysRow}>
          {DAYS.map((day, index) => (
            <Text key={index} style={styles.weekDayLabel}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.weekDatesRow}>
          {week.map((dateObj, index) => {
            const dayNum = dateObj.getDate();
            const isTodayDate = isToday(dateObj);
            const isSelected = isTodayDate;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.weekDateItem, isSelected && styles.selectedItem]}
                onPress={() => {
                  setCurrentDate(dateObj);
                }}
              >
                <Text style={[styles.weekDateText, isSelected && styles.selectedText]}>
                  {dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMonthView = () => {
    const days = getMonthDays();
    
    return (
      <View style={styles.monthContainer}>
        <View style={styles.weekDaysRow}>
          {DAYS.map((day, index) => (
            <Text key={index} style={styles.weekDayLabel}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.monthDaysGrid}>
          {days.map((day, index) => {
            const isTodayDate = isToday(day.fullDate);
            const isSelected = isTodayDate;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthDateItem,
                  isSelected && styles.selectedItem,
                  !day.isCurrentMonth && styles.otherMonthItem,
                ]}
                onPress={() => {
                  setCurrentDate(day.fullDate);
                }}
              >
                <Text
                  style={[
                    styles.monthDateText,
                    isSelected && styles.selectedText,
                    !day.isCurrentMonth && styles.otherMonthText,
                  ]}
                >
                  {day.date}
                </Text>
                {day.isCurrentMonth && renderDayDots(day.fullDate)}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMonthPicker = () => {
    const currentYear = today.getFullYear();
    const years = Array.from({ length: 101 }, (_, idx) => currentYear - 50 + idx);

    return (
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowMonthPicker(false)}
          />

          <View style={styles.pickerCard}>
            <View style={styles.highlightBar} pointerEvents="none" />

            <WheelPicker
              key={`month-${currentDate.getMonth()}-${showMonthPicker}`}
              data={MONTHS}
              selectedIndex={currentDate.getMonth()}
              onChange={(idx, byTap) => {
                changeMonth(idx, currentDate.getFullYear(), byTap);
              }}
              width={150}
              itemHeight={ITEM_HEIGHT}
              visibleItems={5}
              textStyle={styles.wheelItem}
              selectedTextStyle={styles.wheelSelectedItem}
              decel={Platform.OS === 'ios' ? 0.99 : 0.985}
            />

            <WheelPicker
              key={`year-${currentDate.getFullYear()}-${showMonthPicker}`}
              data={years.map(String)}
              selectedIndex={years.findIndex((y) => y === currentDate.getFullYear())}
              onChange={(idx, byTap) => {
                changeMonth(currentDate.getMonth(), years[idx], byTap);
              }}
              width={100}
              itemHeight={ITEM_HEIGHT}
              visibleItems={5}
              textStyle={styles.wheelItem}
              selectedTextStyle={styles.wheelSelectedItem}
              decel={Platform.OS === 'ios' ? 0.99 : 0.985}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.headerText}>{getMonthYearText()}</Text>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#1B4332"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.calendarIconButton}
          onPress={() => setShowMonthPicker(true)}
        >
          <View style={styles.calendarIconContainer}>
            <Image
              source={require('../../assets/icons/1.png')}
              style={styles.calendarIconImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </View>

      {expanded ? renderMonthView() : renderWeekView()}

      {renderMonthPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: 28,
    paddingVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
  },
  headerText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
    color: '#1B4332',
    lineHeight: 18,
  },
  calendarIconButton: {
    padding: SPACING.xs,
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
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  todayItem: {
    backgroundColor: 'transparent',
    borderColor: '#1B4332',
    borderWidth: 1,
  },
  selectedItem: {
    backgroundColor: '#1B4332',
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
    color: '#1B4332',
    fontWeight: '600',
  },
  selectedText: {
    color: '#FAFAFA',
    fontWeight: 'bold',
  },
  calendarIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  calendarIconImage: {
    width: 36,
    height: 36,
  },
  calendarIconText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: -2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
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
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
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
  },
  pickerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.medium,
    position: 'relative',
    gap: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightBar: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    height: ITEM_HEIGHT,
    top: SPACING.lg + ITEM_HEIGHT * (VISIBLE_ITEMS / 2 - 0.5),
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: '#1B4332',
    fontSize: 22,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    height: ITEM_HEIGHT,
    lineHeight: ITEM_HEIGHT,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  wheelSelectedItem: {
    color: '#1B4332',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default Calendar;
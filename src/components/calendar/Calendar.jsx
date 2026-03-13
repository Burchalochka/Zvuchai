import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../styles/theme';
import WheelPicker from './WheelPicker';
import { useLanguage } from '../../context/LanguageContext';
import { useSelectedDate } from '../../context/SelectedDateContext';
import { getTranslation } from '../../utils/translations';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const Calendar = ({ taskCountsByDate = {} }) => {
  const { language } = useLanguage();
  const { selectedDate: currentDate, setSelectedDate: setCurrentDate } = useSelectedDate();
  const today = new Date();
  
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
    
    return days;
  };

  const isToday = (date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (date) => {
    return (
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
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
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const count = taskCountsByDate[key] || 0;
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

  const renderWeekView = () => {
    const week = getCurrentWeek();
    return (
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
                key={index}
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
                {renderDayDots(dateObj)}
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
              {(day || '').slice(0, 2).toUpperCase()}
            </Text>
          ))}
        </View>
        <View style={styles.monthDaysGrid}>
          {days.map((day, index) => {
            const isSelected = isSelectedDate(day.fullDate);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthDateItem,
                  !day.isCurrentMonth && styles.otherMonthItem,
                ]}
                onPress={() => {
                  setCurrentDate(day.fullDate);
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
            color={COLORS.primaryDark}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.calendarIconButton}
          onPress={() => setShowMonthPicker(true)}
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

      {expanded ? renderMonthView() : renderWeekView()}

      {renderMonthPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    marginHorizontal: 1,
    marginTop: SPACING.sm,
    borderRadius: 35,
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
    marginLeft: SPACING.md,
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
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
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
    color: COLORS.primaryDark,
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
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { FONTS, SPACING, COLORS } from '../../styles/theme';

const MONTH_NAMES_UA = [
  'Січень','Лютий','Березень','Квітень','Травень','Червень',
  'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень',
];
const WEEK_SHORT = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','НД'];

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const isSameDay = (a, b) => a && b && startOfDay(a).getTime() === startOfDay(b).getTime();

const buildMonthDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const days = [];
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ date: prevLast - i, isCurrent: false, full: new Date(year, month - 1, prevLast - i) });
  }
  for (let i = 1; i <= last.getDate(); i++) {
    days.push({ date: i, isCurrent: true, full: new Date(year, month, i) });
  }
  const slots = Math.ceil(days.length / 7) * 7;
  let extra = 1;
  while (days.length < slots) {
    days.push({ date: extra, isCurrent: false, full: new Date(year, month + 1, extra) });
    extra++;
  }
  return days;
};

const RescheduleTaskModal = ({ visible, task, onConfirm, onCancel }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (!visible || !task?.date) return;
    const [y, mo, d] = String(task.date).split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return;
    setCurrentMonth(new Date(y, mo - 1, 1));
    setSelectedDate(null);
  }, [visible, task?.id, task?.date]);

  const days = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);
  const today = new Date();

  const changeMonth = (dir) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + dir);
    setCurrentMonth(next);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(task.id, selectedDate);
      setSelectedDate(null);
    }
  };

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.card}>
            {/* Заголовок */}
            <Text style={styles.title}>Перенести завдання</Text>
            <Text style={styles.subtitle}>Оберіть нову дату виконання</Text>

            {/* Хедер місяця */}
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
                <Icon name="chevron-up" size={20} color="#2C1A00" />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {MONTH_NAMES_UA[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              {/* Іконка календаря (декоративна) */}
              <View style={styles.calIconWrapper}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19 4H5C3.9 4 3 4.9 3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8ZM9 14H7V12H9V14ZM13 14H11V12H13V14ZM17 14H15V12H17V14ZM9 18H7V16H9V18ZM13 18H11V16H13V18ZM17 18H15V16H17V18Z"
                    fill="#2C1A00"
                  />
                </Svg>
              </View>
            </View>

            {/* Дні тижня */}
            <View style={styles.weekRow}>
              {WEEK_SHORT.map((d) => (
                <Text key={d} style={styles.weekLabel}>{d}</Text>
              ))}
            </View>

            {/* Сітка днів */}
            <View style={styles.grid}>
              {days.map((day, idx) => {
                const isToday = isSameDay(day.full, today);
                const isSelected = isSameDay(day.full, selectedDate);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.dayCell}
                    onPress={() => day.isCurrent && setSelectedDate(day.full)}
                    activeOpacity={day.isCurrent ? 0.7 : 1}
                  >
                    <View style={[
                      styles.dayInner,
                      isToday && styles.todayInner,
                      isSelected && styles.selectedInner,
                    ]}>
                      <Text style={[
                        styles.dayText,
                        !day.isCurrent && styles.dayTextOther,
                        isToday && styles.todayText,
                        isSelected && styles.selectedText,
                      ]}>
                        {day.date}
                      </Text>
                    </View>
                    {/* Крапки (для прикладу — у сьогодні) */}
                    {isToday && (
                      <View style={styles.dotsRow}>
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Кнопки */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !selectedDate && styles.confirmBtnDisabled]}
                onPress={handleConfirm}
                disabled={!selectedDate}
              >
                <Text style={styles.confirmText}>Підтвердити</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#2C1A00',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: '#8A7A6A',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 20,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  arrowBtn: {
    padding: 4,
  },
  monthLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'Montserrat-SemiBold',
    color: '#2C1A00',
  },
  calIconWrapper: {
    padding: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#A89880',
    fontFamily: 'Montserrat-Medium',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayInner: {
    borderWidth: 1.5,
    borderColor: '#2C1A00',
  },
  selectedInner: {
    backgroundColor: '#2C1A00',
  },
  dayText: {
    fontSize: 14,
    color: '#2C1A00',
    fontFamily: 'Montserrat-Medium',
  },
  dayTextOther: {
    color: '#C5BAA8',
  },
  todayText: {
    fontFamily: 'Montserrat-Bold',
  },
  selectedText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2C1A00',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#C5BAA8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: FONTS.sizes.md,
    color: '#2C1A00',
    fontFamily: 'Montserrat-Medium',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#2C1A00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#452C16',
  },
  confirmText: {
    fontSize: FONTS.sizes.md,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },
});

export default RescheduleTaskModal;

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../styles/theme';

const ITEM_HEIGHT = 46; // Висота одного рядка
const VISIBLE_ITEMS = 3; 
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // Загальна висота
const PADDING_VERTICAL = ITEM_HEIGHT; // Відступ, щоб перша і остання цифри ставали по центру
const COLUMN_WIDTH = 70;

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const CustomTimePicker = ({ value, onChange, label }) => {
  const [selectedHour, setSelectedHour] = useState('00');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  // Ініціалізація з value
  useEffect(() => {
    if (value) {
      let hour = '00';
      let minute = '00';
      
      if (typeof value === 'string') {
        const parts = value.split(':');
        if (parts.length >= 2) {
          hour = parts[0].padStart(2, '0');
          minute = parts[1].padStart(2, '0');
        }
      } else if (value instanceof Date) {
        hour = value.getHours().toString().padStart(2, '0');
        minute = value.getMinutes().toString().padStart(2, '0');
      }
      
      setSelectedHour(hour);
      setSelectedMinute(minute);

      // Скрол до потрібної позиції з невеличкою затримкою для рендеру
      setTimeout(() => {
        const hourIndex = HOURS.indexOf(hour);
        const minuteIndex = MINUTES.indexOf(minute);
        if (hourScrollRef.current && hourIndex >= 0) {
          hourScrollRef.current.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
        }
        if (minuteScrollRef.current && minuteIndex >= 0) {
          minuteScrollRef.current.scrollTo({ y: minuteIndex * ITEM_HEIGHT, animated: false });
        }
      }, 100);
    }
  }, [value]);

  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    const newTime = `${hour}:${selectedMinute}`;
    onChange && onChange(newTime);
  };

  const handleMinuteSelect = (minute) => {
    setSelectedMinute(minute);
    const newTime = `${selectedHour}:${minute}`;
    onChange && onChange(newTime);
  };

  const handleHourScrollEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, HOURS.length - 1));
    const hour = HOURS[clampedIndex];
    handleHourSelect(hour);
  };

  const handleMinuteScrollEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, MINUTES.length - 1));
    const minute = MINUTES[clampedIndex];
    handleMinuteSelect(minute);
  };

  const renderColumn = (data, selectedValue, onSelect, scrollRef, onScrollEnd, labelText) => (
    <View style={styles.column}>
      <ScrollView
        ref={scrollRef}
        style={styles.columnScroll}
        contentContainerStyle={styles.columnContent}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled={true}
        onMomentumScrollEnd={onScrollEnd}
      >
        {data.map((item) => {
          const isSelected = item === selectedValue;
          return (
            <TouchableOpacity
              key={item}
              style={styles.itemContainer}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.itemText,
                isSelected && styles.selectedItemText,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {/* Підпис, який завжди стоїть по центру */}
      <View style={styles.staticLabelContainer} pointerEvents="none">
        <Text style={styles.staticLabelText}>{labelText}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.pickerContainer}>
        {/* Рамочка виділення по центру */}
        <View style={styles.selectionHighlight} pointerEvents="none" />
        
        {/* Години */}
        {renderColumn(HOURS, selectedHour, handleHourSelect, hourScrollRef, handleHourScrollEnd, "год")}
        
        {/* Розділювач */}
        <View style={styles.separator}>
          <Text style={styles.separatorText}>:</Text>
        </View>
        
        {/* Хвилини */}
        {renderColumn(MINUTES, selectedMinute, handleMinuteSelect, minuteScrollRef, handleMinuteScrollEnd, "хв")}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
    alignItems: 'center', // Центруємо весь пікер
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: CONTAINER_HEIGHT,
    backgroundColor: COLORS.panelLight || '#FDFBF7',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(74, 44, 22, 0.15)', // Дуже легка коричнева рамка
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: SPACING.md,
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT, // Рівно посередині
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(74, 44, 22, 0.04)', // Ледь помітний фон
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(74, 44, 22, 0.1)', // Тоненькі лінії зверху і знизу числа
  },
  column: {
    width: COLUMN_WIDTH,
    height: '100%',
    position: 'relative',
  },
  columnScroll: {
    flex: 1,
  },
  columnContent: {
    paddingVertical: PADDING_VERTICAL,
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 20,
    color: 'rgba(74, 44, 22, 0.3)', // Напівпрозорий коричневий для неактивних
    fontFamily: FONTS.regular,
  },
  selectedItemText: {
    fontSize: 26,
    color: '#4A2C16', // Насичений коричневий
    fontFamily: FONTS.bold,
  },
  separator: {
    width: 15,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separatorText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#4A2C16',
    marginBottom: 4, // Легке візуальне вирівнювання двокрапки
  },
  staticLabelContainer: {
    position: 'absolute',
    right: 0,
    top: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    justifyContent: 'center',
  },
  staticLabelText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: 'rgba(74, 44, 22, 0.5)',
  },
});

export default CustomTimePicker;
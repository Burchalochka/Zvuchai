import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const CustomTimePicker = ({ value, onChange }) => {
  const [selectedHour, setSelectedHour] = useState('00');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  // Generate hours 00-23
  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  // Generate minutes 00-59
  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  // Initialize from value
  useEffect(() => {
    if (value) {
      let hour = '00';
      let minute = '00';
      
      if (typeof value === 'string') {
        // Parse "HH:MM" format
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

      // Scroll to position after a short delay
      setTimeout(() => {
        const hourIndex = hours.indexOf(hour);
        const minuteIndex = minutes.indexOf(minute);
        
        if (hourListRef.current && hourIndex >= 0) {
          hourListRef.current.scrollToIndex({
            index: hourIndex,
            animated: false,
            viewPosition: 0.5,
          });
        }
        
        if (minuteListRef.current && minuteIndex >= 0) {
          minuteListRef.current.scrollToIndex({
            index: minuteIndex,
            animated: false,
            viewPosition: 0.5,
          });
        }
      }, 100);
    }
  }, [value]);

  // Handle hour selection
  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    const newTime = `${hour}:${selectedMinute}`;
    onChange && onChange(newTime);
  };

  // Handle minute selection
  const handleMinuteSelect = (minute) => {
    setSelectedMinute(minute);
    const newTime = `${selectedHour}:${minute}`;
    onChange && onChange(newTime);
  };

  // Render hour item
  const renderHourItem = ({ item }) => {
    const isSelected = item === selectedHour;
    
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isSelected && styles.selectedItemContainer,
        ]}
        onPress={() => handleHourSelect(item)}
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
  };

  // Render minute item
  const renderMinuteItem = ({ item }) => {
    const isSelected = item === selectedMinute;
    
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isSelected && styles.selectedItemContainer,
        ]}
        onPress={() => handleMinuteSelect(item)}
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
  };

  // Get item layout for FlatList optimization
  const getItemLayout = (data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  // Handle scroll end for hour list
  const handleHourScrollEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, hours.length - 1));
    const hour = hours[clampedIndex];
    handleHourSelect(hour);
  };

  // Handle scroll end for minute list
  const handleMinuteScrollEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, minutes.length - 1));
    const minute = minutes[clampedIndex];
    handleMinuteSelect(minute);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        {/* Hours column */}
        <View style={styles.column}>
          <FlatList
            ref={hourListRef}
            data={hours}
            renderItem={renderHourItem}
            keyExtractor={(item) => `hour-${item}`}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={handleHourScrollEnd}
            initialNumToRender={24}
            maxToRenderPerBatch={24}
            windowSize={VISIBLE_ITEMS}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        </View>
        
        <View style={styles.separator}>
          <Text style={styles.separatorText}>:</Text>
        </View>
        
        {/* Minutes column */}
        <View style={styles.column}>
          <FlatList
            ref={minuteListRef}
            data={minutes}
            renderItem={renderMinuteItem}
            keyExtractor={(item) => `minute-${item}`}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={handleMinuteScrollEnd}
            initialNumToRender={60}
            maxToRenderPerBatch={60}
            windowSize={VISIBLE_ITEMS}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        </View>
        
        {/* Selection highlight overlay */}
        <View style={styles.selectionOverlay} pointerEvents="none">
          <View style={styles.selectionLine} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    backgroundColor: '#F8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4C4B0',
    overflow: 'hidden',
    position: 'relative',
  },
  column: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: ITEM_HEIGHT * 2, // Padding to center items
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedItemContainer: {
    backgroundColor: 'rgba(74, 44, 22, 0.05)', // #4A2C16 with transparency
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#6B5B4F', // Greyed out for unselected
  },
  selectedItemText: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#4A2C16', // Brown color from requirements
  },
  separator: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separatorText: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#321E00',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  selectionLine: {
    width: '90%',
    height: 2,
    backgroundColor: '#4A2C16',
    borderRadius: 1,
  },
});

export default CustomTimePicker;
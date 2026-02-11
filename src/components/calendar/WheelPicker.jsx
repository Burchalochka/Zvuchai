import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

const WheelPicker = ({
  data,
  selectedIndex = 0,
  onChange,
  itemHeight = 44,
  visibleItems = 5,
  textStyle = {},
  selectedTextStyle = {},
  width = 120,
  scrollEnabled = true,
  maxFlingItems = 1,
  decel = Platform.OS === 'ios' ? 0.99 : 0.985,
}) => {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const scrollTimeoutRef = useRef(null);
  const lastIndexRef = useRef(selectedIndex);
  const isScrollingRef = useRef(false);
  const spacerHeight = (itemHeight * (visibleItems - 1)) / 2;
  const decelerationRateValue = Platform.OS === 'android' ? 'normal' : decel;

  const clampIndexByFling = useCallback((targetIndex) => {
    const base = lastIndexRef.current;
    const diff = targetIndex - base;
    if (Math.abs(diff) > maxFlingItems) {
      return base + Math.sign(diff) * maxFlingItems;
    }
    return targetIndex;
  }, [maxFlingItems]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: selectedIndex * itemHeight, animated: false });
      setCurrentIndex(selectedIndex);
      lastIndexRef.current = selectedIndex;
    }
  }, [selectedIndex, itemHeight]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const snapToIndex = (index, byTap = false) => {
    if (index < 0) index = 0;
    if (index >= data.length) index = data.length - 1;
    scrollRef.current?.scrollTo({ y: index * itemHeight, animated: true });
    if (index !== currentIndex) {
      setCurrentIndex(index);
      onChange && onChange(index, byTap);
    }
  };

  const handleMomentumEnd = (e) => {
    isScrollingRef.current = false;
    const offsetY = e.nativeEvent.contentOffset.y;
    let index = Math.round(offsetY / itemHeight);
    index = clampIndexByFling(index);
    snapToIndex(index);
  };

  const handleScrollEndDrag = (e) => {
    isScrollingRef.current = false;
    const offsetY = e.nativeEvent.contentOffset.y;
    let index = Math.round(offsetY / itemHeight);
    index = clampIndexByFling(index);
    snapToIndex(index);
  };

  const handleScrollBeginDrag = useCallback(() => {
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

  const handleScroll = useCallback((e) => {
    if (!isScrollingRef.current) return;
    
    const offsetY = e.nativeEvent.contentOffset.y;
    const idx = Math.round(offsetY / itemHeight);
    
    if (idx >= 0 && idx < data.length && idx !== lastIndexRef.current) {
      lastIndexRef.current = idx;
      setCurrentIndex(idx);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        if (onChange && isScrollingRef.current) {
          onChange(idx, false);
        }
        scrollTimeoutRef.current = null;
      }, 150);
    }
  }, [data.length, itemHeight, onChange]);

  return (
    <View
      style={{ width, height: itemHeight * visibleItems, overflow: 'hidden' }}
      pointerEvents="box-none"
    >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        snapToInterval={itemHeight}
        snapToAlignment="center"
        decelerationRate={decelerationRateValue}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleScrollEndDrag}
        contentContainerStyle={{ paddingVertical: spacerHeight }}
        scrollEventThrottle={100}
        nestedScrollEnabled={true}
        bounces={false}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        pagingEnabled={false}
        directionalLockEnabled={true}
        overScrollMode="never"
        scrollToOverflowEnabled={false}
        maintainVisibleContentPosition={null}
      >
        {data.map((item, idx) => {
          const isSelected = idx === currentIndex;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              key={idx}
              onPress={() => snapToIndex(idx, true)}
              style={{ height: itemHeight, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text
                style={[styles.itemText, textStyle, isSelected && styles.selectedText, isSelected && selectedTextStyle]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  itemText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#9CA3AF',
  },
  selectedText: {
    fontWeight: '600',
    color: '#1B4332',
  },
});

export default WheelPicker;

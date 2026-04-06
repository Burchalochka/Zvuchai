import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { FONTS } from '../../styles/theme';

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
  maxFlingItems = 1000,
  decel = Platform.OS === 'ios' ? 0.99 : 0.985,
  delayPressIn = 120,
}) => {
  const len = Array.isArray(data) ? data.length : 0;
  const baseIdx = Number.isFinite(selectedIndex) ? selectedIndex : 0;
  const safeIndex = len > 0 ? Math.min(Math.max(0, baseIdx), len - 1) : 0;

  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(safeIndex);
  const lastIndexRef = useRef(safeIndex);
  const committedIndexRef = useRef(safeIndex);
  const isDraggingRef = useRef(false);
  const prevSelectedFromPropsRef = useRef(undefined);
  const hasSyncedFromPropsRef = useRef(false);
  const spacerHeight = (itemHeight * (visibleItems - 1)) / 2;
  const decelerationRateValue = Platform.OS === 'android' ? 'normal' : decel;

  const clampIndexByFling = useCallback(
    (targetIndex) => {
      if (maxFlingItems >= len || maxFlingItems >= 500) return targetIndex;
      const base = lastIndexRef.current;
      const diff = targetIndex - base;
      if (Math.abs(diff) > maxFlingItems) {
        return base + Math.sign(diff) * maxFlingItems;
      }
      return targetIndex;
    },
    [maxFlingItems, len],
  );

  const scrollToIndex = useCallback(
    (idx, animated) => {
      if (!scrollRef.current || !len) return;
      const y = Math.min(Math.max(0, idx), len - 1) * itemHeight;
      scrollRef.current.scrollTo({ y, animated });
    },
    [len, itemHeight],
  );

  useEffect(() => {
    if (!len) return;
    if (isDraggingRef.current) return;

    const idx = Math.min(Math.max(0, Number.isFinite(selectedIndex) ? selectedIndex : 0), len - 1);

    const echoBack =
      hasSyncedFromPropsRef.current &&
      idx === committedIndexRef.current &&
      idx === lastIndexRef.current;
    if (echoBack) {
      prevSelectedFromPropsRef.current = idx;
      return;
    }

    if (prevSelectedFromPropsRef.current === idx && hasSyncedFromPropsRef.current) {
      return;
    }

    prevSelectedFromPropsRef.current = idx;
    hasSyncedFromPropsRef.current = true;

    const id = requestAnimationFrame(() => {
      if (isDraggingRef.current) return;
      scrollToIndex(idx, false);
      setCurrentIndex(idx);
      lastIndexRef.current = idx;
      committedIndexRef.current = idx;
    });
    return () => cancelAnimationFrame(id);
  }, [selectedIndex, itemHeight, len, scrollToIndex]);

  const commitIndex = useCallback(
    (index, fromTap = false, syncScroll = false) => {
      if (index < 0) index = 0;
      if (index >= len) index = len - 1;

      if (syncScroll) {
        scrollToIndex(index, true);
      }

      setCurrentIndex(index);
      lastIndexRef.current = index;

      if (index !== committedIndexRef.current) {
        committedIndexRef.current = index;
        onChange?.(index, fromTap);
      }
    },
    [len, onChange, scrollToIndex],
  );

  const handleMomentumEnd = (e) => {
    isDraggingRef.current = false;
    const offsetY = e.nativeEvent.contentOffset.y;
    let index = Math.round(offsetY / itemHeight);
    index = Math.min(Math.max(0, index), len - 1);
    index = clampIndexByFling(index);
    commitIndex(index, false, false);
  };

  const handleScrollEndDrag = (e) => {
    const v = e.nativeEvent.velocity;
    const vy =
      v != null && typeof v === 'object' && 'y' in v
        ? v.y
        : typeof v === 'number'
          ? v
          : 0;

    if (Platform.OS === 'ios' && Math.abs(vy) > 0.15) {
      return;
    }

    if (Platform.OS === 'android' && Math.abs(vy) > 0.2) {
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = false;
    const offsetY = e.nativeEvent.contentOffset.y;
    let index = Math.round(offsetY / itemHeight);
    index = Math.min(Math.max(0, index), len - 1);
    index = clampIndexByFling(index);

    const needsSnap =
      Platform.OS === 'android' && Math.abs(offsetY - index * itemHeight) > 1;
    commitIndex(index, false, needsSnap);
  };

  const handleScrollBeginDrag = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleScroll = useCallback(
    (e) => {
      if (!len) return;
      const offsetY = e.nativeEvent.contentOffset.y;
      const idx = Math.round(offsetY / itemHeight);
      if (idx >= 0 && idx < len) {
        setCurrentIndex((prev) => (prev !== idx ? idx : prev));
      }
    },
    [len, itemHeight],
  );

  if (!len) {
    return <View style={{ width, height: itemHeight * visibleItems }} />;
  }

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
        contentContainerStyle={{ paddingTop: spacerHeight, paddingBottom: spacerHeight }}
        scrollEventThrottle={16}
        nestedScrollEnabled
        bounces={false}
        removeClippedSubviews={false}
        pagingEnabled={false}
        directionalLockEnabled
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
      >
        {data.map((item, idx) => {
          const isSelected = idx === currentIndex;
          return (
            <Pressable
              key={idx}
              delayPressIn={delayPressIn}
              onPress={() => commitIndex(idx, true, true)}
              style={({ pressed }) => [
                {
                  height: itemHeight,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.itemText,
                  textStyle,
                  isSelected && styles.selectedText,
                  isSelected && selectedTextStyle,
                ]}
              >
                {item}
              </Text>
            </Pressable>
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
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#514134',
  },
});

export default WheelPicker;

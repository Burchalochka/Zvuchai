import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { FONTS } from '../../styles/theme';

const SWIPE_THRESHOLD = 80;
const SWIPE_AUTO_THRESHOLD = 220;

const SwipeableTaskItem = ({ task, onToggle, onDeleteRequest, onRescheduleRequest }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [openSide, setOpenSide] = useState(null); // null | 'left' | 'right'

  // Фони та іконки плавно з'являються під час свайпу
  const leftOpacity = translateX.interpolate({
    inputRange: [0, 30],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const rightOpacity = translateX.interpolate({
    inputRange: [-30, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 5 && Math.abs(g.dy) < 15,
      onPanResponderGrant: () => {
        // Якщо кнопка відкрита і юзер почав новий свайп — ховаємо оверлей
        setOpenSide(null);
        translateX.stopAnimation((val) => {
          translateX.setOffset(val);
          translateX.setValue(0);
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        const dx = g.dx;

        if (dx < -SWIPE_AUTO_THRESHOLD) {
          resetPosition();
          onDeleteRequest(task);
          return;
        }
        if (dx > SWIPE_AUTO_THRESHOLD) {
          resetPosition();
          onRescheduleRequest(task);
          return;
        }
        if (dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: -90, useNativeDriver: false }).start();
          setOpenSide('right');
          return;
        }
        if (dx > SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: 90, useNativeDriver: false }).start();
          setOpenSide('left');
          return;
        }
        resetPosition();
      },
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        resetPosition();
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
    setOpenSide(null);
  };

  const handleDeletePress = () => {
    resetPosition();
    onDeleteRequest(task);
  };

  const handleReschedulePress = () => {
    resetPosition();
    onRescheduleRequest(task);
  };

  const isCompleted = task.status === 'completed';
  const manualOverride = task?.autoDoneOverride;
  const isVisuallyCompleted =
    manualOverride === 'pending'
      ? false
      : manualOverride === 'completed'
        ? true
        : isCompleted;
  const firstTag = Array.isArray(task.tags) && task.tags.length > 0 ? task.tags[0] : null;

  return (
    <View style={styles.wrapper}>

      {/* Лівий фон (синій) — іконка ЗАВЖДИ рендериться, opacity анімована */}
      <Animated.View
        style={[styles.bgLeft, { opacity: leftOpacity }]}
        pointerEvents="none"
      >
        <Icon name="calendar-outline" size={22} color="#FFFFFF" />
      </Animated.View>

      {/* Правий фон (червоний) — іконка ЗАВЖДИ рендериться, opacity анімована */}
      <Animated.View
        style={[styles.bgRight, { opacity: rightOpacity }]}
        pointerEvents="none"
      >
        <Icon name="trash-outline" size={22} color="#FFFFFF" />
      </Animated.View>

      {/* Картка */}
      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => onToggle(task.id, !isVisuallyCompleted, task)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          {isVisuallyCompleted ? (
            <View style={styles.checkboxFilled}>
              <Icon name="checkmark" size={16} color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.checkboxEmpty} />
          )}
        </TouchableOpacity>

        <View style={styles.textBlock}>
          <Text style={[styles.title, isVisuallyCompleted && styles.titleDone]} numberOfLines={1}>
            {task.title}
          </Text>
          {task.startTime || task.endTime ? (
            <Text style={styles.time}>
              {task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}
            </Text>
          ) : null}
        </View>

        {firstTag ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{firstTag}</Text>
          </View>
        ) : null}
      </Animated.View>

      {/* Невидимий оверлей для тапу — з'являється ТІЛЬКИ після відпускання */}
      {openSide === 'left' && (
        <TouchableOpacity
          style={styles.overlayLeft}
          onPress={handleReschedulePress}
          activeOpacity={1}
        />
      )}
      {openSide === 'right' && (
        <TouchableOpacity
          style={styles.overlayRight}
          onPress={handleDeletePress}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
    borderRadius: 18,
  },

  bgLeft: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#4A90D9',
    borderRadius: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 28,
  },
  bgRight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#E57373',
    borderRadius: 18,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 28,
  },

  // Невидимі зони тапу поверх картки — тільки коли кнопка відкрита
  overlayLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 90,
  },
  overlayRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 90,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F4F3',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#AFA49B',
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxEmpty: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C5BAA8',
    backgroundColor: 'transparent',
  },
  checkboxFilled: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.md,
    color: '#2C1A00',
    fontFamily: 'Montserrat-SemiBold',
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: '#A89880',
  },
  time: {
    fontSize: FONTS.sizes.xs,
    color: '#8A7A6A',
    fontFamily: 'Montserrat-Regular',
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Montserrat-Medium',
  },
});

export default SwipeableTaskItem;
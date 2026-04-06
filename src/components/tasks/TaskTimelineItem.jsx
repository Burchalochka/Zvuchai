import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONTS } from '../../styles/theme';
import {
  TIMELINE_HORIZONTAL_RHYTHM_PX,
  TIMELINE_RAIL_STROKE_WIDTH_PX,
  TIMELINE_RAIL_VIEW_LINE_PX,
  TIMELINE_HOUR_LABEL_WIDTH_PX,
  TIMELINE_RAIL_SIDE_GUTTER_PX,
  TIMELINE_RAIL_STROKE,
  TIMELINE_RAIL_AXIS_STROKE,
} from '../../constants/timelineLayout';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

function TaskListConnectorLine() {
  const [h, setH] = useState(1);
  const w = TIMELINE_RAIL_VIEW_LINE_PX;
  const cx = w / 2;
  return (
    <View
      style={styles.connectorLine}
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.height);
        if (next > 0) setH(next);
      }}
    >
      {h > 0 ? (
        <Svg width={w} height={h}>
          <Line
            x1={cx}
            y1={0}
            x2={cx}
            y2={h}
            stroke={TIMELINE_RAIL_AXIS_STROKE}
            strokeWidth={TIMELINE_RAIL_STROKE_WIDTH_PX}
            strokeLinecap="butt"
          />
        </Svg>
      ) : null}
    </View>
  );
}

const TaskTimelineItem = ({
  task,
  selected,
  onToggleComplete,
  onOpenActions,
  onPressOpenEdit,
  onLongPressCard,
}) => {
  const { language } = useLanguage();

  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
      return { hours: 0, minutes: 0 };
    }
    const [hours, minutes] = timeStr.split(':');
    return {
      hours: parseInt(String(hours).trim(), 10),
      minutes: parseInt(String(minutes).trim(), 10),
    };
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const startTime = parseTime(start);
    const endTime = parseTime(end);
    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;
    const durationMinutes = endMinutes - startMinutes;
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} ${getTranslation('minutes', language)}`;
    } else if (minutes === 0) {
      return `${hours} ${getTranslation('hours', language)}`;
    } else {
      return `${hours} ${getTranslation('hoursMinutes', language)} ${minutes} ${getTranslation('minutes', language)}`;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
      return timeStr ? String(timeStr) : '--:--';
    }
    const [hRaw, mRaw] = timeStr.split(':');
    const h = Number(String(hRaw).trim());
    const m = Number(String(mRaw).trim());
    if (!Number.isFinite(h) || !Number.isFinite(m)) return String(timeStr);
    const hh = Math.max(0, Math.min(23, h));
    const mm = Math.max(0, Math.min(59, m));
    return `${hh}:${String(mm).padStart(2, '0')}`;
  };

  if (!task) return null;
  const isCompleted = task.status === 'completed';
  const manualOverride = task?.autoDoneOverride;
  const isVisuallyCompleted =
    manualOverride === 'pending'
      ? false
      : manualOverride === 'completed'
        ? true
        : isCompleted;
  const duration = calculateDuration(task.startTime, task.endTime);

  return (
    <View style={styles.container}>
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{formatTime(task.startTime)}</Text>
      </View>
      <View style={styles.contentColumn}>
        <TaskListConnectorLine />
        <View style={[styles.taskCard, isVisuallyCompleted && styles.taskCardCompleted, selected && styles.taskCardSelected]}>
          <View style={styles.taskContent}>
            <TouchableOpacity
              style={styles.taskLeftTouchable}
              activeOpacity={0.88}
              onPress={() => onPressOpenEdit?.(task)}
              onLongPress={() => onLongPressCard?.(task)}
              disabled={!onPressOpenEdit && !onLongPressCard}
            >
              <View style={styles.taskLeft}>
                <View style={[styles.taskIconContainer, isCompleted && styles.taskIconContainerCompleted, selected && styles.taskIconContainerSelected]}>
                  <Icon
                    name="people"
                    size={18}
                    color={selected ? '#FFFFFF' : (isVisuallyCompleted ? COLORS.primaryStrong : COLORS.textSecondary)}
                  />
                </View>
                <View style={styles.taskInfo}>
                  <Text
                    style={[styles.taskTitle, isVisuallyCompleted && styles.taskTitleCompleted, selected && styles.taskTitleSelected]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {task.title}
                  </Text>
                  <Text
                    style={[styles.taskTime, selected && styles.taskTimeSelected]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatTime(task.startTime)}-{formatTime(task.endTime)}
                    {duration ? ` (${duration})` : ''}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionsBtn}
              onPress={(e) => {
                e?.stopPropagation?.();
                onOpenActions?.(task);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name="ellipsis-vertical"
                size={18}
                color={selected ? '#FFFFFF' : COLORS.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={(e) => { e?.stopPropagation?.(); onToggleComplete(task.id, !isVisuallyCompleted, task); }}
              activeOpacity={0.7}
            >
              {isVisuallyCompleted ? (
                <Icon name="checkmark-circle" size={24} color={selected ? '#FFFFFF' : COLORS.primaryDark} />
              ) : (
                <Icon name="ellipse-outline" size={24} color={selected ? '#FFFFFF' : COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: TIMELINE_HORIZONTAL_RHYTHM_PX * 2,
    paddingRight: TIMELINE_HORIZONTAL_RHYTHM_PX * 2,
  },
  timeColumn: {
    width: TIMELINE_HOUR_LABEL_WIDTH_PX + TIMELINE_RAIL_SIDE_GUTTER_PX,
    paddingRight: 0,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Montserrat-Medium',
    marginTop: 4,
  },
  contentColumn: {
    flex: 1,
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: -(TIMELINE_HORIZONTAL_RHYTHM_PX * 2),
    width: TIMELINE_RAIL_VIEW_LINE_PX,
    overflow: 'hidden',
  },
  taskCard: {
    backgroundColor: '#FAF9F9',
    borderRadius: 20,
    padding: TIMELINE_HORIZONTAL_RHYTHM_PX,
    marginLeft: TIMELINE_RAIL_SIDE_GUTTER_PX,
    marginBottom: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  taskCardSelected: {
    backgroundColor: COLORS.accentBrown,
    opacity: 1,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskLeftTouchable: {
    flex: 1,
    minWidth: 0,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  taskIconContainerCompleted: {
    backgroundColor: COLORS.primaryStrong,
  },
  taskIconContainerSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  taskInfo: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
    marginBottom: SPACING.xs,
    flexShrink: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskTitleSelected: {
    color: '#FFFFFF',
  },
  taskTime: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Montserrat-Regular',
  },
  taskTimeSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  checkbox: {
    marginLeft: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  actionsBtn: {
    marginLeft: TIMELINE_HORIZONTAL_RHYTHM_PX,
    padding: TIMELINE_HORIZONTAL_RHYTHM_PX / 2,
    borderRadius: 999,
  },
});

export default TaskTimelineItem;


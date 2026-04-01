import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONTS } from '../../styles/theme';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const TaskTimelineItem = ({ task, selected, onToggleComplete, onOpenActions }) => {
  const { language } = useLanguage();
  
  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
      return { hours: 0, minutes: 0 };
    }
    const [hours, minutes] = timeStr.split(':');
    return { hours: parseInt(hours), minutes: parseInt(minutes) };
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
    return timeStr || '--:--';
  };

  if (!task) return null;
  const isCompleted = task.status === 'completed';
  const duration = calculateDuration(task.startTime, task.endTime);

  return (
    <View style={styles.container}>
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{formatTime(task.startTime)}</Text>
      </View>
      <View style={styles.contentColumn}>
        <View style={styles.connectorLine} />
        <View style={[styles.taskCard, isCompleted && styles.taskCardCompleted, selected && styles.taskCardSelected]}>
          <View style={styles.taskContent}>
            <View style={styles.taskLeft}>
              <View style={[styles.taskIconContainer, isCompleted && styles.taskIconContainerCompleted, selected && styles.taskIconContainerSelected]}>
                <Icon
                  name="people"
                  size={18}
                  color={selected ? '#FFFFFF' : (isCompleted ? COLORS.primaryStrong : COLORS.textSecondary)}
                />
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted, selected && styles.taskTitleSelected]}>
                  {task.title}
                </Text>
                <Text style={[styles.taskTime, selected && styles.taskTimeSelected]}>
                  {formatTime(task.startTime)}-{formatTime(task.endTime)}
                  {duration ? ` (${duration})` : ''}
                </Text>
              </View>
            </View>
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
              onPress={(e) => { e?.stopPropagation?.(); onToggleComplete(task.id); }}
              activeOpacity={0.7}
            >
              {isCompleted ? (
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
    marginBottom: SPACING.md,
    paddingRight: SPACING.md,
  },
  timeColumn: {
    width: 60,
    paddingRight: SPACING.sm,
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
    bottom: -SPACING.md,
    width: 2,
    backgroundColor: COLORS.border,
  },
  taskCard: {
    backgroundColor: '#FAF9F9',
    borderRadius: 20,
    padding: SPACING.md,
    marginLeft: SPACING.md,
    marginBottom: SPACING.sm,
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
    marginRight: SPACING.sm,
  },
  taskIconContainerCompleted: {
    backgroundColor: COLORS.primaryStrong,
  },
  taskIconContainerSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
    marginBottom: SPACING.xs,
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
    marginLeft: SPACING.sm,
  },
  actionsBtn: {
    marginLeft: SPACING.sm,
    padding: 4,
    borderRadius: 999,
  },
});

export default TaskTimelineItem;


import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONTS } from '../../styles/theme';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const TaskTimelineItem = ({ task, onToggleComplete }) => {
  const { language } = useLanguage();
  
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    return { hours: parseInt(hours), minutes: parseInt(minutes) };
  };

  const calculateDuration = (start, end) => {
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
    return timeStr;
  };

  const duration = calculateDuration(task.startTime, task.endTime);

  return (
    <View style={styles.container}>
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{formatTime(task.startTime)}</Text>
      </View>
      <View style={styles.contentColumn}>
        <View style={styles.connectorLine} />
        <View style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
          <View style={styles.taskContent}>
            <View style={styles.taskLeft}>
              <View style={[styles.taskIconContainer, task.completed && styles.taskIconContainerCompleted]}>
                <Icon 
                  name="people" 
                  size={18} 
                  color={task.completed ? COLORS.primaryStrong : COLORS.textSecondary} 
                />
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                  {task.title}
                </Text>
                <Text style={styles.taskTime}>
                  {formatTime(task.startTime)}-{formatTime(task.endTime)} ({duration})
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => onToggleComplete(task.id)}
              activeOpacity={0.7}
            >
              {task.completed ? (
                <Icon name="checkmark-circle" size={24} color="#000000" />
              ) : (
                <Icon name="ellipse-outline" size={24} color={COLORS.textSecondary} />
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
    backgroundColor: COLORS.grayLight,
    borderRadius: 20,
    padding: SPACING.md,
    marginLeft: SPACING.md,
    marginBottom: SPACING.sm,
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
  taskTime: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Montserrat-Regular',
  },
  checkbox: {
    marginLeft: SPACING.sm,
  },
});

export default TaskTimelineItem;


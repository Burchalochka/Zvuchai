import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../styles/theme';

export default function FlexibleTaskItem({
  task,
  onPress,
  onLongPress,
  onToggleComplete,
  onOpenActions,
}) {
  const isCompleted = task?.status === 'completed';
  const dueLabel = task?.endTime ? `До ${task.endTime}` : null;

  return (
    <View style={[styles.container, isCompleted && styles.containerCompleted]}>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        delayLongPress={300}
      >
        <TouchableOpacity
          style={styles.checkboxHit}
          onPress={() => onToggleComplete?.(task.id, !isCompleted)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
            {isCompleted ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <Text
          style={[styles.title, isCompleted && styles.titleCompleted]}
          numberOfLines={2}
        >
          {task?.title ?? ''}
        </Text>

        {dueLabel ? (
          <Text style={styles.due}>{dueLabel}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => onOpenActions?.(task)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>•••</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      <View style={styles.separator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  containerCompleted: {
    opacity: 0.55,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.md,
  },
  checkboxHit: {
    marginRight: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  title: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  due: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.sm,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  menuBtn: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  menuIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    fontFamily: FONTS.medium,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTasks } from '../context/TasksContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomTimePicker from '../components/common/CustomTimePicker';
import { COLORS, FONTS, SPACING, RADIUS } from '../styles/theme';

// Helper to parse "HH:MM" into total minutes
const parseHHmm = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return NaN;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return NaN;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return NaN;
  }
  return hours * 60 + minutes;
};

const EditTaskScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { task } = route.params || {};
  const { updateTask, deleteTask } = useTasks();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState(null); // string "HH:MM" or null
  const [endTime, setEndTime] = useState(null);     // string "HH:MM" or null
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');

  // Initialize form with task data
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setTag(task.tags?.[0] || '');
      
      // Determine if task has deadline based on date field
      const hasDate = !!task.date;
      setHasDeadline(hasDate);
      
      if (hasDate) {
        setSelectedDate(task.date);
        // Normalize time strings
        const normalizeTime = (value) => {
          if (!value) return null;
          if (typeof value === 'string') return value;
          if (value instanceof Date) {
            return value.toLocaleTimeString('uk-UA', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
          }
          return null;
        };
        if (task.startTime) {
          setStartTime(normalizeTime(task.startTime));
        }
        if (task.endTime) {
          setEndTime(normalizeTime(task.endTime));
        }
      }
      if (task.estimatedDuration && task.estimatedDuration > 0) {
        setDurationHours(String(Math.floor(task.estimatedDuration / 60)));
        setDurationMinutes(String(task.estimatedDuration % 60));
      }
    }
  }, [task]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Не вибрано';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle date change
  const handleDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected.toISOString().split('T')[0]);
    }
  };

  // Clear start time
  const clearStartTime = () => {
    setStartTime(null);
    setEndTime(null); // Clear end time too when start is cleared
  };

  // Clear end time
  const clearEndTime = () => {
    setEndTime(null);
  };

  // Validate form
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Помилка', 'Введіть назву завдання');
      return false;
    }

    if (hasDeadline && !selectedDate) {
      Alert.alert('Помилка', 'Оберіть дату');
      return false;
    }

    // Time validation for timeline tasks
    if (hasDeadline && selectedDate && startTime) {
      const startMinutes = parseHHmm(startTime);
      if (isNaN(startMinutes)) {
        Alert.alert('Помилка', 'Невірний формат початкового часу');
        return false;
      }

      // If endTime provided, validate it's after startTime
      if (endTime) {
        const endMinutes = parseHHmm(endTime);
        if (isNaN(endMinutes)) {
          Alert.alert('Помилка', 'Невірний формат кінцевого часу');
          return false;
        }
        if (endMinutes <= startMinutes) {
          Alert.alert('Помилка', 'Кінцевий час повинен бути пізніше початкового');
          return false;
        }
      }
    }

    return true;
  };

  const computedEstimatedDuration = (() => {
    const h = parseInt(durationHours, 10);
    const m = parseInt(durationMinutes, 10);
    const total = (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
    return total > 0 ? total : null;
  })();

  // Format updated task object
  const formatUpdatedTask = () => {
    const baseTask = {
      id: task.id,
      title: title.trim(),
      description: description.trim(),
      tags: tag.trim() ? [tag.trim()] : [],
      estimatedDuration: computedEstimatedDuration,
      updatedAt: new Date().toISOString(),
    };

    // Scenario A: Inbox task (no deadline)
    if (!hasDeadline) {
      return {
        ...baseTask,
        date: null,
        startTime: null,
        endTime: null,
        deadline: null,
        isInbox: true,
      };
    }

    // Scenario B: Flexible/Inbox (has date but no start time)
    if (hasDeadline && selectedDate && !startTime) {
      return {
        ...baseTask,
        date: selectedDate,
        startTime: null,
        endTime: null,
        isInbox: false,
        deadline: null,
      };
    }

    // Scenario C: Timeline task (has date and start time)
    if (hasDeadline && selectedDate && startTime) {
      let formattedEndTime = null;
      if (endTime) {
        formattedEndTime = endTime;
      } else {
        // Calculate end time as start time + 1 hour
        const [hours, minutes] = startTime.split(':').map(Number);
        let endHour = hours + 1;
        if (endHour >= 24) endHour = 0;
        formattedEndTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }

      return {
        ...baseTask,
        date: selectedDate,
        startTime: startTime,
        endTime: formattedEndTime,
        isInbox: false,
        deadline: `${selectedDate} ${formattedEndTime}`,
      };
    }

    return baseTask;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) return;

    const updatedTask = formatUpdatedTask();
    updateTask(task.id, updatedTask);
    
    // CRITICAL CALLBACK
    if (route.params?.onSave) {
      route.params.onSave(updatedTask);
    }
    
    navigation.goBack();
  };

  // Handle delete
  const handleDelete = () => {
    Alert.alert(
      'Видалити завдання',
      'Ви впевнені, що хочете видалити це завдання?',
      [
        { text: 'Скасувати', style: 'cancel' },
        { 
          text: 'Видалити', 
          style: 'destructive',
          onPress: () => {
            deleteTask(task.id);
            navigation.goBack();
          }
        },
      ]
    );
  };

  // Handle cancel
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Редагувати завдання</Text>
        </View>

        {/* Title Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Назва *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Введіть назву завдання"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {/* Description Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Опис</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Додайте опис (необов'язково)"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Tag Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Тег</Text>
          <TextInput
            style={styles.input}
            value={tag}
            onChangeText={setTag}
            placeholder="Додайте тег (необов'язково)"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {/* Deadline Toggle - Tab Switcher */}
        <View style={styles.toggleSection}>
          <Text style={styles.toggleLabel}>Задача з дедлайном / розкладом?</Text>
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                !hasDeadline && styles.tabButtonActive,
                styles.tabButtonLeft
              ]}
              onPress={() => setHasDeadline(false)}
            >
              <Text style={[
                styles.tabButtonText,
                !hasDeadline && styles.tabButtonTextActive
              ]}>
                Без дедлайну
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                hasDeadline && styles.tabButtonActive,
                styles.tabButtonRight
              ]}
              onPress={() => setHasDeadline(true)}
            >
              <Text style={[
                styles.tabButtonText,
                hasDeadline && styles.tabButtonTextActive
              ]}>
                З дедлайном
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conditional Date/Time Picker */}
        {hasDeadline && (
          <View style={styles.dateTimeSection}>
            {/* Date Picker */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Дата</Text>
              <TouchableOpacity
                style={styles.dateDisplay}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {selectedDate ? formatDate(selectedDate) : 'Оберіть дату'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate ? new Date(selectedDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  locale="uk-UA"
                />
              )}
            </View>

            {/* Time Pickers */}
            <View style={styles.timeSection}>
              <Text style={styles.label}>Час</Text>
              
              <View style={styles.timePickersRow}>
                {/* Start Time Picker */}
                <View style={styles.timePickerContainer}>
                  <Text style={styles.timeLabel}>Початок</Text>
                  <CustomTimePicker
                    value={startTime}
                    onChange={setStartTime}
                  />
                  {startTime && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={clearStartTime}
                    >
                      <Text style={styles.clearButtonText}>Очистити</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* End Time Picker */}
                <View style={styles.timePickerContainer}>
                  <Text style={styles.timeLabel}>Кінець</Text>
                  <CustomTimePicker
                    value={endTime}
                    onChange={setEndTime}
                  />
                  {endTime && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={clearEndTime}
                    >
                      <Text style={styles.clearButtonText}>Очистити</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Estimated Duration */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Тривалість (необов'язково)</Text>
          <View style={styles.durationRow}>
            <View style={styles.durationField}>
              <TextInput
                style={styles.durationInput}
                value={durationHours}
                onChangeText={(v) => setDurationHours(v.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.durationUnit}>год</Text>
            </View>
            <View style={styles.durationField}>
              <TextInput
                style={styles.durationInput}
                value={durationMinutes}
                onChangeText={(v) => setDurationMinutes(v.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.durationUnit}>хв</Text>
            </View>
            {computedEstimatedDuration ? (
              <Text style={styles.durationPreview}>
                {(() => {
                  const h = Math.floor(computedEstimatedDuration / 60);
                  const m = computedEstimatedDuration % 60;
                  if (h > 0 && m > 0) return `${h} год ${m} хв`;
                  if (h > 0) return `${h} год`;
                  return `${m} хв`;
                })()}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Action Row */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Скасувати</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Видалити</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Готово</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.panelLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  toggleSection: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  toggleLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.grayLight,
    borderRadius: 20,
    padding: 2,
    height: 44,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  tabButtonLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  tabButtonRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  tabButtonActive: {
    backgroundColor: COLORS.accentBrown,
  },
  tabButtonText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.accentBrown,
  },
  tabButtonTextActive: {
    color: COLORS.background,
  },
  dateTimeSection: {
    backgroundColor: COLORS.panel,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  dateDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.panelLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dateText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  timeSection: {
    marginTop: SPACING.md,
  },
  timePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  timePickerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  clearButton: {
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.grayLight,
    borderRadius: RADIUS.sm,
  },
  clearButtonText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  durationField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.panelLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  durationInput: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    minWidth: 32,
    textAlign: 'center',
    padding: 0,
  },
  durationUnit: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  durationPreview: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.error,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.secondary,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.background,
  },
});

export default EditTaskScreen;
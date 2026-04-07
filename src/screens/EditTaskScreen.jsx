import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTasks } from '../context/TasksContext';
import Calendar from '../components/calendar/Calendar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, FONTS, SPACING, RADIUS } from '../styles/theme';

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
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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
        if (task.startTime) {
          // Parse time string to Date object
          const [hours, minutes] = task.startTime.split(':').map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          setStartTime(startDate);
        }
        if (task.endTime) {
          const [hours, minutes] = task.endTime.split(':').map(Number);
          const endDate = new Date();
          endDate.setHours(hours, minutes, 0, 0);
          setEndTime(endDate);
        }
      }
    }
  }, [task]);

  // Format time for display
  const formatTime = (time) => {
    if (!time) return 'Не вибрано';
    if (typeof time === 'string') return time;
    if (time instanceof Date) {
      return time.toLocaleTimeString('uk-UA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    return 'Не вибрано';
  };

  // Handle start time change
  const handleStartTimeChange = (event, selected) => {
    setShowStartTimePicker(false);
    if (selected) {
      setStartTime(selected);
      // If end time is not set, set it to 1 hour later
      if (!endTime) {
        const end = new Date(selected);
        end.setHours(end.getHours() + 1);
        setEndTime(end);
      }
    }
  };

  // Handle end time change
  const handleEndTimeChange = (event, selected) => {
    setShowEndTimePicker(false);
    if (selected) {
      setEndTime(selected);
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

    return true;
  };

  // Format updated task object based on business logic
  const formatUpdatedTask = () => {
    const baseTask = {
      id: task.id,
      title: title.trim(),
      description: description.trim(),
      tags: tag.trim() ? [tag.trim()] : [],
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
      const formattedStartTime = formatTime(startTime);
      let formattedEndTime = null;
      
      if (endTime) {
        formattedEndTime = formatTime(endTime);
      } else {
        // Calculate end time as start time + 1 hour
        const end = new Date(startTime);
        end.setHours(end.getHours() + 1);
        formattedEndTime = formatTime(end);
      }

      return {
        ...baseTask,
        date: selectedDate,
        startTime: formattedStartTime,
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

        {/* Deadline Toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Задача з дедлайном / розкладом?</Text>
            <Switch
              value={hasDeadline}
              onValueChange={setHasDeadline}
              trackColor={{ false: COLORS.grayLight, true: COLORS.secondary }}
              thumbColor={hasDeadline ? COLORS.primaryDark : COLORS.gray}
            />
          </View>
        </View>

        {/* Conditional Date/Time Picker */}
        {hasDeadline && (
          <View style={styles.dateTimeSection}>
            {/* Date Picker */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Дата *</Text>
              <View style={styles.dateDisplay}>
                <Text style={styles.dateText}>
                  {selectedDate ? formatDate(selectedDate) : 'Оберіть дату'}
                </Text>
                <Calendar
                  onDateSelect={(date) => setSelectedDate(date)}
                  initialDate={selectedDate}
                  mode="picker"
                />
              </View>
            </View>

            {/* Time Pickers */}
            <View style={styles.timeSection}>
              <Text style={styles.label}>Час</Text>
              
              {/* Start Time */}
              <View style={styles.timeRow}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Початок</Text>
                  <View style={styles.timePickerRow}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowStartTimePicker(true)}
                    >
                      <Text style={styles.timeButtonText}>
                        {formatTime(startTime)}
                      </Text>
                    </TouchableOpacity>
                    {startTime && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearStartTime}
                      >
                        <Text style={styles.clearButtonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Spacer */}
                <View style={styles.timeSpacer} />

                {/* End Time */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Кінець</Text>
                  <View style={styles.timePickerRow}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowEndTimePicker(true)}
                      disabled={!startTime}
                    >
                      <Text style={[
                        styles.timeButtonText,
                        !startTime && styles.disabledText
                      ]}>
                        {formatTime(endTime)}
                      </Text>
                    </TouchableOpacity>
                    {endTime && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearEndTime}
                      >
                        <Text style={styles.clearButtonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Time Pickers Modals */}
              {showStartTimePicker && (
                <DateTimePicker
                  value={startTime || new Date()}
                  mode="time"
                  display="spinner"
                  onChange={handleStartTimeChange}
                  locale="uk-UA"
                />
              )}

              {showEndTimePicker && (
                <DateTimePicker
                  value={endTime || new Date()}
                  mode="time"
                  display="spinner"
                  onChange={handleEndTimeChange}
                  locale="uk-UA"
                />
              )}
            </View>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Action Row */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Видалити</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Скасувати</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Зберегти</Text>
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.md,
  },
  dateTimeSection: {
    backgroundColor: COLORS.panel,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
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
    marginTop: SPACING.lg,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeColumn: {
    flex: 1,
  },
  timeSpacer: {
    width: SPACING.xl,
  },
  timeLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeButton: {
    flex: 1,
    backgroundColor: COLORS.panelLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
  },
  timeButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'center',
  },
  disabledText: {
    color: COLORS.textSecondary,
    opacity: 0.5,
  },
  clearButton: {
    marginLeft: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
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
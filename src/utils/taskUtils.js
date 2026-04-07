/**
 * Task-related utility functions extracted from MicrophoneScreen.jsx
 * Following SOLID principles - single responsibility for task logic
 */

/**
 * Parses "HH:mm" string to minutes since midnight
 * Note: This function is also available in timeUtils.ts
 */
export const parseHHmm = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Checks if a new task conflicts with existing tasks based on time overlap.
 * @param {Object} newTask - The new task with startTime, endTime, and date properties
 * @param {Array} existingTasks - Array of existing tasks
 * @returns {Object|null} - Returns conflicting task if found, null otherwise
 */
export const checkTimeConflict = (newTask, existingTasks) => {
  if (!newTask.startTime || !newTask.endTime || !newTask.date) {
    return null; // No time specified, no conflict
  }

  const newStart = parseHHmm(newTask.startTime);
  const newEnd = parseHHmm(newTask.endTime);
  const newDate = newTask.date;

  for (const existing of existingTasks) {
    // Skip tasks without time or on different dates
    if (!existing.startTime || !existing.endTime || existing.date !== newDate) {
      continue;
    }

    const existingStart = parseHHmm(existing.startTime);
    const existingEnd = parseHHmm(existing.endTime);

    // Check for overlap (half-open interval: [start, end))
    if (newStart < existingEnd && newEnd > existingStart) {
      return existing; // Conflict found
    }
  }

  return null; // No conflict
};

/**
 * Formats date from YYYY-MM-DD to DD.MM.YYYY
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
};

/**
 * Helper function to format time as HH:MM
 */
export const formatTime = (hours, minutes) => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Helper function to parse HH:MM string to minutes
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Calculates start time 1 hour before deadline
 * @param {string} deadlineStr - Format: "YYYY-MM-DD HH:MM"
 * @returns {string|null} - Start time as "HH:MM" or null
 */
export const calculateStartTimeFromDeadline = (deadlineStr) => {
  if (!deadlineStr) return null;
  // Parse deadline format: "YYYY-MM-DD HH:MM"
  const [datePart, timePart] = deadlineStr.split(' ');
  // We parse date part but don't need it for time calculation
  const [_year, _month, _day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  // Calculate 1 hour before
  let totalMinutes = hour * 60 + minute;
  totalMinutes -= 60; // 1 hour before
  
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Wrap to previous day
  }
  
  const startHour = Math.floor(totalMinutes / 60);
  const startMinute = totalMinutes % 60;
  return formatTime(startHour, startMinute);
};

/**
 * Processes backend task response to create a properly formatted task object
 * Implements the 4 strict task classification rules:
 * 1. Global Inbox - backend sets isInbox: true and null times
 * 2. Flexible/Anytime Task - backend sets isInbox: false but startTime/endTime as null
 * 3. All-Day Task - backend sets startTime: "07:00", endTime: "21:00", isInbox: false
 * 4. Deadline Task - backend provides deadline, we calculate startTime as 1 hour before
 * 
 * @param {Object} backendTask - Task object from backend response
 * @param {string} audioUri - URI of the recorded audio file
 * @returns {Object} - Formatted task object ready for state
 */
export const processBackendTaskResponse = (backendTask, audioUri) => {
  // Get fields from backend response
  let finalDate = backendTask.date || null;
  let finalStartDate = backendTask.startDate || null;
  let finalEndDate = backendTask.endDate || null;
  let finalStartTime = backendTask.startTime || null;
  let finalEndTime = backendTask.endTime || null;
  let finalDeadline = backendTask.deadline || null;
  let isInbox = backendTask.isInbox === true;
  
  // Handle deadline tasks: if deadline exists but startTime is null, calculate it
  if (finalDeadline && !finalStartTime) {
    // Calculate startTime as 1 hour before deadline
    finalStartTime = calculateStartTimeFromDeadline(finalDeadline);
    if (finalStartTime) {
      // Parse deadline time for endTime
      const [datePart, timePart] = finalDeadline.split(' ');
      if (timePart) {
        finalEndTime = timePart; // End time is the deadline time
      }
    }
    isInbox = false; // Deadline tasks are not inbox
  }
  
  // Handle missing endTime for regular timed tasks (not deadline)
  if (finalStartTime && !finalEndTime && !finalDeadline) {
    const startMinutes = parseTimeToMinutes(finalStartTime);
    if (startMinutes !== null) {
      const endMinutes = startMinutes + 60;
      const endHour = Math.floor(endMinutes / 60) % 24;
      const endMinute = endMinutes % 60;
      finalEndTime = formatTime(endHour, endMinute);
    }
  }
  
  // Handle date ranges: if we have startDate/endDate but no single date
  if (finalStartDate && finalEndDate && !finalDate) {
    // For date range tasks, use startDate as the primary date for display
    finalDate = finalStartDate;
  }
  
  // IMPORTANT: Do NOT override backend's isInbox classification
  // The backend now correctly classifies tasks according to the 4 rules
  // Flexible tasks (date but no time) will have isInbox: false, startTime: null, endTime: null
  // All-day tasks will have isInbox: false, startTime: "07:00", endTime: "21:00"
  // This is correct and should be preserved

  return {
    id: `voice-${Date.now()}`,
    type: 'task',
    title: backendTask.title || 'Без назви',
    description: backendTask.description || '',
    date: finalDate,
    startDate: finalStartDate,  // New field for date ranges
    endDate: finalEndDate,      // New field for date ranges
    startTime: finalStartTime,
    endTime: finalEndTime,
    status: 'pending',
    themeColor: '#4A90E2',
    priority: 'medium',
    difficulty: 'medium',
    estimatedDuration: backendTask.estimatedDuration || 60,
    dueDate: null,
    deadline: finalDeadline,
    isInbox: isInbox,  // Include isInbox flag
    tags: backendTask.tags || [],
    reminder: {
      mode: 'before_start',
      minutesBefore: 15,
      time: null,
      recurrent: false,
      enabled: false,
    },
    linkedGoalId: null,
    voiceNote: audioUri,
    completedAt: null,
    archived: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Gets display text for task time based on task classification rules
 * @param {Object} task - Task object
 * @returns {string} - Display text for time
 */
export const getTaskTimeDisplay = (task) => {
  // Rule 1: Global Inbox - hide time (show empty or specific text)
  if (task.isInbox) {
    return '—';
  }
  
  // Rule 4: All-Day Task (startTime is 07:00 and endTime is 21:00)
  if (task.startTime === '07:00' && task.endTime === '21:00') {
    return 'Цілий день';
  }
  
  // Rule 3: Deadline Task
  if (task.deadline) {
    const timePart = task.deadline.split(' ')[1];
    return `Дедлайн: ${timePart}`;
  }
  
  // Rule 2: Flexible/Anytime Task (date exists but no time)
  if (task.date && !task.startTime && !task.endTime) {
    return 'Гнучкий час';
  }
  
  // Regular timed task
  if (task.startTime && task.endTime) {
    return `${task.startTime} - ${task.endTime}`;
  }
  
  // Default
  return 'Не вказано';
};

/**
 * Gets display text for task date
 * @param {Object} task - Task object
 * @returns {string} - Display text for date
 */
export const getTaskDateDisplay = (task) => {
  if (task.isInbox) {
    return 'Без дедлайну';
  }
  
  if (task.date) {
    return formatDate(task.date);
  }
  
  if (task.startDate && task.endDate) {
    return `${formatDate(task.startDate)} - ${formatDate(task.endDate)}`;
  }
  
  return 'Не вказано';
};
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Keyboard,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
let Voice;
try {
  Voice = require('@react-native-voice/voice').default;
} catch {
  Voice = null;
}
import AudioRecorderPlayer from 'react-native-nitro-sound';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../styles/theme';
import WheelPicker from '../calendar/WheelPicker';
import { useTasks } from '../../context/TasksContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSelectedDate } from '../../context/SelectedDateContext';
import { getTranslation } from '../../utils/translations';
import { createTask as createTaskWithBackend } from '../../services/TaskCreationService';
import { PreferencesStorage } from '../../services/StorageService';
import { checkTimeOverlap } from '../../utils/timeUtils';
import { taskDefaults, habitDefaults, goalDefaults } from '../../utils/itemDefaults';
import { DEFAULT_TASK_THEME_COLOR, TASK_THEME_PALETTE } from '../../constants/taskThemeColors';
import {
  resolveCalendarListDateKey,
  isItemOnCalendarDay,
} from '../../utils/calendarDay';

const AddItemModal = ({ visible, onClose, onAddTask, onAddHabit }) => {
  const { tasks, habits, goals, addTask, addHabit, addGoal } = useTasks();
  const { language } = useLanguage();
  const { selectedDate, todayCalendar } = useSelectedDate();
  const [step, setStep] = useState('type');
  const [itemType, setItemType] = useState(null);

  const selectedDateKey = resolveCalendarListDateKey(selectedDate, todayCalendar);

  const tasksToday = (tasks || []).filter(
    (t) =>
      t &&
      (t.type === 'task' || t.type == null) &&
      isItemOnCalendarDay(t, selectedDateKey),
  ).length;
  const habitsToday = (habits || []).filter(
    (h) =>
      h &&
      (h.type === 'habit' || h.type == null) &&
      isItemOnCalendarDay(h, selectedDateKey),
  ).length;
  const goalsToday = (goals || []).filter(
    (g) =>
      g &&
      (g.type === 'goal' || g.type == null) &&
      isItemOnCalendarDay(g, selectedDateKey),
  ).length;
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentProgress, setCurrentProgress] = useState('');
  const [deadline, setDeadline] = useState('');
  const [noDeadline, setNoDeadline] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiInputType, setEmojiInputType] = useState(null);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_TASK_THEME_COLOR);
  const [titleAudio, setTitleAudio] = useState(null);
  const [descriptionAudio, setDescriptionAudio] = useState(null);
  const [isPlayingTitle, setIsPlayingTitle] = useState(false);
  const [isPlayingDescription, setIsPlayingDescription] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentRecordingPath, setCurrentRecordingPath] = useState(null);
  const [currentPlayerType, setCurrentPlayerType] = useState(null);
  const playbackListenerRef = useRef(null);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState(null);
  const [timePickerHourIdx, setTimePickerHourIdx] = useState(9);
  const [timePickerMinuteIdx, setTimePickerMinuteIdx] = useState(0);
  const [conflictDialog, setConflictDialog] = useState(null);
  
  const themeColors = TASK_THEME_PALETTE;
  const audioRecorderPlayer = useRef(AudioRecorderPlayer).current;

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const parseHHMM = (value) => {
    const str = typeof value === 'string' ? value : '';
    const [hRaw, mRaw] = str.split(':');
    const h = Number(String(hRaw).trim());
    const m = Number(String(mRaw).trim());
    return {
      h: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 0,
      m: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
    };
  };

  const toMinutesHHMM = (value) => {
    const { h, m } = parseHHMM(value);
    return h * 60 + m;
  };

  const formatHHMMClamped = (totalMinutes) => {
    const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
    const hh = Math.floor(clamped / 60);
    const mm = clamped % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  /** Відображення часу у полі форми: «09 : 30» (пробіли навколо двокрапки). */
  const spacedHHMM = (value) => {
    const { h, m } = parseHHMM(value);
    return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')}`;
  };

  const openTimePicker = (target) => {
    const current = target === 'start' ? startTime : endTime;
    const { h, m } = parseHHMM(current);
    setTimePickerTarget(target);
    setTimePickerHourIdx(h);
    setTimePickerMinuteIdx(m);
    setIsTimePickerVisible(true);
  };

  const confirmTimePicker = () => {
    const value = `${HOURS[timePickerHourIdx]}:${MINUTES[timePickerMinuteIdx]}`;
    if (timePickerTarget === 'start') {
      const prevStartMin = toMinutesHHMM(startTime);
      const prevEndMin = toMinutesHHMM(endTime);
      const prevDuration = prevEndMin > prevStartMin ? (prevEndMin - prevStartMin) : 60;
      const duration = Math.max(5, prevDuration);
      const nextStartMin = toMinutesHHMM(value);
      const nextEndMin = nextStartMin + duration;
      setStartTime(value);
      setEndTime(formatHHMMClamped(nextEndMin));
    }
    if (timePickerTarget === 'end') setEndTime(value);
    setIsTimePickerVisible(false);
    setTimePickerTarget(null);
  };

  const closeConflictDialog = () => setConflictDialog(null);

  const pushTaskToState = (task) => {
    if (typeof onAddTask === 'function') onAddTask(task);
    else addTask(task);
  };

  const pushHabitToState = (habit) => {
    if (typeof onAddHabit === 'function') onAddHabit(habit);
    else addHabit(habit);
  };

  const requestAudioPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: getTranslation('microphoneAccess', language),
          message: getTranslation('microphoneMessage', language),
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      return false;
    }
  }, [language]);

  const stopVoiceInput = useCallback(
    async (skipVoiceStop = false) => {
      const durationSnapshot = recordingDuration;
      if (!skipVoiceStop && Voice) {
        try {
          await Voice.stop();
        } catch (error) {
        }
      }
      try {
        await audioRecorderPlayer.stopRecorder();
      } catch (error) {
      }
      audioRecorderPlayer.removeRecordBackListener();
      setRecordingDuration(0);
      setIsRecording(false);
      if (activeInput === 'title' && currentRecordingPath) {
        setTitleAudio({
          uri: currentRecordingPath,
          duration: durationSnapshot,
          timestamp: new Date().toISOString(),
        });
      } else if (activeInput === 'description' && currentRecordingPath) {
        setDescriptionAudio({
          uri: currentRecordingPath,
          duration: durationSnapshot,
          timestamp: new Date().toISOString(),
        });
      }
      setCurrentRecordingPath(null);
      setActiveInput(null);
    },
    [activeInput, audioRecorderPlayer, currentRecordingPath, recordingDuration],
  );

  const handleSpeechResults = useCallback(
    (event) => {
      const text = event.value?.join(' ')?.trim();
      if (!text) return;
      if (activeInput === 'title') {
        setTitle((prev) => (prev ? `${prev} ${text}` : text));
      } else if (activeInput === 'description') {
        setDescription((prev) => (prev ? `${prev} ${text}` : text));
      }
    },
    [activeInput],
  );

  const handleSpeechError = useCallback(() => {
    stopVoiceInput(true);
  }, [stopVoiceInput]);

  const handleSpeechEnd = useCallback(() => {
    stopVoiceInput(true);
  }, [stopVoiceInput]);

  const stopPlayback = useCallback(async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
    } catch (error) {
    }
    if (playbackListenerRef.current) {
      audioRecorderPlayer.removePlayBackListener(playbackListenerRef.current);
      playbackListenerRef.current = null;
    }
    setIsPlayingTitle(false);
    setIsPlayingDescription(false);
    setCurrentPlayerType(null);
  }, [audioRecorderPlayer]);

  useEffect(() => {
    if (Voice && typeof Voice.onSpeechResults !== 'undefined') {
      try {
        Voice.onSpeechResults = handleSpeechResults;
        Voice.onSpeechError = handleSpeechError;
        Voice.onSpeechEnd = handleSpeechEnd;
      } catch (e) {
      }
    }
    return () => {
      if (Voice) {
        try {
          Voice.destroy().then(() => Voice.removeAllListeners?.()).catch(() => {});
        } catch (e) {
        }
      }
      audioRecorderPlayer.stopRecorder().catch(() => {});
      audioRecorderPlayer.removeRecordBackListener();
      stopPlayback();
    };
  }, [audioRecorderPlayer, handleSpeechEnd, handleSpeechError, handleSpeechResults, stopPlayback]);
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃'];
  
  const taskCardOpacity = useRef(new Animated.Value(0)).current;
  const taskCardTranslateY = useRef(new Animated.Value(30)).current;
  const habitCardOpacity = useRef(new Animated.Value(0)).current;
  const habitCardTranslateY = useRef(new Animated.Value(30)).current;
  const taskCardScale = useRef(new Animated.Value(1)).current;
  const habitCardScale = useRef(new Animated.Value(1)).current;
  
  const taskIconBounce = useRef(new Animated.Value(0)).current;
  const habitIconBounce = useRef(new Animated.Value(0)).current;
  const goalIconBounce = useRef(new Animated.Value(0)).current;
  
  const goalCardOpacity = useRef(new Animated.Value(0)).current;
  const goalCardTranslateY = useRef(new Animated.Value(30)).current;
  const goalCardScale = useRef(new Animated.Value(1)).current;
  
  const closeButtonRotation = useRef(new Animated.Value(0)).current;
  const closeButtonScale = useRef(new Animated.Value(1)).current;
  
  const modalHeightPercent = step === 'form' ? '85%' : '60%';
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;
  
  const voiceButtonScale = useRef(new Animated.Value(1)).current;
  
  const emojiPickerTranslateY = useRef(new Animated.Value(300)).current;
  const emojiPickerOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible && step === 'type') {
      Animated.parallel([
        Animated.timing(taskCardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taskCardTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(habitCardOpacity, {
          toValue: 1,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(habitCardTranslateY, {
          toValue: 0,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(goalCardOpacity, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(goalCardTranslateY, {
          toValue: 0,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      const createBounceAnimation = (bounceAnim) => {
        return Animated.loop(
          Animated.sequence([
            Animated.spring(bounceAnim, {
              toValue: 1,
              tension: 5,
              friction: 3,
              useNativeDriver: true,
            }),
            Animated.delay(1500),
            Animated.spring(bounceAnim, {
              toValue: 0,
              tension: 5,
              friction: 3,
              useNativeDriver: true,
            }),
            Animated.delay(1500),
          ])
        );
      };
      
      createBounceAnimation(taskIconBounce).start();
      createBounceAnimation(habitIconBounce).start();
      createBounceAnimation(goalIconBounce).start();
      
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.spring(closeButtonScale, {
              toValue: 1.1,
              tension: 3,
              friction: 2,
              useNativeDriver: true,
            }),
            Animated.spring(closeButtonScale, {
              toValue: 1,
              tension: 3,
              friction: 2,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(closeButtonRotation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      taskCardOpacity.setValue(0);
      taskCardTranslateY.setValue(30);
      habitCardOpacity.setValue(0);
      habitCardTranslateY.setValue(30);
      taskCardScale.setValue(1);
      habitCardScale.setValue(1);
      taskIconBounce.setValue(0);
      habitIconBounce.setValue(0);
      goalIconBounce.setValue(0);
      goalCardOpacity.setValue(0);
      goalCardTranslateY.setValue(30);
      goalCardScale.setValue(1);
      closeButtonRotation.setValue(0);
      closeButtonScale.setValue(1);
      formOpacity.setValue(0);
      formTranslateY.setValue(20);
      voiceButtonScale.setValue(1);
      emojiPickerTranslateY.setValue(300);
      emojiPickerOpacity.setValue(0);
    }
  }, [visible, step, taskCardOpacity, taskCardTranslateY, habitCardOpacity, habitCardTranslateY, taskCardScale, habitCardScale, taskIconBounce, habitIconBounce, goalIconBounce, goalCardOpacity, goalCardTranslateY, goalCardScale, closeButtonRotation, closeButtonScale, formOpacity, formTranslateY, voiceButtonScale, emojiPickerOpacity, emojiPickerTranslateY]);
  
  useEffect(() => {
    if (step === 'form') {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [step, formOpacity, formTranslateY]);
  
  const handleCardPress = (type, scaleAnim) => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start(() => {
      handleTypeSelect(type);
    });
  };

  const handleTypeSelect = (type) => {
    setItemType(type);
    setStep('form');
  };

  const formatTimeInput = (timeStr) => {
    const digits = timeStr.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) {
      return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    }
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  };

  const validateTime = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return false;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  const toMinutes = (timeStr) => {
    if (!validateTime(timeStr)) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const computeDurationMinutes = (start, end) => {
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (s === null || e === null) return null;
    const diff = e - s;
    return diff > 0 ? diff : null;
  };

  /** Спільні поля форми (задача / звичка / ціль). */
  const buildScheduledFields = ({ start, end }) => {
    const duration = computeDurationMinutes(start, end);
    return {
      title: title.trim(),
      description: description.trim(),
      date: noDeadline ? null : selectedDateKey,
      startTime: noDeadline ? null : start,
      endTime: noDeadline ? null : end,
      estimatedDuration: duration ?? 0,
      themeColor: selectedColor,
      titleAudio,
      descriptionAudio,
    };
  };

  /** Повний об’єкт для TaskCreationService.createTask (усі поля моделі). */
  const buildTaskPayload = ({ start, end }) => ({
    ...taskDefaults,
    ...buildScheduledFields({ start, end }),
    type: 'task',
    status: 'pending',
    tags: [],
    archived: false,
    deletedAt: null,
  });

  const formatHHMM = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const findNearestFreeSlot = ({ dateKey, startHHMM, durationMinutes }) => {
    const prefs = PreferencesStorage.get();
    const deadZones = prefs?.deadZones || [];

    const existingOnDay = (tasks || []).filter(
      (t) =>
        t &&
        t.type === 'task' &&
        t.date === dateKey &&
        t.startTime &&
        t.endTime &&
        !t.archived &&
        t.deletedAt === null,
    );

    const asZones = existingOnDay.map((t) => ({
      id: t.id,
      name: t.title,
      startTime: t.startTime,
      endTime: t.endTime,
    }));

    const startMin = toMinutes(startHHMM);
    if (startMin === null) return null;

    const step = 5;
    for (let m = startMin; m <= 1440 - durationMinutes; m += step) {
      const candidateStartISO = `${dateKey}T${formatHHMM(m)}:00`;

      const overlapsDeadZone = deadZones.some((dz) =>
        checkTimeOverlap(candidateStartISO, durationMinutes, dz),
      );
      if (overlapsDeadZone) continue;

      const overlapsTask = asZones.some((z) =>
        checkTimeOverlap(candidateStartISO, durationMinutes, z),
      );
      if (overlapsTask) continue;

      const start = formatHHMM(m);
      const end = formatHHMM(m + durationMinutes);
      return { start, end };
    }

    return null;
  };

  const doCleanupAndClose = async () => {
    if (isRecording) {
      await stopVoiceInput(true);
    }
    await stopPlayback();
    setStep('type');
    setItemType(null);
    setTitle('');
    setDescription('');
    setStartTime('09:00');
    setEndTime('10:00');
    setTargetValue('');
    setCurrentProgress('');
    setDeadline('');
    setNoDeadline(false);
    setIsRecording(false);
    setActiveInput(null);
    setSelectedColor(DEFAULT_TASK_THEME_COLOR);
    setTitleAudio(null);
    setDescriptionAudio(null);
    setIsPlayingTitle(false);
    setIsPlayingDescription(false);
    onClose();
  };

  const handleAdd = async () => {
    if (!title.trim()) {
      Alert.alert(
        getTranslation('title', language) || 'Назва',
        getTranslation('enterTitle', language) || 'Введіть назву',
      );
      return;
    }

    if (!itemType) {
      Alert.alert('Тип', 'Оберіть задачу, звичку або ціль.');
      return;
    }

    const formattedStartTime = formatTimeInput(startTime);
    const formattedEndTime = formatTimeInput(endTime);

    if (!noDeadline) {
      const startValid = validateTime(formattedStartTime);
      const endValid = validateTime(formattedEndTime);
      const duration =
        startValid && endValid ? computeDurationMinutes(formattedStartTime, formattedEndTime) : null;
      if (!startValid || !endValid) {
        Alert.alert(
          getTranslation('time', language) || 'Час',
          getTranslation('invalidTime', language) || 'Введіть коректний час',
        );
        return;
      }
      if (duration === null) {
        Alert.alert(
          getTranslation('time', language) || 'Час',
          getTranslation('endAfterStart', language) || 'Кінець має бути пізніше за початок',
        );
        return;
      }
    }

    if (itemType === 'task') {
      const item = buildTaskPayload({ start: formattedStartTime, end: formattedEndTime });
      try {
        const result = await createTaskWithBackend(item);
        pushTaskToState(result);
      } catch (err) {
        if (err?.code === 'DEAD_ZONE_CONFLICT') {
          setConflictDialog({
            kind: 'dead_zone',
            title: getTranslation('deadZoneTitle', language) || 'Мертва зона',
            message: `${err.message || 'Це час вашої мертвої зони'}${err.zoneName ? ` (${err.zoneName})` : ''}.`,
            item,
          });
          return;
        }
        if (err?.code === 'TASK_OVERLAP') {
          setConflictDialog({
            kind: 'task_overlap',
            title: 'Час уже зайнятий',
            message: `${err.conflictingTaskTitle ? `У вас уже є задача “${err.conflictingTaskTitle}” у цей час.` : (err.message || 'Цей час вже зайнятий іншою задачею')}`,
            item,
            conflictingTaskTitle: err.conflictingTaskTitle ?? null,
          });
          return;
        }
        console.warn('createTask failed', err);
        Alert.alert(
          getTranslation('title', language) || 'Помилка',
          err?.message || String(err),
        );
        return;
      }
    } else if (itemType === 'habit') {
      const scheduled = buildScheduledFields({
        start: formattedStartTime,
        end: formattedEndTime,
      });
      const nowIso = new Date().toISOString();
      const habit = {
        ...habitDefaults,
        ...scheduled,
        type: 'habit',
        id: Date.now().toString(),
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      pushHabitToState(habit);
    } else if (itemType === 'goal') {
      const scheduled = buildScheduledFields({
        start: formattedStartTime,
        end: formattedEndTime,
      });
      const nowIso = new Date().toISOString();
      const deadlineStr = noDeadline ? null : deadline.trim() || null;
      const rawTarget = targetValue.trim();
      const parsedValue = parseFloat(String(rawTarget).replace(',', '.'));
      const parsedProgress = parseFloat(String(currentProgress).replace(',', '.'));
      addGoal({
        ...goalDefaults,
        ...scheduled,
        type: 'goal',
        id: Date.now().toString(),
        createdAt: nowIso,
        updatedAt: nowIso,
        deadline: deadlineStr,
        target: {
          ...goalDefaults.target,
          value: Number.isFinite(parsedValue) ? parsedValue : 0,
          unit: rawTarget.replace(/^[\d.,\s]+/, '').trim() || '',
          progress: Number.isFinite(parsedProgress) ? parsedProgress : 0,
          targetDate: deadlineStr,
        },
      });
    }

    await doCleanupAndClose();
  };

  const handleClose = async () => {
    if (isRecording) {
      await stopVoiceInput(true);
    }
    if (currentPlayerType) {
      await stopPlayback();
    }
    setStep('type');
    setItemType(null);
    setTitle('');
    setDescription('');
    setStartTime('09:00');
    setEndTime('10:00');
    setTargetValue('');
    setCurrentProgress('');
    setDeadline('');
    setNoDeadline(false);
    setIsRecording(false);
    setActiveInput(null);
    setSelectedColor(DEFAULT_TASK_THEME_COLOR);
    setTitleAudio(null);
    setDescriptionAudio(null);
    setIsPlayingTitle(false);
    setIsPlayingDescription(false);
    onClose();
  };

  const startVoiceInput = useCallback(
    async (inputType) => {
      if (isRecording) {
        await stopVoiceInput();
        return;
      }

      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        setIsRecording(false);
        return;
      }

      setActiveInput(inputType);
      setIsRecording(true);

      Animated.sequence([
        Animated.spring(voiceButtonScale, {
          toValue: 0.9,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(voiceButtonScale, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      if (Voice) {
        try {
          await Promise.resolve(Voice.start('uk-UA')).catch(() => {
            setIsRecording(false);
          });
        } catch (error) {
          setIsRecording(false);
        }
      }

      try {
        const path = await audioRecorderPlayer.startRecorder();
        setCurrentRecordingPath(path);
        audioRecorderPlayer.addRecordBackListener((event) => {
          setRecordingDuration(event.currentPosition);
        });
      } catch (error) {
        setIsRecording(false);
      }
    },
    [audioRecorderPlayer, isRecording, requestAudioPermission, stopVoiceInput, voiceButtonScale],
  );
  
  const openEmojiPicker = (inputType) => {
    Keyboard.dismiss();
    setEmojiInputType(inputType);
    setShowEmojiPicker(true);
    Animated.parallel([
      Animated.spring(emojiPickerTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(emojiPickerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const insertEmoji = (emoji) => {
    if (emojiInputType === 'title') {
      setTitle(prev => prev + emoji);
    } else if (emojiInputType === 'description') {
      setDescription(prev => prev + emoji);
    }
    Animated.parallel([
      Animated.spring(emojiPickerTranslateY, {
        toValue: 300,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(emojiPickerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowEmojiPicker(false);
      setEmojiInputType(null);
    });
  };

  const playAudio = useCallback(
    async (audioType) => {
      const audioData = audioType === 'title' ? titleAudio : descriptionAudio;
      if (!audioData) return;

      if (currentPlayerType === audioType) {
        await stopPlayback();
        return;
      }

      await stopPlayback();

      try {
        await audioRecorderPlayer.startPlayer(audioData.uri);
        setCurrentPlayerType(audioType);
        if (audioType === 'title') {
          setIsPlayingTitle(true);
        } else {
          setIsPlayingDescription(true);
        }
        playbackListenerRef.current = audioRecorderPlayer.addPlayBackListener((event) => {
          if (event.currentPosition >= event.duration) {
            stopPlayback();
          }
        });
      } catch (error) {
        stopPlayback();
      }
    },
    [audioRecorderPlayer, currentPlayerType, descriptionAudio, stopPlayback, titleAudio],
  );


  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      hardwareAccelerated={true}
      onShow={() => {
        console.log('✅✅✅ Modal onShow called - modal is now visible! ✅✅✅');
        console.log('Modal should be showing on screen');
      }}
      onDismiss={() => console.log('❌ Modal dismissed')}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            styles.modalContentDynamic,
            {
              maxHeight: modalHeightPercent,
              height: modalHeightPercent,
            },
          ]}
        >
            <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Animated.View 
                style={[
                  styles.closeButton,
                  {
                    transform: [
                      {
                        rotate: closeButtonRotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                      { scale: closeButtonScale },
                    ],
                  },
                ]}
              >
                <Icon name="close" size={18} color={COLORS.textSecondary} />
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {step === 'type' 
                ? getTranslation('createNew', language) 
                : itemType === 'task' 
                  ? getTranslation('newTask', language) 
                  : itemType === 'habit' 
                    ? getTranslation('newHabit', language) 
                    : getTranslation('newGoal', language)}
            </Text>
            <View style={styles.placeholderButton} />
          </View>

          {step === 'type' ? (
            <View key={selectedDateKey ?? 'day'} style={styles.typeSelection}>
              <View style={styles.cardsRow}>
                <Animated.View
                  style={[
                    styles.typeButton,
                    styles.cardThird,
                    {
                      opacity: taskCardOpacity,
                      transform: [
                        { translateY: taskCardTranslateY },
                        { scale: taskCardScale },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.typeButtonTouchable}
                    onPress={() => handleCardPress('task', taskCardScale)}
                    activeOpacity={1}
                  >
                    <View style={styles.cardHeader}>
                      <Animated.View 
                        style={[
                          styles.typeIconWrapper, 
                          styles.taskIconWrapper,
                          {
                            transform: [
                              {
                                translateY: taskIconBounce.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, -4],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Icon name="document-text" size={22} color={COLORS.text} />
                      </Animated.View>
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.textContainer}>
                        <Text style={styles.typeSubtitle}>{getTranslation('oneTimeTask', language)}</Text>
                        <Text style={styles.typeSubtitle}>{getTranslation('task', language)}</Text>
                      </View>
                      <View style={styles.counterContainer}>
                        <Text style={styles.counterText}>{tasksToday}</Text>
                        <Text style={styles.counterLabel}>{getTranslation('forThisDay', language)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.typeButton,
                    styles.cardThird,
                    {
                      opacity: habitCardOpacity,
                      transform: [
                        { translateY: habitCardTranslateY },
                        { scale: habitCardScale },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.typeButtonTouchable}
                    onPress={() => handleCardPress('habit', habitCardScale)}
                    activeOpacity={1}
                  >
                    <View style={styles.cardHeader}>
                      <Animated.View 
                        style={[
                          styles.typeIconWrapper, 
                          styles.habitIconWrapper,
                          {
                            transform: [
                              {
                                translateY: habitIconBounce.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, -4],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Icon name="flame" size={22} color={COLORS.text} />
                      </Animated.View>
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.textContainer}>
                        <Text style={styles.typeSubtitle}>{getTranslation('regularAction', language)}</Text>
                        <Text style={styles.typeSubtitle}>{getTranslation('action', language)}</Text>
                      </View>
                      <View style={styles.counterContainer}>
                        <Text style={styles.counterText}>{habitsToday}</Text>
                        <Text style={styles.counterLabel}>{getTranslation('forThisDay', language)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.typeButton,
                    styles.goalCardWide,
                    {
                      opacity: goalCardOpacity,
                      transform: [
                        { translateY: goalCardTranslateY },
                        { scale: goalCardScale },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.typeButtonTouchable}
                    onPress={() => handleCardPress('goal', goalCardScale)}
                    activeOpacity={1}
                  >
                    <View style={styles.cardHeader}>
                      <Animated.View 
                        style={[
                          styles.typeIconWrapper, 
                          styles.goalIconWrapper,
                          {
                            transform: [
                              {
                                translateY: goalIconBounce.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, -4],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Icon name="flag" size={22} color={COLORS.text} />
                      </Animated.View>
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.typeSubtitle}>{getTranslation('goal', language)}</Text>
                      <View style={styles.counterContainer}>
                        <Text style={styles.counterText}>{goalsToday}</Text>
                        <Text style={styles.counterLabel}>{getTranslation('forThisDay', language)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.formWrapper,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                },
              ]}
            >
              <ScrollView 
                style={styles.formContainer} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContentContainer}
              >
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{getTranslation('title', language)}</Text>
                  <TouchableOpacity
                    onPress={() => openEmojiPicker('title')}
                    style={styles.emojiButton}
                    activeOpacity={0.7}
                  >
                    <Icon name="happy-outline" size={20} color={COLORS.primaryStrong} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  ref={titleInputRef}
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={getTranslation('enterTitle', language)}
                  placeholderTextColor={COLORS.textSecondary}
                  editable={true}
                  autoFocus={false}
                  returnKeyType="next"
                  keyboardType="default"
                  textContentType="none"
                  onSubmitEditing={() => {
                    if (descriptionInputRef.current) {
                      descriptionInputRef.current.focus();
                    }
                  }}
                />
                {titleAudio && (
                  <View style={styles.audioPlayer}>
                    <TouchableOpacity
                      onPress={() => playAudio('title')}
                      activeOpacity={0.7}
                    >
                      <Icon 
                        name={isPlayingTitle ? "pause-circle" : "play-circle"} 
                        size={24} 
                        color={COLORS.primaryStrong} 
                      />
                    </TouchableOpacity>
                    <Text style={styles.audioLabel}>{getTranslation('audioRecordingTitle', language)}</Text>
                    {titleAudio.duration && (
                      <Text style={styles.audioDuration}>
                        {Math.max(1, Math.round(titleAudio.duration / 1000))}с
                      </Text>
                    )}
                    <TouchableOpacity onPress={() => setTitleAudio(null)}>
                      <Icon name="close-circle" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.noDeadlineRow}
                  activeOpacity={0.8}
                  onPress={() => setNoDeadline((v) => !v)}
                >
                  <View style={styles.noDeadlineLeft}>
                    <Icon
                      name={noDeadline ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={COLORS.primaryDark}
                    />
                    <Text style={styles.noDeadlineText}>Без дедлайну</Text>
                  </View>
                  <Text style={styles.noDeadlineHint}>
                    {noDeadline ? 'Буде в “Без дедлайну”' : 'Має час та день'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!noDeadline && (
                <View style={styles.timeRow}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{getTranslation('start', language)}</Text>
                    <TouchableOpacity
                      style={styles.timeInputContainer}
                      activeOpacity={0.8}
                      onPress={() => openTimePicker('start')}
                    >
                      <Text style={styles.timeValueText}>{spacedHHMM(startTime)}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{getTranslation('end', language)}</Text>
                    <TouchableOpacity
                      style={styles.timeInputContainer}
                      activeOpacity={0.8}
                      onPress={() => openTimePicker('end')}
                    >
                      <Text style={styles.timeValueText}>{spacedHHMM(endTime)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>{getTranslation('descriptionOptional', language)}</Text>
                <TextInput
                  ref={descriptionInputRef}
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={getTranslation('addDescription', language)}
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  numberOfLines={3}
                  editable={true}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  keyboardType="default"
                  textContentType="none"
                />
                {descriptionAudio && (
                  <View style={styles.audioPlayer}>
                    <TouchableOpacity
                      onPress={() => playAudio('description')}
                      activeOpacity={0.7}
                    >
                      <Icon 
                        name={isPlayingDescription ? "pause-circle" : "play-circle"} 
                        size={24} 
                        color={COLORS.primaryStrong} 
                      />
                    </TouchableOpacity>
                    <Text style={styles.audioLabel}>{getTranslation('audioRecordingDescription', language)}</Text>
                    {descriptionAudio.duration && (
                      <Text style={styles.audioDuration}>
                        {Math.max(1, Math.round(descriptionAudio.duration / 1000))}с
                      </Text>
                    )}
                    <TouchableOpacity onPress={() => setDescriptionAudio(null)}>
                      <Icon name="close-circle" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {itemType === 'goal' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{getTranslation('targetValue', language)}</Text>
                    <TextInput
                      style={styles.input}
                      value={targetValue}
                      onChangeText={setTargetValue}
                      placeholder={getTranslation('exampleTarget', language)}
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{getTranslation('currentProgress', language)}</Text>
                    <TextInput
                      style={styles.input}
                      value={currentProgress}
                      onChangeText={setCurrentProgress}
                      placeholder={getTranslation('exampleProgress', language)}
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{getTranslation('deadlineOptional', language)}</Text>
                    <TextInput
                      style={styles.input}
                      value={deadline}
                      onChangeText={setDeadline}
                      placeholder={getTranslation('exampleDeadline', language)}
                      placeholderTextColor={COLORS.textSecondary}
                      editable={!noDeadline}
                    />
                  </View>
                </>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Колір теми</Text>
                <View style={styles.colorPicker}>
                  {themeColors.map((color, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                      activeOpacity={0.7}
                    >
                      {selectedColor === color && (
                        <Icon name="checkmark" size={16} color="#000" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.addButton, !title.trim() && styles.addButtonDisabled]}
                onPress={handleAdd}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>Додати</Text>
              </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          )}
        </Animated.View>
      </View>
      
      {showEmojiPicker && (
        <View style={styles.emojiModalBackdrop}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              Animated.parallel([
                Animated.spring(emojiPickerTranslateY, {
                  toValue: 300,
                  tension: 50,
                  friction: 7,
                  useNativeDriver: true,
                }),
                Animated.timing(emojiPickerOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                setShowEmojiPicker(false);
                setEmojiInputType(null);
              });
            }}
          />
          <Animated.View 
            style={[
              styles.emojiPickerContainer,
              {
                opacity: emojiPickerOpacity,
                transform: [{ translateY: emojiPickerTranslateY }],
              },
            ]}
          >
            <View style={styles.emojiPickerHeader}>
              <Text style={styles.emojiPickerTitle}>Виберіть смайлик</Text>
              <TouchableOpacity
                onPress={() => setShowEmojiPicker(false)}
                style={styles.emojiCloseButton}
              >
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.emojiScrollView}
              contentContainerStyle={styles.emojiGrid}
              showsVerticalScrollIndicator={false}
            >
              {emojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiItem}
                  onPress={() => insertEmoji(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      <Modal
        visible={isTimePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTimePickerVisible(false)}
      >
        <View style={styles.timePickerOverlay}>
          <TouchableOpacity
            style={styles.timePickerBackdrop}
            activeOpacity={1}
            onPress={() => setIsTimePickerVisible(false)}
          />
          <View style={styles.timePickerCard}>
            <Text style={styles.timePickerTitle}>
              {timePickerTarget === 'start'
                ? getTranslation('start', language)
                : getTranslation('end', language)}
            </Text>
            <View style={styles.timePickerWheels}>
              <WheelPicker
                data={HOURS}
                selectedIndex={timePickerHourIdx}
                onChange={(idx) => setTimePickerHourIdx(idx)}
                width={110}
                itemHeight={44}
                visibleItems={5}
                textStyle={styles.wheelItem}
                selectedTextStyle={styles.wheelSelectedItem}
              />
              <Text style={styles.timePickerColon}>:</Text>
              <WheelPicker
                data={MINUTES}
                selectedIndex={timePickerMinuteIdx}
                onChange={(idx) => setTimePickerMinuteIdx(idx)}
                width={110}
                itemHeight={44}
                visibleItems={5}
                textStyle={styles.wheelItem}
                selectedTextStyle={styles.wheelSelectedItem}
              />
            </View>
            <View style={styles.timePickerButtons}>
              <TouchableOpacity
                style={styles.timePickerCancel}
                onPress={() => setIsTimePickerVisible(false)}
              >
                <Text style={styles.timePickerCancelText}>
                  {getTranslation('cancel', language) || 'Скасувати'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timePickerOk} onPress={confirmTimePicker}>
                <Text style={styles.timePickerOkText}>
                  {getTranslation('confirm', language) || 'Підтвердити'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!conflictDialog}
        transparent
        animationType="fade"
        onRequestClose={closeConflictDialog}
      >
        <View style={styles.conflictOverlay}>
          <TouchableOpacity
            style={styles.conflictBackdrop}
            activeOpacity={1}
            onPress={closeConflictDialog}
          />
          <View style={styles.conflictCard}>
            <Text style={styles.conflictTitle}>{conflictDialog?.title}</Text>
            <Text style={styles.conflictMessage}>
              {conflictDialog?.message}
            </Text>

            {conflictDialog?.kind === 'task_overlap' ? (
              <Text style={styles.conflictHint}>
                Перенести задачу або додати на цей самий час (паралельно)?
              </Text>
            ) : (
              <Text style={styles.conflictHint}>
                Поставити поруч або перенести час.
              </Text>
            )}

            <View style={styles.conflictButtons}>
              <TouchableOpacity
                style={styles.conflictSecondary}
                onPress={() => {
                  closeConflictDialog();
                  openTimePicker('start');
                }}
              >
                <Text style={styles.conflictSecondaryText}>Перенести</Text>
              </TouchableOpacity>
            </View>

            {conflictDialog?.kind === 'task_overlap' ? (
              <TouchableOpacity
                style={styles.conflictTertiary}
                onPress={async () => {
                  const item = conflictDialog?.item;
                  if (!item) return;
                  try {
                    const result = await createTaskWithBackend(item, { forceSave: true });
                    pushTaskToState(result);
                    closeConflictDialog();
                    await doCleanupAndClose();
                  } catch {
                    closeConflictDialog();
                  }
                }}
              >
                <Text style={styles.conflictTertiaryText}>Додати на цей час</Text>
              </TouchableOpacity>
            ) : null}

            {conflictDialog?.kind === 'dead_zone' ? (
              <TouchableOpacity
                style={styles.conflictTertiary}
                onPress={async () => {
                  const item = conflictDialog?.item;
                  if (!item) return;
                  try {
                    const result = await createTaskWithBackend(item, { forceSave: true });
                    pushTaskToState(result);
                    closeConflictDialog();
                    await doCleanupAndClose();
                  } catch {
                    closeConflictDialog();
                  }
                }}
              >
                <Text style={styles.conflictTertiaryText}>Все одно додати</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 0,
    elevation: 0,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    position: 'relative',
    zIndex: 1,
    elevation: 20,
    width: '100%',
    alignSelf: 'flex-end',
  },
  modalContentDynamic: {
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 0,
    backgroundColor: COLORS.panelLight,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  placeholderButton: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    fontFamily: 'Montserrat-Medium',
    color: COLORS.text,
    textShadowColor: 'rgba(0, 0, 0, 0.12)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  typeSelection: {
    padding: SPACING.md,
    paddingBottom: SPACING.md,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: COLORS.panelLight,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cardHalf: {
    flex: 1,
  },
  cardThird: {
    width: '48%',
    minWidth: '48%',
  },
  goalCardWide: {
    width: '60%',
    minWidth: '60%',
    alignSelf: 'center',
  },
  typeButton: {
    borderRadius: RADIUS.xl,
    ...SHADOWS.medium,
    overflow: 'hidden',
    height: 160,
    maxHeight: 160,
    position: 'relative',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    height: 50,
    borderRadius: RADIUS.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    paddingTop: SPACING.md,
  },
  cardBody: {
    backgroundColor: 'transparent',
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
    borderRadius: RADIUS.md,
  },
  typeButtonTouchable: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  typeIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  taskIconWrapper: {
    backgroundColor: COLORS.primary,
  },
  habitIconWrapper: {
    backgroundColor: COLORS.primaryStrong,
  },
  goalIconWrapper: {
    backgroundColor: COLORS.grayLight,
  },
  typeTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    fontFamily: 'Montserrat-Medium',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  typeSubtitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '700',
    fontFamily: 'Montserrat-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    gap: 4,
  },
  counterText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    fontFamily: 'Montserrat-Medium',
    color: COLORS.primaryStrong,
  },
  counterLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
    color: COLORS.textSecondary,
  },
  formWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 28,
    marginTop: SPACING.sm,
  },
  formContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  scrollContentContainer: {
    paddingBottom: SPACING.xl,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
    color: COLORS.text,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  actionButton: {
    padding: SPACING.xs,
  },
  emojiButton: {
    padding: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontFamily: Platform.OS === 'android' ? undefined : 'Montserrat-Regular',
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeValueText: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontFamily: Platform.OS === 'android' ? undefined : 'Montserrat-Regular',
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
    fontWeight: '500',
  },
  timePickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  timePickerCard: {
    width: '86%',
    maxWidth: 380,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  timePickerTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'Montserrat-SemiBold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  timePickerWheels: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  timePickerColon: {
    fontSize: 22,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.xs,
    fontFamily: 'Montserrat-Medium',
  },
  wheelItem: {
    color: COLORS.textSecondary,
    fontSize: 20,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    height: 44,
    lineHeight: 44,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  wheelSelectedItem: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  timePickerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  timePickerCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerCancelText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontFamily: 'Montserrat-Medium',
  },
  timePickerOk: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.accentBrown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerOkText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontFamily: 'Montserrat-SemiBold',
  },
  conflictOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conflictBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 0,
    elevation: 0,
  },
  conflictCard: {
    width: '88%',
    maxWidth: 420,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    position: 'relative',
    zIndex: 1,
    elevation: 30,
  },
  conflictTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: 0.2,
  },
  conflictMessage: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 22,
  },
  conflictEmphasis: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  conflictHint: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  conflictButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  conflictSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictSecondaryText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
  conflictPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.accentBrown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictPrimaryText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
  },
  conflictTertiary: {
    marginTop: SPACING.md,
    paddingVertical: 12,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictTertiaryText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    textDecorationLine: 'underline',
  },
  addButton: {
    backgroundColor: COLORS.accentBrown,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 4,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.medium,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.grayLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  voiceButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Montserrat-Medium',
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.grayLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  audioLabel: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontFamily: 'Montserrat-Medium',
  },
  audioDuration: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: 'Montserrat-Regular',
    marginRight: SPACING.xs,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  colorOptionSelected: {
    borderColor: COLORS.text,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    fontFamily: 'Montserrat-Medium',
    color: '#FFFFFF',
  },
  emojiModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  emojiPickerContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '50%',
    paddingBottom: SPACING.lg,
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  emojiPickerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    fontFamily: 'Montserrat-Medium',
    color: COLORS.text,
  },
  emojiCloseButton: {
    padding: SPACING.xs,
  },
  emojiScrollView: {
    maxHeight: 300,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    justifyContent: 'flex-start',
  },
  emojiItem: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    margin: SPACING.xs,
    backgroundColor: COLORS.grayLight,
  },
  emojiText: {
    fontSize: 28,
  },
  noDeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noDeadlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noDeadlineText: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'Montserrat-Medium',
    color: COLORS.text,
  },
  noDeadlineHint: {
    fontSize: FONTS.sizes.xs,
    fontFamily: 'Montserrat-Regular',
    color: COLORS.textSecondary,
  },
});

export default AddItemModal;


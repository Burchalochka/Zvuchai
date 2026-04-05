import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Easing,
  PermissionsAndroid,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AudioRecorderPlayerModule from 'react-native-audio-recorder-player';
import { useTasks } from '../context/TasksContext';
import { BACKEND_URL } from '../config/devConfig';

const BAR_HEIGHTS = [
  13.89, 29.75, 47.61, 29.75, 13.89, 29.75, 47.61, 71.41, 47.61, 29.75, 47.61,
  29.75, 13.89,
];

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const createAudioRecorderPlayerInstance = () => {
  if (typeof AudioRecorderPlayerModule === 'function') {
    return new AudioRecorderPlayerModule();
  }

  if (
    AudioRecorderPlayerModule &&
    typeof AudioRecorderPlayerModule.default === 'function'
  ) {
    return new AudioRecorderPlayerModule.default();
  }

  if (
    AudioRecorderPlayerModule &&
    AudioRecorderPlayerModule.default &&
    typeof AudioRecorderPlayerModule.default.startRecorder === 'function'
  ) {
    return AudioRecorderPlayerModule.default;
  }

  if (
    AudioRecorderPlayerModule &&
    typeof AudioRecorderPlayerModule.startRecorder === 'function'
  ) {
    return AudioRecorderPlayerModule;
  }

  throw new Error('AudioRecorderPlayer export has unsupported shape');
};

/**
 * Checks if a new task conflicts with existing tasks based on time overlap.
 * @param {Object} newTask - The new task with startTime, endTime, and date properties
 * @param {Array} existingTasks - Array of existing tasks
 * @returns {Object|null} - Returns conflicting task if found, null otherwise
 */
const checkTimeConflict = (newTask, existingTasks) => {
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
 * Parses "HH:mm" string to minutes since midnight
 */
const parseHHmm = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export default function MicrophoneScreen() {
  const navigation = useNavigation();
  const { tasks, addTask } = useTasks();

  const audioRecorderPlayerRef = useRef(createAudioRecorderPlayerInstance());
  const startAnimationTimeoutsRef = useRef([]);
  const activeRecordingRef = useRef(false);
  const actionLockRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastStopTimeRef = useRef(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [recordedFilePath, setRecordedFilePath] = useState('');
  const [parsedTask, setParsedTask] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [conflictingTask, setConflictingTask] = useState(null);
  const [rescheduledTask, setRescheduledTask] = useState(null);

  const animatedValues = useRef(
    BAR_HEIGHTS.map(() => new Animated.Value(1)),
  ).current;

  const animationsRef = useRef([]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const requestMicrophonePermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Доступ до мікрофона',
          message: 'Додатку потрібен доступ до мікрофона для голосового вводу',
          buttonPositive: 'Дозволити',
          buttonNegative: 'Скасувати',
        },
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.log('Permission error:', error);
      return false;
    }
  };

  const startWaveAnimation = useCallback(() => {
    const animations = animatedValues.map((value, index) => {
      const duration = 500 + (index % 5) * 120;

      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1.45,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0.65,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      );
    });

    animationsRef.current = animations;

    startAnimationTimeoutsRef.current = animations.map((animation, index) =>
      setTimeout(() => {
        animation.start();
      }, index * 70),
    );
  }, [animatedValues]);

  const stopWaveAnimation = useCallback(() => {
    startAnimationTimeoutsRef.current.forEach(timeoutId =>
      clearTimeout(timeoutId),
    );
    startAnimationTimeoutsRef.current = [];

    animationsRef.current.forEach(animation => {
      if (animation?.stop) {
        animation.stop();
      }
    });

    animatedValues.forEach(value => {
      value.stopAnimation(() => value.setValue(1));
    });
  }, [animatedValues]);

  useEffect(() => {
    if (isRecording) {
      startWaveAnimation();
    } else {
      stopWaveAnimation();
    }

    return () => {
      stopWaveAnimation();
    };
  }, [isRecording, startWaveAnimation, stopWaveAnimation]);

  /**
   * Test network connectivity to backend before attempting upload
   */
  const testBackendConnection = async () => {
    try {
      const testUrl = 'http://192.168.1.110:3000/health';
      const response = await fetch('http://192.168.1.110:3000/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 5000,
      });
      const text = await response.text();
      console.log('Backend health check:', response.status, text);
      return response.ok;
    } catch (error) {
      console.log('Backend health check FAILED:', error.message);
      return false;
    }
  };

  /**
   * Sanitize Android file URI for FormData upload
   * Android requires file:// prefix, but react-native-audio-recorder-player
   * sometimes returns paths without it
   */
  const sanitizeAudioUri = (uri) => {
    if (!uri) return uri;
    
    // If URI already has file:// prefix, return as-is
    if (uri.startsWith('file://')) {
      return uri;
    }
    
    // If URI starts with content:// (Android content provider), handle specially
    if (uri.startsWith('content://')) {
      console.log('Content URI detected, using as-is:', uri);
      return uri;
    }
    
    // For file paths without prefix, add file://
    if (!uri.includes('://')) {
      const sanitized = `file://${uri}`;
      console.log('Sanitized URI (added file://):', sanitized);
      return sanitized;
    }
    
    // Return unchanged for other schemes (http://, https://, etc.)
    return uri;
  };

 const sendAudioToBackend = async audioUri => {
    try {
      // 1. First test network connectivity
      console.log('Testing backend connectivity...');
      const isBackendReachable = await testBackendConnection();
      if (!isBackendReachable) {
        throw new Error('Backend server is not reachable. Check if server is running and IP address is correct.');
      }

      // 2. Sanitize audio URI for Android
      const sanitizedUri = sanitizeAudioUri(audioUri);
      console.log('Original URI:', audioUri);
      console.log('Sanitized URI:', sanitizedUri);
      
      // 3. Check if file exists (basic check)
      if (!sanitizedUri) {
        throw new Error('Audio URI is empty or invalid');
      }

      // 4. Prepare FormData with enhanced logging
      const formData = new FormData();
      
      const audioFile = {
        uri: sanitizedUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      };
      
      formData.append('audio', audioFile);
      formData.append('currentTime', new Date().toISOString());
      formData.append('deadZoneConflict', 'false');

      // 5. Attempt upload with detailed logging and timeout
      console.log('Attempting upload to:', `${BACKEND_URL}/api/process-audio`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('http://192.168.1.110:3000/api/process-audio', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorText = 'No error body';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = `Could not read error body: ${e.message}`;
        }
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Server response data:', data);

      if (isMountedRef.current) {
        setRecognizedText(data.transcript || data.task?.title || '');
        
        // Store parsed task if available
        if (data.task) {
          const parsedTask = {
            id: `voice-${Date.now()}`,
            type: 'task',
            title: data.task.title || 'Без назви',
            description: data.task.description || '',
            date: data.task.date || new Date().toISOString().split('T')[0],
            startTime: data.task.startTime || data.task.time || '09:00',
            endTime: data.task.endTime || (() => {
              const start = data.task.startTime || data.task.time || '09:00';
              const [h, m] = start.split(':').map(Number);
              const endMinutes = (h * 60 + m + 60) % 1440;
              const endH = Math.floor(endMinutes / 60);
              const endM = endMinutes % 60;
              return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
            })(),
            status: 'pending',
            themeColor: '#4A90E2',
            priority: 'medium',
            difficulty: 'medium',
            estimatedDuration: data.task.estimatedDuration || 60,
            dueDate: null,
            deadline: null,
            tags: [],
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
          setParsedTask(parsedTask);
        }
      }
    } catch (error) {
      console.log('Upload error:', error);
      if (isMountedRef.current) {
        Alert.alert('Помилка завантаження', error.message || 'Не вдалося завантажити аудіо на сервер');
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();

      if (!hasPermission) {
        Alert.alert('Немає доступу', 'Дозвіл на мікрофон не надано');
        return;
      }

      const timeSinceLastStop = Date.now() - lastStopTimeRef.current;
      if (timeSinceLastStop < 400) {
        await wait(400 - timeSinceLastStop);
      }

      if (activeRecordingRef.current) {
        console.log('Recorder is already active, skip start');
        return;
      }

      setRecognizedText('');
      setRecordedFilePath('');
      setIsProcessing(false);

      const path = Platform.select({
        ios: 'recording.m4a',
        android: undefined,
      });

      const result = await audioRecorderPlayerRef.current.startRecorder(path);
      console.log('Recording started:', result);

      if (!result) {
        throw new Error('Recorder did not return file path');
      }

      activeRecordingRef.current = true;

      if (isMountedRef.current) {
        setRecordedFilePath(result);
        setIsRecording(true);
      }
    } catch (error) {
      console.log('Start recording error:', error);
      activeRecordingRef.current = false;

      if (isMountedRef.current) {
        setIsRecording(false);
        Alert.alert('Помилка', 'Не вдалося почати запис');
      }
    }
  };

  const stopRecording = async () => {
    if (!activeRecordingRef.current) {
      console.log('No active recording, skip stop');
      return;
    }

    activeRecordingRef.current = false;
    lastStopTimeRef.current = Date.now();

    if (isMountedRef.current) {
      setIsRecording(false);
      setIsProcessing(true);
    }

    stopWaveAnimation();

    try {
      const result = await audioRecorderPlayerRef.current.stopRecorder();
      console.log('Recording stopped:', result);

      const audioUri = result || recordedFilePath;

      if (!audioUri) {
        throw new Error('Audio file path is empty after stopRecorder');
      }

      if (isMountedRef.current) {
        setRecordedFilePath(audioUri);
      }

      await sendAudioToBackend(audioUri);
    } catch (error) {
      console.log('Stop recording error:', error);

      if (isMountedRef.current) {
        setIsProcessing(false);
        Alert.alert('Помилка', 'Не вдалося завершити запис');
      }
    }
  };

  const handleToggleRecording = async () => {
    if (isProcessing || actionLockRef.current) {
      return;
    }

    actionLockRef.current = true;

    try {
      if (activeRecordingRef.current || isRecording) {
        await stopRecording();
      } else {
        await startRecording();
      }
    } catch (error) {
      console.log('Toggle recording error:', error);
      activeRecordingRef.current = false;

      if (isMountedRef.current) {
        setIsRecording(false);
        setIsProcessing(false);
      }
    } finally {
      await wait(250);
      actionLockRef.current = false;
    }
  };

  const handleClose = async () => {
    if (actionLockRef.current) {
      return;
    }

    actionLockRef.current = true;

    try {
      if (activeRecordingRef.current) {
        try {
          await audioRecorderPlayerRef.current.stopRecorder();
        } catch (error) {
          console.log('Close stop error:', error);
        }
      }

      activeRecordingRef.current = false;

      if (isMountedRef.current) {
        setIsRecording(false);
        setIsProcessing(false);
        setRecognizedText('');
        setRecordedFilePath('');
      }

      navigation.goBack();
    } finally {
      actionLockRef.current = false;
    }
  };

  const handleTickPress = async () => {
    if (actionLockRef.current || !parsedTask) {
      return;
    }

    actionLockRef.current = true;

    try {
      // Check for time conflicts with existing tasks
      const conflict = checkTimeConflict(parsedTask, tasks);
      
      if (conflict) {
        // Store conflicting task and show conflict modal
        setConflictingTask(conflict);
        setShowConflictModal(true);
      } else {
        // No conflict, save directly
        await saveTask(parsedTask);
        navigation.goBack();
      }
    } catch (error) {
      console.log('Tick button error:', error);
      Alert.alert('Помилка', 'Не вдалося зберегти задачу');
    } finally {
      actionLockRef.current = false;
    }
  };

  const saveTask = async (task) => {
    try {
      // Use the TasksContext addTask function
      addTask(task);
      console.log('Task saved:', task);
      
      // Clear parsed task state
      setParsedTask(null);
      setRecognizedText('');
    } catch (error) {
      console.log('Save task error:', error);
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Image
            source={require('../assets/icons/sloth_microphone.png')}
            style={styles.sloth}
            resizeMode="contain"
          />

          <View style={styles.recordingRow}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              {isRecording
                ? 'Записую...'
                : isProcessing
                ? 'Розпізнаю...'
                : 'Готовий до запису'}
            </Text>
          </View>
        </View>

        <View style={styles.middleSection}>
          <View style={styles.waveContainer}>
            {BAR_HEIGHTS.map((height, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.bar,
                  {
                    height: animatedValues[index].interpolate({
                      inputRange: [0.65, 1, 1.45],
                      outputRange: [height * 0.65, height, height * 1.45],
                    }),
                  },
                ]}
              />
            ))}
          </View>

          {!isRecording &&
            !isProcessing &&
            recognizedText.trim().length > 0 && (
              <View style={styles.textCard}>
                <ScrollView
                  style={styles.textScroll}
                  contentContainerStyle={styles.textScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.textCardText}>{recognizedText}</Text>
                </ScrollView>
              </View>
            )}
        </View>

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.sideButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Image
              source={require('../assets/icons/cross.png')}
              style={styles.sideIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.centerButton}
            activeOpacity={0.8}
            onPress={handleToggleRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <View style={styles.stopSquare} />
            ) : (
              <Image
                source={require('../assets/icons/play.png')}
                style={styles.playIcon}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideButton}
            activeOpacity={0.8}
            onPress={handleTickPress}
            disabled={!parsedTask}
          >
            <Image
              source={require('../assets/icons/tick.png')}
              style={[styles.sideIcon, !parsedTask && { opacity: 0.3 }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conflict Alert Modal */}
      <Modal
        visible={showConflictModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConflictModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Конфлікт часу</Text>
            <Text style={styles.modalSubtitle}>
              Задача "{parsedTask?.title}" конфліктує з існуючою задачею "{conflictingTask?.title}"
            </Text>
            <Text style={styles.modalDescription}>
              Час: {parsedTask?.startTime} - {parsedTask?.endTime} ({parsedTask?.date})
            </Text>
            
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowConflictModal(false);
                  setConflictingTask(null);
                }}
              >
                <Text style={styles.modalButtonCancelText}>Скасувати</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonReschedule]}
                onPress={() => {
                  setShowConflictModal(false);
                  setShowRescheduleModal(true);
                }}
              >
                <Text style={styles.modalButtonRescheduleText}>Перенести</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={async () => {
                  setShowConflictModal(false);
                  await saveTask(parsedTask);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalButtonSaveText}>Зберегти все одно</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Calendar Modal */}
      <Modal
        visible={showRescheduleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Перенести задачу</Text>
            <Text style={styles.modalSubtitle}>
              Оберіть нову дату та час для задачі "{parsedTask?.title}"
            </Text>
            
            <View style={styles.rescheduleForm}>
              <View style={styles.rescheduleField}>
                <Text style={styles.rescheduleLabel}>Дата</Text>
                <TouchableOpacity style={styles.rescheduleInput}>
                  <Text style={styles.rescheduleInputText}>
                    {parsedTask?.date || 'Оберіть дату'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.rescheduleField}>
                <Text style={styles.rescheduleLabel}>Час початку</Text>
                <TouchableOpacity style={styles.rescheduleInput}>
                  <Text style={styles.rescheduleInputText}>
                    {parsedTask?.startTime || '09:00'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.rescheduleField}>
                <Text style={styles.rescheduleLabel}>Час завершення</Text>
                <TouchableOpacity style={styles.rescheduleInput}>
                  <Text style={styles.rescheduleInputText}>
                    {parsedTask?.endTime || '10:00'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowRescheduleModal(false);
                  setRescheduledTask(null);
                }}
              >
                <Text style={styles.modalButtonCancelText}>Скасувати</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonReschedule]}
                onPress={async () => {
                  // Create rescheduled task copy
                  const rescheduled = {
                    ...parsedTask,
                    date: parsedTask?.date || new Date().toISOString().split('T')[0],
                    startTime: parsedTask?.startTime || '09:00',
                    endTime: parsedTask?.endTime || '10:00',
                  };
                  
                  // Check for conflicts again with rescheduled time
                  const conflict = checkTimeConflict(rescheduled, tasks);
                  
                  if (conflict) {
                    Alert.alert(
                      'Конфлікт часу',
                      'Обраний час також конфліктує з існуючою задачею. Спробуйте інший час.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  
                  // Save rescheduled task
                  await saveTask(rescheduled);
                  setShowRescheduleModal(false);
                  setRescheduledTask(null);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalButtonRescheduleText}>Зберегти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFCF0',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFCF0',
    alignItems: 'center',
    paddingTop: 120,
    paddingBottom: 34,
    paddingHorizontal: 14,
  },

  topSection: {
    alignItems: 'center',
    width: '100%',
  },

  sloth: {
    width: 131,
    height: 121,
  },

  recordingRow: {
    marginTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#452C16',
    marginRight: 8,
  },

  recordingText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#452C16',
    fontFamily: 'Montserrat-SemiBold', 
  },

  middleSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    marginTop: 60,
  },

  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },

  bar: {
    width: 6.47,
    backgroundColor: '#000000',
    borderRadius: 99,
    marginHorizontal: 3.5,
  },

  textCard: {
    maxWidth: '80%',
    maxHeight: 120,
    alignSelf: 'center',
    marginTop: 40,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(69, 44, 22, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(69, 44, 22, 0.4)',
  },

  textScroll: {
    flexGrow: 0,
  },

  textScrollContent: {
    paddingBottom: 2,
  },

  textCardText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },

  bottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 10,
  },

  sideButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#452C16',
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EEE7D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 40,
  },

  stopSquare: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: '#000000',
  },

  sideIcon: {
    width: 16,
    height: 16,
  },

  playIcon: {
    width: 24,
    height: 24,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalContent: {
    backgroundColor: '#FFFCF0',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-SemiBold',
    color: '#452C16',
    marginBottom: 12,
    textAlign: 'center',
  },

  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#452C16',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 22,
  },

  modalDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#7A6A5C',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },

  modalButtonsRow: {
    flexDirection: 'column',
    gap: 12,
  },

  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalButtonCancel: {
    backgroundColor: '#F5F0E6',
    borderWidth: 1,
    borderColor: '#E5DCCD',
  },

  modalButtonCancelText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#7A6A5C',
  },

  modalButtonReschedule: {
    backgroundColor: '#4A90E2',
  },

  modalButtonRescheduleText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#FFFFFF',
  },

  modalButtonSave: {
    backgroundColor: '#FF6B6B',
  },

  modalButtonSaveText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#FFFFFF',
  },

  // Reschedule form styles
  rescheduleForm: {
    marginBottom: 24,
  },

  rescheduleField: {
    marginBottom: 16,
  },

  rescheduleLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#452C16',
    marginBottom: 6,
  },

  rescheduleInput: {
    backgroundColor: '#F5F0E6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5DCCD',
  },

  rescheduleInputText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#452C16',
  },
});

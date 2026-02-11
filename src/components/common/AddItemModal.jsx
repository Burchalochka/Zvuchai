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
} from 'react-native';
import Voice from '@react-native-voice/voice';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONTS, RADIUS } from '../../styles/theme';
import { useTasks } from '../../context/TasksContext';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const AddItemModal = ({ visible, onClose, onAddTask, onAddHabit }) => {
  const { tasks, habits, goals, addGoal } = useTasks();
  const { language } = useLanguage();
  const [step, setStep] = useState('type'); // 'type' or 'form'
  const [itemType, setItemType] = useState(null);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tasksToday = tasks.filter(task => {
    if (!task.createdAt) return true;
    const taskDate = new Date(task.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  }).length;
  
  const habitsToday = habits.filter(habit => {
    if (!habit.createdAt) return true;
    const habitDate = new Date(habit.createdAt);
    habitDate.setHours(0, 0, 0, 0);
    return habitDate.getTime() === today.getTime();
  }).length;
  
  const goalsToday = goals.filter(goal => {
    if (!goal.createdAt) return true;
    const goalDate = new Date(goal.createdAt);
    goalDate.setHours(0, 0, 0, 0);
    return goalDate.getTime() === today.getTime();
  }).length;
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentProgress, setCurrentProgress] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiInputType, setEmojiInputType] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#B8EFE6');
  const [titleAudio, setTitleAudio] = useState(null);
  const [descriptionAudio, setDescriptionAudio] = useState(null);
  const [isPlayingTitle, setIsPlayingTitle] = useState(false);
  const [isPlayingDescription, setIsPlayingDescription] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentRecordingPath, setCurrentRecordingPath] = useState(null);
  const [currentPlayerType, setCurrentPlayerType] = useState(null);
  const playbackListenerRef = useRef(null);
  
  const themeColors = [
    '#B8EFE6',
    '#FFE5B4',
    '#E0D5FF',
    '#FFB3BA',
    '#BAFFC9',
    '#BAE1FF',
    '#FFFFBA',
    '#D4A5F5',
  ];
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

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
      if (!skipVoiceStop) {
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
    Voice.onSpeechResults = handleSpeechResults;
    Voice.onSpeechError = handleSpeechError;
    Voice.onSpeechEnd = handleSpeechEnd;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
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

  const handleAdd = async () => {
    if (!title.trim()) return;

    const formattedStartTime = formatTimeInput(startTime);
    const formattedEndTime = formatTimeInput(endTime);

    if (!validateTime(formattedStartTime) || !validateTime(formattedEndTime)) {
      const item = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        startTime: '09:00',
        endTime: '10:00',
        completed: false,
        createdAt: new Date().toISOString(),
        themeColor: selectedColor,
        titleAudio: titleAudio,
        descriptionAudio: descriptionAudio,
      };

      if (itemType === 'task') {
        onAddTask(item);
      } else if (itemType === 'habit') {
        onAddHabit(item);
      } else if (itemType === 'goal') {
        addGoal({
          ...item,
          targetValue: targetValue.trim(),
          currentProgress: currentProgress.trim() || '0',
          deadline: deadline.trim(),
        });
      }
    } else {
      const item = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        completed: false,
        createdAt: new Date().toISOString(),
        themeColor: selectedColor,
        titleAudio: titleAudio,
        descriptionAudio: descriptionAudio,
      };

      if (itemType === 'task') {
        onAddTask(item);
      } else if (itemType === 'habit') {
        onAddHabit(item);
      } else if (itemType === 'goal') {
        addGoal({
          ...item,
          targetValue: targetValue.trim(),
          currentProgress: currentProgress.trim() || '0',
          deadline: deadline.trim(),
        });
      }
    }

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
    setIsRecording(false);
    setActiveInput(null);
    setSelectedColor('#B8EFE6');
    setTitleAudio(null);
    setDescriptionAudio(null);
    setIsPlayingTitle(false);
    setIsPlayingDescription(false);
    onClose();
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
    setIsRecording(false);
    setActiveInput(null);
    setSelectedColor('#B8EFE6');
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

      try {
      await Voice.start('uk-UA');
      } catch (error) {
        setIsRecording(false);
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


  console.log('=== AddItemModal render ===');
  console.log('visible prop:', visible);
  console.log('step:', step);
  console.log('itemType:', itemType);

  if (visible) {
    console.log('🟢🟢🟢 MODAL SHOULD BE VISIBLE NOW 🟢🟢🟢');
    console.log('🟢 Modal visible is TRUE, rendering Modal component');
  } else {
    console.log('🔴 Modal visible is FALSE, not rendering');
  }

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
            <View style={styles.typeSelection}>
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
                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={() => startVoiceInput('title')}
                  activeOpacity={0.7}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: voiceButtonScale }],
                    }}
                  >
                    <Icon 
                      name={isRecording && activeInput === 'title' ? 'stop-circle' : 'mic-outline'} 
                      size={20} 
                      color={isRecording && activeInput === 'title' ? COLORS.error : COLORS.textSecondary} 
                    />
                    <Text style={styles.voiceButtonText}>
                      {isRecording && activeInput === 'title' 
                        ? getTranslation('stopRecording', language) 
                        : getTranslation('recordVoice', language)}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              </View>

              <View style={styles.timeRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>{getTranslation('start', language)}</Text>
                  <View style={styles.timeInputContainer}>
                    <TextInput
                      style={styles.timeInput}
                      value={startTime}
                      onChangeText={(text) => {
                        const formatted = formatTimeInput(text);
                        if (formatted.length <= 5) {
                          setStartTime(formatted);
                        }
                      }}
                      placeholder="09:00"
                      placeholderTextColor={COLORS.textSecondary}
                      maxLength={5}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{getTranslation('end', language)}</Text>
                  <View style={styles.timeInputContainer}>
                    <TextInput
                      style={styles.timeInput}
                      value={endTime}
                      onChangeText={(text) => {
                        const formatted = formatTimeInput(text);
                        if (formatted.length <= 5) {
                          setEndTime(formatted);
                        }
                      }}
                      placeholder="10:00"
                      placeholderTextColor={COLORS.textSecondary}
                      maxLength={5}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

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
                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={() => startVoiceInput('description')}
                  activeOpacity={0.7}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: voiceButtonScale }],
                    }}
                  >
                    <Icon 
                      name={isRecording && activeInput === 'description' ? 'stop-circle' : 'mic-outline'} 
                      size={20} 
                      color={isRecording && activeInput === 'description' ? COLORS.error : COLORS.textSecondary} 
                    />
                    <Text style={styles.voiceButtonText}>
                      {isRecording && activeInput === 'description' 
                        ? getTranslation('stopRecording', language) 
                        : getTranslation('recordVoice', language)}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
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
                disabled={!title.trim()}
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
  },
  modalContent: {
    backgroundColor: '#7AB8AD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    width: '100%',
    alignSelf: 'flex-end',
    zIndex: 1000,
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
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeholderButton: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    fontFamily: 'Montserrat-Medium',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  typeSelection: {
    padding: SPACING.md,
    paddingBottom: SPACING.md,
    flex: 1,
    justifyContent: 'center',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    height: 160,
    maxHeight: 160,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
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
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 189, 175, 0.15)',
  },
  taskIconWrapper: {
    backgroundColor: '#B8EFE6', // Мятный для заданий
  },
  habitIconWrapper: {
    backgroundColor: '#FFE5B4', // Персиковый для звичок
  },
  goalIconWrapper: {
    backgroundColor: '#E0D5FF', // Лавандовый для целей
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
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginTop: SPACING.sm,
  },
  formContainer: {
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontFamily: 'Montserrat-Regular',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontFamily: 'Montserrat-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: COLORS.primaryStrong,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 4,
    alignItems: 'center',
    marginTop: SPACING.lg,
    shadowColor: COLORS.primaryStrong,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E5E7EB',
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
    backgroundColor: '#F3F4F6',
  },
  emojiText: {
    fontSize: 28,
  },
});

export default AddItemModal;


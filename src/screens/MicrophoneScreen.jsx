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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AudioRecorderPlayerModule from 'react-native-audio-recorder-player';

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

export default function MicrophoneScreen() {
  const navigation = useNavigation();

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

  const sendAudioToBackend = async audioUri => {
    try {
      const formData = new FormData();

      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });

      formData.append('currentTime', new Date().toISOString());
      formData.append('deadZoneConflict', 'false');

      console.log('Prepared form data for upload with audio:', audioUri);

      /*
  const response = await fetch('YOUR_BACKEND_URL/api/process-audio', {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log('Server response:', data);

  if (isMountedRef.current) {
    setRecognizedText(
      data.transcript ||
      data.task?.title ||
      ''
    );
  }
      */

      // remove mock when backend /api/process-audio is available
      await wait(900);

      const mockResponse = {
        transcript: 'Купити продукти завтра о 10',
        task: {
          title: 'Купити продукти',
          date: '2026-03-18',
          time: '10:00',
          deadZoneConflict: false,
        },
      };

      console.log('Mock server response:', mockResponse);

      // end point of delete
      if (isMountedRef.current) {
        setRecognizedText(mockResponse.transcript);
      }
    } catch (error) {
      console.log('Upload error:', error);
      if (isMountedRef.current) {
        Alert.alert('Помилка', 'Не вдалося обробити аудіо');
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

          <TouchableOpacity style={styles.sideButton} activeOpacity={0.8}>
            <Image
              source={require('../assets/icons/tick.png')}
              style={styles.sideIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
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
});

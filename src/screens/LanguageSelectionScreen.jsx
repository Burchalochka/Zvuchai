import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SPACING } from '../styles/theme';
import { getTranslation } from '../utils/translations';

const LanguageSelectionScreen = ({ onLanguageSelected }) => {
  const { setLanguage, language } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(null);
  const globeScale = useRef(new Animated.Value(0)).current;
  const globeOpacity = useRef(new Animated.Value(0)).current;
  const globeRotationY = useRef(new Animated.Value(0)).current;
  const globeRotationX = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const button1Scale = useRef(new Animated.Value(0)).current;
  const button2Scale = useRef(new Animated.Value(0)).current;
  const button1Opacity = useRef(new Animated.Value(0)).current;
  const button2Opacity = useRef(new Animated.Value(0)).current;
  const button1Glow = useRef(new Animated.Value(0)).current;
  const button2Glow = useRef(new Animated.Value(0)).current;
  const flag1Scale = useRef(new Animated.Value(1)).current;
  const flag2Scale = useRef(new Animated.Value(1)).current;
  const button1TranslateX = useRef(new Animated.Value(-100)).current;
  const button2TranslateX = useRef(new Animated.Value(100)).current;
  const [button1GlowPosition, setButton1GlowPosition] = useState({ x: 50, y: 50 });
  const [button2GlowPosition, setButton2GlowPosition] = useState({ x: 50, y: 50 });
  const [selectGlowPosition, setSelectGlowPosition] = useState({ x: 50, y: 50 });
  const [isButton1Pressed, setIsButton1Pressed] = useState(false);
  const [isButton2Pressed, setIsButton2Pressed] = useState(false);
  const selectButtonGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(globeScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(globeOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(globeRotationY, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(globeRotationX, {
          toValue: 0.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(globeRotationX, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setTimeout(() => {
      globeRotationY.setValue(0);
      Animated.loop(
        Animated.timing(globeRotationY, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();
    }, 2000);

    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 1000,
      delay: 300,
      useNativeDriver: true,
    }).start();

    Animated.stagger(150, [
      Animated.parallel([
        Animated.spring(button1Scale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(button1TranslateX, {
          toValue: 0,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(button1Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(300),
          Animated.spring(flag1Scale, {
            toValue: 1.1,
            tension: 50,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.spring(flag1Scale, {
            toValue: 1,
            tension: 50,
            friction: 4,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.parallel([
        Animated.spring(button2Scale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(button2TranslateX, {
          toValue: 0,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(button2Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(300),
          Animated.spring(flag2Scale, {
            toValue: 1.1,
            tension: 50,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.spring(flag2Scale, {
            toValue: 1,
            tension: 50,
            friction: 4,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const handleLanguageSelect = (lang) => {
    setSelectedLang(lang);
    setLanguage(lang);
    if (onLanguageSelected) {
      setTimeout(() => {
        onLanguageSelected();
      }, 300);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
        </View>

        <View style={styles.languageSection}>
          <Animated.Text
            style={[
              styles.chooseLanguageText,
              {
                opacity: textOpacity,
              },
            ]}
          >
            {getTranslation('chooseLanguage', selectedLang || language || 'en')}
          </Animated.Text>
          <View style={styles.languageButtons}>
            <Animated.View
              style={{
                opacity: button1Opacity,
                transform: [
                  { scale: button1Scale },
                  { translateY: button1TranslateX },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  selectedLang === 'uk' && styles.languageButtonSelected,
                ]}
                onPress={() => setSelectedLang('uk')}
                onPressIn={(e) => {
                  const { locationX, locationY } = e.nativeEvent;
                  setButton1GlowPosition({ x: locationX, y: locationY });
                  setIsButton1Pressed(true);
                  Animated.spring(button1Glow, {
                    toValue: 1,
                    tension: 50,
                    friction: 6,
                    useNativeDriver: false,
                  }).start();
                }}
                onPressOut={() => {
                  setIsButton1Pressed(false);
                  Animated.timing(button1Glow, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                  }).start();
                }}
                activeOpacity={1}
              >
                <Animated.View
                  style={[
                    styles.buttonGlowEffect,
                    {
                      left: button1GlowPosition.x - 100,
                      top: button1GlowPosition.y - 100,
                      opacity: button1Glow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.5],
                      }),
                      transform: [
                        {
                          scale: button1Glow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.flagWrapper,
                    {
                      transform: [{ scale: flag1Scale }],
                    },
                  ]}
                >
                  <Image
                    source={require('../assets/icons/Ukraine (UA).png')}
                    style={styles.flagImage}
                    resizeMode="cover"
                  />
                </Animated.View>
                <Text style={styles.languageButtonText}>{getTranslation('ukrainian', selectedLang || language || 'en')}</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={{
                opacity: button2Opacity,
                transform: [
                  { scale: button2Scale },
                  { translateY: button2TranslateX },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  selectedLang === 'en' && styles.languageButtonSelected,
                ]}
                onPress={() => setSelectedLang('en')}
                onPressIn={(e) => {
                  const { locationX, locationY } = e.nativeEvent;
                  setButton2GlowPosition({ x: locationX, y: locationY });
                  setIsButton2Pressed(true);
                  Animated.spring(button2Glow, {
                    toValue: 1,
                    tension: 50,
                    friction: 6,
                    useNativeDriver: false,
                  }).start();
                }}
                onPressOut={() => {
                  setIsButton2Pressed(false);
                  Animated.timing(button2Glow, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                  }).start();
                }}
                activeOpacity={1}
              >
                <Animated.View
                  style={[
                    styles.buttonGlowEffect,
                    {
                      left: button2GlowPosition.x - 100,
                      top: button2GlowPosition.y - 100,
                      opacity: button2Glow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.5],
                      }),
                      transform: [
                        {
                          scale: button2Glow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.flagWrapper,
                    {
                      transform: [{ scale: flag2Scale }],
                    },
                  ]}
                >
                  <Image
                    source={require('../assets/icons/United Kingdom (GB).png')}
                    style={styles.flagImage}
                    resizeMode="cover"
                  />
                </Animated.View>
                <Text style={styles.languageButtonText}>{getTranslation('english', selectedLang || language || 'en')}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
        </View>

        <TouchableOpacity
          style={[
            styles.selectButton,
            !selectedLang && styles.selectButtonDisabled,
          ]}
          onPress={() => {
            if (selectedLang) {
              handleLanguageSelect(selectedLang);
            }
          }}
          onPressIn={(e) => {
            if (selectedLang) {
              const { locationX, locationY } = e.nativeEvent;
              setSelectGlowPosition({ x: locationX, y: locationY });
              Animated.spring(selectButtonGlow, {
                toValue: 1,
                tension: 50,
                friction: 6,
                useNativeDriver: false,
              }).start();
            }
          }}
          onPressOut={() => {
            if (selectedLang) {
              Animated.timing(selectButtonGlow, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
              }).start();
            }
          }}
          activeOpacity={1}
          disabled={!selectedLang}
        >
          {selectedLang && (
            <Animated.View
              style={[
                styles.buttonGlowEffect,
                {
                  left: selectGlowPosition.x - 100,
                  top: selectGlowPosition.y - 100,
                  opacity: selectButtonGlow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                  }),
                  transform: [
                    {
                      scale: selectButtonGlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
          <Text style={[
            styles.selectButtonText,
            !selectedLang && styles.selectButtonTextDisabled,
          ]}>
            {getTranslation('select', selectedLang || language || 'en')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.sm,
    marginVertical: SPACING.md,
    borderRadius: 0,
  },
  headerContainer: {
    marginBottom: SPACING.xxl + SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeWrapper: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  globeGlowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#98CFC7',
    opacity: 0.25,
    zIndex: 0,
    top: -10,
    left: -10,
  },
  mapCircleContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    shadowColor: '#63BDAF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  gradientSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  borderRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#1B4332',
    opacity: 0.2,
    zIndex: 3,
    top: 0,
    left: 0,
  },
  mapIcon: {
    width: 180,
    height: 180,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mapIconBack: {
    opacity: 0.7,
    zIndex: 1,
  },
  mapIconFront: {
    opacity: 1,
    zIndex: 2,
  },
  languageSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  chooseLanguageText: {
    fontSize: FONTS.sizes.lg + 4,
    fontWeight: '500',
    color: '#1B4332',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  languageButtons: {
    width: '100%',
    gap: SPACING.lg,
    alignItems: 'center',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.lg,
    borderWidth: 2,
    borderColor: '#98CFC7',
    shadowColor: '#63BDAF',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  buttonGlowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#63BDAF',
    pointerEvents: 'none',
  },
  languageButtonSelected: {
    borderColor: '#63BDAF',
    borderWidth: 3,
    backgroundColor: '#F0FDFA',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  flagWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: '#B8EFE6',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagImage: {
    width: 36,
    height: 36,
  },
  languageButtonText: {
    fontSize: FONTS.sizes.md + 2,
    fontWeight: '600',
    color: '#1B4332',
    fontFamily: 'Montserrat-SemiBold',
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#98CFC7',
    borderRadius: 12,
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.xl,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#63BDAF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  selectButtonDisabled: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  selectButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: '#1B4332',
    fontFamily: 'Montserrat-SemiBold',
    position: 'relative',
    zIndex: 10,
  },
  selectButtonTextDisabled: {
    color: '#9CA3AF',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#000000',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#D1D5DB',
  },
});

export default LanguageSelectionScreen;


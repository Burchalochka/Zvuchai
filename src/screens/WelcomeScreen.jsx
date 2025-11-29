import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { FONTS, SPACING, COLORS } from '../styles/theme';

const WelcomeScreen = ({ onContinue, onSignIn }) => {
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const imageScale = useRef(new Animated.Value(0.8)).current;
  const imageRotation = useRef(new Animated.Value(0)).current;
  const button1Scale = useRef(new Animated.Value(0)).current;
  const button2Scale = useRef(new Animated.Value(0)).current;
  const button1Opacity = useRef(new Animated.Value(0)).current;
  const button2Opacity = useRef(new Animated.Value(0)).current;
  const button1Glow = useRef(new Animated.Value(0)).current;
  const button2Glow = useRef(new Animated.Value(0)).current;
  const [button1GlowPosition, setButton1GlowPosition] = useState({ x: 50, y: 50 });
  const [button2GlowPosition, setButton2GlowPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
      useNativeDriver: true,
    }),
    ]).start();

    Animated.parallel([
      Animated.spring(imageScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(imageRotation, {
        toValue: 1,
        duration: 1200,
      useNativeDriver: true,
    }),
    ]).start();

    setTimeout(() => {
      Animated.stagger(150, [
        Animated.parallel([
          Animated.spring(button1Scale, {
            toValue: 1,
            tension: 50,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(button1Opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(button2Scale, {
            toValue: 1,
            tension: 50,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(button2Opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, 400);
  }, []);

  const imageRotationDeg = imageRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>{getTranslation('welcome', language)}</Text>
          <Text style={styles.description}>{getTranslation('welcomeDescription', language)}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: imageScale },
                { rotate: imageRotationDeg },
              ],
            },
          ]}
        >
          <Image
            source={require('../assets/icons/8d936b7e56f24f16ed6c05f7e9e7ce86063ccf7c.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.buttonsContainer}>
          <Animated.View
            style={{
              opacity: button1Opacity,
              transform: [{ scale: button1Scale }],
            }}
          >
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={onContinue}
              onPressIn={(e) => {
                const { locationX, locationY } = e.nativeEvent;
                setButton1GlowPosition({ x: locationX, y: locationY });
                Animated.spring(button1Glow, {
                  toValue: 1,
                  tension: 50,
                  friction: 6,
                  useNativeDriver: false,
                }).start();
              }}
              onPressOut={() => {
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
              <Text style={styles.buttonText}>{getTranslation('createAccount', language)}</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={{
              opacity: button2Opacity,
              transform: [{ scale: button2Scale }],
            }}
          >
            <TouchableOpacity
              style={styles.signInButton}
              onPress={onSignIn || onContinue}
              onPressIn={(e) => {
                const { locationX, locationY } = e.nativeEvent;
                setButton2GlowPosition({ x: locationX, y: locationY });
                Animated.spring(button2Glow, {
                  toValue: 1,
                  tension: 50,
                  friction: 6,
                  useNativeDriver: false,
                }).start();
              }}
              onPressOut={() => {
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
              <Text style={styles.signInButtonText}>{getTranslation('signIn', language)}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    justifyContent: 'space-between',
  },
  textContainer: {
    alignItems: 'flex-start',
    marginTop: SPACING.xxl,
    width: '100%',
  },
  title: {
    fontSize: FONTS.sizes.xxl + 8,
    fontWeight: 'bold',
    color: '#1B4332',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    letterSpacing: 0.5,
    width: '100%',
  },
  description: {
    fontSize: FONTS.sizes.lg,
    color: '#6B7280',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'left',
    lineHeight: 24,
    width: '100%',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  illustration: {
    width: '100%',
    height: '100%',
    maxHeight: 400,
  },
  buttonsContainer: {
    marginBottom: SPACING.xl,
    gap: SPACING.md,
    width: '100%',
  },
  createAccountButton: {
    width: '100%',
    backgroundColor: '#98CFC7',
    borderRadius: 12,
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#63BDAF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  buttonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: '#1B4332',
    fontFamily: 'Montserrat-SemiBold',
    position: 'relative',
    zIndex: 10,
  },
  signInButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
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
  signInButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: '#1B4332',
    fontFamily: 'Montserrat-SemiBold',
    position: 'relative',
    zIndex: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
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

export default WelcomeScreen;


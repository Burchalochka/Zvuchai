import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { FONTS } from '../styles/theme';

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
      useNativeDriver: true,
    }),
    ]).start();

    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.gradientContainer}>
        <Svg width="100%" height="100%">
          <Defs>
            <SvgLinearGradient id="splashGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#98CFC7" stopOpacity="1" />
              <Stop offset="1" stopColor="#B8EFE6" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#splashGrad)" />
        </Svg>
      </View>
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.text}>ZVYCHAI</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1B4332',
    fontFamily: 'Montserrat-Bold',
    letterSpacing: 4,
  },
});

export default SplashScreen;


import React, { useRef, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated, GestureResponderEvent, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  glowColor?: string;
  backgroundColor?: string;
  textColor?: string;
  hoverTextColor?: string;
}

const HoverGlowButton: React.FC<ButtonProps> = ({
  children,
  onPress,
  style = {},
  textStyle = {},
  disabled = false,
  glowColor = '#00ffc3',
  backgroundColor = '#111827',
  textColor = '#ffffff',
  hoverTextColor = '#67e8f9',
}) => {
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  const [isPressed, setIsPressed] = useState(false);
  const glowScale = useRef(new Animated.Value(0)).current;
  const textColorAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = (event: GestureResponderEvent) => {
    if (disabled) return;
    
    const { locationX, locationY } = event.nativeEvent;
    setGlowPosition({ x: locationX, y: locationY });
    setIsPressed(true);

    Animated.parallel([
      Animated.spring(glowScale, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 50,
        friction: 6,
      }),
      Animated.timing(textColorAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    setIsPressed(false);
    Animated.parallel([
      Animated.spring(glowScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 6,
      }),
      Animated.timing(textColorAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animatedTextColor = textColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [textColor, hoverTextColor],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      style={[
        styles.button,
        {
          backgroundColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.glowEffect,
          {
            left: glowPosition.x - 100,
            top: glowPosition.y - 100,
            transform: [{ scale: glowScale }],
            backgroundColor: glowColor,
          },
        ]}
      />

      <Animated.Text
        style={[
          styles.buttonText,
          {
            color: animatedTextColor,
          },
          textStyle,
        ]}
      >
        {children}
      </Animated.Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    zIndex: 10,
    position: 'relative',
  },
});

export { HoverGlowButton };


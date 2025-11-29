import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface RippleState {
  key: number;
  x: number;
  y: number;
  size: number;
}

interface RippleButtonProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'default' | 'hover' | 'ghost' | 'hoverborder';
  rippleColor?: string;
  rippleDuration?: number;
  hoverBaseColor?: string;
  hoverRippleColor?: string;
  hoverBorderEffectColor?: string;
  hoverBorderEffectThickness?: number;
}

const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  onPress,
  style = {},
  textStyle = {},
  disabled = false,
  variant = 'default',
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  rippleDuration = 600,
  hoverBaseColor = '#6996e2',
  hoverRippleColor,
  hoverBorderEffectColor = '#6996e277',
  hoverBorderEffectThickness = 3,
}) => {
  const [ripples, setRipples] = useState<Array<RippleState & { anim: Animated.Value }>>([]);
  const buttonRef = useRef<View>(null);

  const createRipple = (event: GestureResponderEvent) => {
    if (disabled) return;

    const { locationX, locationY } = event.nativeEvent;
    
    if (buttonRef.current) {
      buttonRef.current.measure((x, y, width, height) => {
        const size = Math.max(width, height) * 2;
        const newRipple: RippleState & { anim: Animated.Value } = {
          key: Date.now(),
          x: locationX - size / 2,
          y: locationY - size / 2,
          size,
          anim: new Animated.Value(0),
        };

        setRipples((prev) => [...prev, newRipple]);

        Animated.parallel([
          Animated.timing(newRipple.anim, {
            toValue: 1,
            duration: rippleDuration,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setRipples((currentRipples) =>
            currentRipples.filter((r) => r.key !== newRipple.key)
          );
        });
      });
    }
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (!disabled) {
      createRipple(event);
      if (onPress) {
        onPress(event);
      }
    }
  };

  const getButtonStyle = () => {
    const baseStyle: ViewStyle = {
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
    };

    switch (variant) {
      case 'ghost':
        return { ...baseStyle, backgroundColor: 'transparent' };
      case 'hover':
        return { ...baseStyle, backgroundColor: 'transparent' };
      case 'hoverborder':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: hoverBorderEffectThickness,
          borderColor: hoverBorderEffectColor,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#2563eb',
        };
    }
  };

  const getTextStyle = () => {
    const baseStyle: TextStyle = {
      fontSize: 18,
      fontWeight: '500',
      zIndex: 10,
      position: 'relative',
    };

    switch (variant) {
      case 'ghost':
      case 'hover':
      case 'hoverborder':
        return baseStyle;
      default:
        return { ...baseStyle, color: '#ffffff' };
    }
  };

  return (
    <TouchableOpacity
      ref={buttonRef}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[getButtonStyle(), style]}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {ripples.map((ripple) => {
          const scale = ripple.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const opacity = ripple.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          });

          return (
            <Animated.View
              key={ripple.key}
              style={[
                styles.ripple,
                {
                  left: ripple.x,
                  top: ripple.y,
                  width: ripple.size,
                  height: ripple.size,
                  borderRadius: ripple.size / 2,
                  backgroundColor: rippleColor,
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      <Text style={[getTextStyle(), textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  ripple: {
    position: 'absolute',
  },
});

export { RippleButton };


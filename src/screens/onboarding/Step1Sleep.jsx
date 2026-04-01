// src/screens/Onboarding/Step1Sleep.jsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import OnboardingLayout from './OnboardingLayout';
import { useOnboarding } from '../../context/OnboardingContext';

// Розміри нашого слайдера
const { width } = Dimensions.get('window');
const SLIDER_SIZE = width * 0.75; 
const RADIUS = SLIDER_SIZE / 2 - 30; 
const CENTER = SLIDER_SIZE / 2;

// --- Математичні функції-помічники ---

// 1. Перетворює кут у час (наприклад, 90 градусів -> '06:00')
const angleToTime = (angle) => {
  let totalMinutes = Math.round((angle / 360) * 1440);
  if (totalMinutes === 1440) totalMinutes = 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  // Округлюємо хвилини до десятків для зручності (наприклад, 10, 20, 30)
  const roundedMinutes = Math.round(minutes / 10) * 10;
  
  const finalHours = roundedMinutes === 60 ? (hours + 1) % 24 : hours;
  const finalMins = roundedMinutes === 60 ? 0 : roundedMinutes;

  return {
    timeString: `${finalHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`,
    hours: finalHours,
    minutes: finalMins
  };
};

// 2. Перетворює полярні координати у звичайні X та Y для малювання SVG
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// 3. Малює дугу (коричневу зафарбовану частину між маркерами)
const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  
  let largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  if (startAngle > endAngle) {
    largeArcFlag = (360 - startAngle + endAngle) <= 180 ? "0" : "1";
  }

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

// --- Основний компонент ---

const Step1Sleep = ({ navigation }) => {
  const { data, updateData } = useOnboarding();

  // Початкові значення: Сон з 23:00 (345 градусів) до 07:00 (105 градусів)
  const [startAngle, setStartAngle] = useState(345); 
  const [endAngle, setEndAngle] = useState(105);

  // Створюємо обробники жестів для двох маркерів (Місяць і Сонце)
  const createPanResponder = (setAngle) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Розраховуємо позицію пальця відносно центру кола
        const x = gestureState.moveX - (width / 2);
        // Приблизно вирівнюємо центр по Y
        const y = gestureState.moveY - (SLIDER_SIZE + 100); 
        
        // Розраховуємо новий кут (Math.atan2 повертає радіани, переводимо в градуси)
        let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
        if (angle < 0) angle += 360;
        
        setAngle(angle);
      },
    });
  };

  const startResponder = useRef(createPanResponder(setStartAngle)).current;
  const endResponder = useRef(createPanResponder(setEndAngle)).current;

  // Вираховуємо час для відображення
  const startTime = angleToTime(startAngle);
  const endTime = angleToTime(endAngle);

  // Вираховуємо тривалість сну
  let diff = endAngle - startAngle;
  if (diff < 0) diff += 360;
  const durationMinutes = Math.round((diff / 360) * 1440);
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = Math.round((durationMinutes % 60) / 10) * 10; // Округлюємо до 10 хв

  const handleNext = () => {
    // Зберігаємо дані в наш контекст
    updateData({
      sleepSchedule: {
        start: startTime.timeString,
        end: endTime.timeString
      }
    });
    // Переходимо до екрана 2 (в майбутньому створимо його)
    navigation.navigate('Step2DeadZones');
  };

  // Отримуємо координати для кружечків-маркерів
  const startPos = polarToCartesian(CENTER, CENTER, RADIUS, startAngle);
  const endPos = polarToCartesian(CENTER, CENTER, RADIUS, endAngle);

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={6}
      slothImage={require('../../assets/icons/sloth_hero.png')}
      slothMessage="Давай спочатку захистимо твій сон"
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      <Text style={styles.subtitle}>
        Це найважливіший час, коли я точно не турбуватиму тебе жодними справами.
      </Text>

      <View style={styles.sliderContainer}>
        <Svg width={SLIDER_SIZE} height={SLIDER_SIZE}>
          {/* 1. Сіре фонове коло (весь час) */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke="#F5F5F5"
            strokeWidth="35"
            fill="none"
          />

          {/* 2. Коричнева зафарбована дуга (час сну) */}
          <Path
            d={describeArc(CENTER, CENTER, RADIUS, startAngle, endAngle)}
            stroke="#6B4E3D"
            strokeWidth="35"
            fill="none"
            strokeLinecap="round"
          />

          {/* 3. Маркер початку сну (Місяць) */}
          <G {...startResponder.panHandlers}>
            <Circle cx={startPos.x} cy={startPos.y} r="18" fill="#4A3728" />
            <Text style={{ position: 'absolute', top: startPos.y - 10, left: startPos.x - 8, fontSize: 16 }}>🌙</Text>
          </G>

          {/* 4. Маркер кінця сну (Сонце) */}
          <G {...endResponder.panHandlers}>
            <Circle cx={endPos.x} cy={endPos.y} r="18" fill="#FFFFFF" stroke="#F0E6D2" strokeWidth="2" />
            <Text style={{ position: 'absolute', top: endPos.y - 10, left: endPos.x - 8, fontSize: 16 }}>☀️</Text>
          </G>
        </Svg>

        {/* Центральний текст з годинами */}
        <View style={styles.centerTextContainer}>
          <Text style={styles.durationText}>
            {durationHours} год {durationMins > 0 ? `${durationMins} хв` : ''}
          </Text>
          <Text style={styles.timeRangeText}>
            {startTime.timeString} - {endTime.timeString}
          </Text>
        </View>
      </View>

      <Text style={styles.dragHint}>Перетягни маркери ✦</Text>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 20,
  },
  sliderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SLIDER_SIZE,
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dragHint: {
    textAlign: 'center',
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 30,
  },
});

export default Step1Sleep;
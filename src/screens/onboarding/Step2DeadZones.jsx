// src/screens/Onboarding/Step2DeadZones.jsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions, TouchableOpacity, TextInput, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import Svg, { Circle, Path, G, Line, Text as SvgText } from 'react-native-svg';
import OnboardingLayout from './OnboardingLayout';
import { useOnboarding } from '../../context/OnboardingContext';

const { width } = Dimensions.get('window');
const SLIDER_SIZE = width * 0.65;
const RADIUS = SLIDER_SIZE / 2 - 30;
const CENTER = SLIDER_SIZE / 2;

const ZONE_COLORS = ['#A8F0C6', '#FFB6C1', '#87CEFA', '#DDA0DD', '#F0E68C'];

const angleToTime = (angle) => {
  let totalMinutes = Math.round((angle / 360) * 1440);
  if (totalMinutes === 1440) totalMinutes = 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round((totalMinutes % 60) / 10) * 10;
  const finalHours = minutes === 60 ? (hours + 1) % 24 : hours;
  const finalMins = minutes === 60 ? 0 : minutes;
  return {
    timeString: `${finalHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`,
    hours: finalHours,
    minutes: finalMins
  };
};

const timeToAngle = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m;
  return (totalMinutes / 1440) * 360;
};

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  let largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  if (startAngle > endAngle) {
    largeArcFlag = (360 - startAngle + endAngle) <= 180 ? "0" : "1";
  }
  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
};

const Step2DeadZones = ({ navigation }) => {
  const { data, updateData } = useOnboarding();
  
  const [startAngle, setStartAngle] = useState(270);
  const [endAngle, setEndAngle] = useState(300);
  const [zoneName, setZoneName] = useState('');
  const [zones, setZones] = useState([]);

  const createPanResponder = (setAngle) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const x = gestureState.moveX - (width / 2);
        const y = gestureState.moveY - (SLIDER_SIZE + 80); 
        let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
        if (angle < 0) angle += 360;
        setAngle(angle);
      },
    });
  };

  const startResponder = useRef(createPanResponder(setStartAngle)).current;
  const endResponder = useRef(createPanResponder(setEndAngle)).current;

  const startTime = angleToTime(startAngle);
  const endTime = angleToTime(endAngle);

  const handleAddZone = () => {
    if (!zoneName.trim() || zones.length >= 10) return;
    const newZone = {
      id: Date.now().toString(),
      name: zoneName.trim(),
      startTime: startTime.timeString,
      endTime: endTime.timeString,
      color: ZONE_COLORS[zones.length % ZONE_COLORS.length]
    };
    setZones([...zones, newZone]);
    setZoneName('');
  };

  const handleDeleteZone = (id) => {
    setZones(zones.filter(z => z.id !== id));
  };

  const handleNext = () => {
    updateData({ deadZones: zones });
    navigation.navigate('Step3ProductiveTime');
  };

  const handleSkip = () => {
    updateData({ deadZones: [] });
    navigation.navigate('Step3ProductiveTime');
  };

  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i < 24; i += 2) {
      const angle = i * 15;
      const isMain = i % 6 === 0;
      const outerR = RADIUS + (isMain ? 12 : 6);
      const innerR = RADIUS + 2;
      
      const start = polarToCartesian(CENTER, CENTER, innerR, angle);
      const end = polarToCartesian(CENTER, CENTER, outerR, angle);
      const textPos = polarToCartesian(CENTER, CENTER, outerR + 14, angle);

      ticks.push(
        <G key={`tick-${i}`}>
          <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#D3D3D3" strokeWidth={isMain ? 2 : 1} />
          {isMain && (
            <SvgText x={textPos.x} y={textPos.y + 4} fontSize="12" fill="#999" textAnchor="middle" fontWeight="bold">
              {i.toString().padStart(2, '0')}
            </SvgText>
          )}
        </G>
      );
    }
    return ticks;
  };

  const startPos = polarToCartesian(CENTER, CENTER, RADIUS, startAngle);
  const endPos = polarToCartesian(CENTER, CENTER, RADIUS, endAngle);
return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={6}
      
      slothImage={require('../../assets/icons/sloth_hero.png')} 
      slothMessage="Як щодо твого графіка? Давай виставимо недоторканний час"
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      {/* РОЗУМНА ОБГОРТКА ДЛЯ КЛАВІАТУРИ */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled" // Дозволяє натиснути "+ Додати" з відкритою клавіатурою
        >
          <Text style={styles.subtitle}>
            Додай час стабільної роботи чи час із сім'єю, в які ти не хочеш бачити жодних завдань. Ти можеш додати до 10 таких зон на коло.
          </Text>

          <View style={styles.sliderContainer}>
            <Svg width={SLIDER_SIZE} height={SLIDER_SIZE}>
              {/* Фонове коло */}
              <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#F5F5F5" strokeWidth="25" fill="none" />
              
              {/* Додані зони */}
              {zones.map((zone) => {
                const sAngle = timeToAngle(zone.startTime);
                const eAngle = timeToAngle(zone.endTime);
                return (
                  <Path
                    key={`arc-${zone.id}`}
                    d={describeArc(CENTER, CENTER, RADIUS, sAngle, eAngle)}
                    stroke={zone.color}
                    strokeWidth="25"
                    fill="none"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Зафарбована дуга ПОТОЧНОГО виділеного часу */}
              <Path
                d={describeArc(CENTER, CENTER, RADIUS, startAngle, endAngle)}
                stroke="#E0D4C8"
                strokeWidth="25"
                fill="none"
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* 24-годинна розмітка */}
              {renderTicks()}

              {/* Маркер ПОЧАТКУ зони (однотонний + текст) */}
              <G {...startResponder.panHandlers}>
                <Circle cx={startPos.x} cy={startPos.y} r="16" fill="#4A3728" />
                <SvgText x={startPos.x} y={startPos.y - 22} fontSize="14" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="3" textAnchor="middle" fontWeight="bold">
                  {startTime.timeString}
                </SvgText>
                <SvgText x={startPos.x} y={startPos.y - 22} fontSize="14" fill="#4A3728" textAnchor="middle" fontWeight="bold">
                  {startTime.timeString}
                </SvgText>
              </G>

              {/* Маркер КІНЦЯ зони (однотонний + текст) */}
              <G {...endResponder.panHandlers}>
                <Circle cx={endPos.x} cy={endPos.y} r="16" fill="#4A3728" />
                <SvgText x={endPos.x} y={endPos.y - 22} fontSize="14" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="3" textAnchor="middle" fontWeight="bold">
                  {endTime.timeString}
                </SvgText>
                <SvgText x={endPos.x} y={endPos.y - 22} fontSize="14" fill="#4A3728" textAnchor="middle" fontWeight="bold">
                  {endTime.timeString}
                </SvgText>
              </G>
            </Svg>

            <View style={styles.centerTextContainer}>
              <Text style={styles.timeRangeText}>{startTime.timeString} - {endTime.timeString}</Text>
            </View>
          </View>

          <View style={styles.addZoneContainer}>
            <TextInput
              style={styles.input}
              placeholder="Назва (напр. Спорт)"
              value={zoneName}
              onChangeText={setZoneName}
              maxLength={20}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddZone}>
              <Text style={styles.addButtonText}>+ Додати</Text>
            </TouchableOpacity>
          </View>

          {zones.map((zone) => (
            <View key={zone.id} style={styles.zoneCard}>
              <View style={[styles.colorIndicator, { backgroundColor: zone.color }]} />
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Text style={styles.zoneTime}>{zone.startTime} - {zone.endTime}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteZone(zone.id)} style={styles.deleteButton}>
                <Image 
                  source={require('../../assets/icons/trash.png')} 
                  style={styles.trashIcon} 
                  resizeMode="contain" 
                />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Мій графік гнучкий (Пропустити)</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 13,
    color: '#A0A0A0',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  sliderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SLIDER_SIZE,
    marginBottom: 20,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  addZoneContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    backgroundColor: '#FAFAFA',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#F0E6D2',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 48,
  },
  addButtonText: {
    color: '#4A3728',
    fontWeight: '700',
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  colorIndicator: {
    width: 6,
    height: '100%',
    borderRadius: 3,
    marginRight: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  zoneTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  trashIcon: {
    width: 20,
    height: 20,
    tintColor: '#A0A0A0', // Робить іконку сірою, щоб вона виглядала гармонійно
  },
  skipButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipButtonText: {
    color: '#A0A0A0',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});

export default Step2DeadZones;
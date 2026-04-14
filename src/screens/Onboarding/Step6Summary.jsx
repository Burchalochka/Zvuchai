// src/screens/Onboarding/Step6Summary.jsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import OnboardingLayout from './OnboardingLayout';
import { useOnboarding } from '../../context/OnboardingContext';
import { PreferencesStorage } from '../../services/StorageService'; // Твій сервіс збереження

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.6;
const RADIUS = CHART_SIZE / 2;
const CENTER = CHART_SIZE / 2;
const STROKE_WIDTH = 45; // Товщина нашого "бублика"

// Палітра кольорів з фігми
const COLORS = {
  sleep: '#99FFFF',   // Блакитний (Сон)
  rest: '#A8F0C6',    // Зелений (Відпочинок)
  work: '#FFB6C1',    // Рожевий (Активна робота)
  other: '#F5F5DC',   // Бежевий (Інше)
};

// --- Допоміжні функції ---

// Перетворює 'HH:mm' у хвилини від початку доби
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Вираховує тривалість між двома 'HH:mm' (з урахуванням переходу через північ)
const getDurationMinutes = (start, end) => {
  let startMin = timeToMinutes(start);
  let endMin = timeToMinutes(end);
  let diff = endMin - startMin;
  if (diff < 0) diff += 1440; // Якщо кінець наступного дня (наприклад 23:00 - 07:00)
  return diff;
};

// Математика для SVG (вже знайома тобі)
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  // Якщо сегмент займає всі 100% (360 градусів), малюємо два півкола, бо SVG Path не вміє малювати 360 дугою
  if (endAngle - startAngle === 360) {
    return [
      "M", x, y - radius,
      "A", radius, radius, 0, 1, 1, x, y + radius,
      "A", radius, radius, 0, 1, 1, x, y - radius
    ].join(" ");
  }

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  let largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
};

// --- Основний компонент ---

const Step6Summary = ({ navigation }) => {
  const { data, clearData } = useOnboarding();

  // 1. Розраховуємо баланс дня у хвилинах
  const chartData = useMemo(() => {
    // 1. Тривалість сну
    const sleepMins = data.sleepSchedule 
      ? getDurationMinutes(data.sleepSchedule.start, data.sleepSchedule.end) 
      : 8 * 60; 

    // 2. Недоторканні зони (тепер це категорія "Інше")
    const deadZonesMins = data.deadZones.reduce((total, zone) => {
      return total + getDurationMinutes(zone.startTime, zone.endTime);
    }, 0);

    // 3. Активна робота (фіксовано 8 годин, як ти просила)
    const idealWorkMins = 8 * 60;
    
    // 4. Відпочинок (все, що залишилося від 24 годин)
    let restMins = 1440 - (sleepMins + deadZonesMins + idealWorkMins);
    let workMins = idealWorkMins;

    // Захист: якщо користувач наставив забагато сну і зон, і час пішов у мінус
    if (restMins < 0) {
      workMins = idealWorkMins + restMins; // Віднімаємо брак часу від роботи
      restMins = 0;
      if (workMins < 0) workMins = 0;
    }

    return [
      { id: 'sleep', label: 'Сон', mins: sleepMins, color: COLORS.sleep, icon: '🌙' },
      { id: 'rest', label: 'Відпочинок', mins: restMins, color: COLORS.rest, icon: '🧘' },
      { id: 'work', label: 'Активна робота', mins: workMins, color: COLORS.work, icon: '💼' },
      { id: 'other', label: 'Інше', mins: deadZonesMins, color: COLORS.other, icon: '⏳' },
    ];
  }, [data]);

  const handleFinish = () => {
    // 1. Отримуємо існуючі налаштування (щоб не затерти те, що вже є)
    const currentPrefs = PreferencesStorage.get() || { eveningReportTime: '21:00' };

    // 2. Формуємо новий об'єкт налаштувань
    const finalPreferences = {
      ...currentPrefs,
      sleepSchedule: data.sleepSchedule,
      deadZones: data.deadZones,
      productiveTime: data.productiveTime,
      workType: data.workType,
      workFormat: data.workFormat,
      hasDistractions: data.hasDistractions,
      fatigueLevel: data.fatigueLevel,
      isOnboardingCompleted: true, // Позначаємо, що онбординг пройдено
    };

    // 3. Зберігаємо все синхронно в MMKV (як вказано у твоєму гайді)
    PreferencesStorage.save(finalPreferences);

    // 4. Очищаємо тимчасовий стан
    clearData();

    // 5. Переходимо на головний екран додатка (заміни 'Home' на назву твого головного екрана навігації)
    // Використовуємо replace або reset, щоб користувач не міг повернутися кнопкою "Назад"
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tabs' }], 
    });
  };

  // 2. Малюємо сегменти діаграми
  let currentAngle = 0;
  const segments = chartData.map((item) => {
    if (item.mins === 0) return null; // Не малюємо пусті сегменти
    const angle = (item.mins / 1440) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Розраховуємо позицію для іконки по центру сегмента
    const midAngle = startAngle + (angle / 2);
    const iconPos = polarToCartesian(CENTER, CENTER, RADIUS, midAngle);

    return (
      <G key={item.id}>
        <Path
          d={describeArc(CENTER, CENTER, RADIUS, startAngle, endAngle)}
          stroke={item.color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Іконка всередині сегмента (тільки якщо сегмент достатньо великий) */}
        {angle > 15 && (
          <SvgText x={iconPos.x} y={iconPos.y + 5} fontSize="14" textAnchor="middle">
            {item.icon}
          </SvgText>
        )}
      </G>
    );
  });

  return (
    <OnboardingLayout
      currentStep={6}
      totalSteps={6}
      slothImage={require('../../assets/icons/sloth_hero.png')}
      slothMessage="Твій особистий профіль готовий!"
      onBack={() => navigation.goBack()}
      onNext={handleFinish}
      nextButtonText="Готово" // Змінюємо текст кнопки
    >
      <Text style={styles.title}>Баланс твого дня</Text>

      <View style={styles.chartContainer}>
        <Svg width={CHART_SIZE + STROKE_WIDTH} height={CHART_SIZE + STROKE_WIDTH} style={styles.svgWrapper}>
          <G x={STROKE_WIDTH / 2} y={STROKE_WIDTH / 2}>
            {segments}
          </G>
        </Svg>
      </View>

      <View style={styles.legendContainer}>
        {chartData.map((item) => {
          const hours = (item.mins / 60).toFixed(1).replace('.0', '');
          return (
            <View key={item.id} style={styles.legendRow}>
              <Text style={styles.legendLabel}>{item.label} - </Text>
              <Text style={styles.legendValue}>{hours} год</Text>
            </View>
          );
        })}
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  svgWrapper: {
    // Трохи повертаємо графік, щоб він починався зверху, як годинник
    transform: [{ rotate: '-90deg' }], 
  },
  legendContainer: {
    paddingHorizontal: 20,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  legendLabel: {
    fontSize: 14,
    color: '#666',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
});

export default Step6Summary;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import { useOnboarding } from '../../context/OnboardingContext';

// Список варіантів для вибору (іконки можна замінити на SVG або з react-native-vector-icons)
const OPTIONS = [
  { id: 'morning', label: 'Ранок (08:00 - 12:00)', icon: '🌅' },
  { id: 'afternoon', label: 'Обід (12:00 - 16:00)', icon: '☀️' },
  { id: 'evening', label: 'Вечір (16:00 - 20:00)', icon: '🌆' },
  { id: 'night', label: 'Нічна тиша (після 20:00)', icon: '🌙' },
  { id: 'dont_know', label: 'Не знаю', icon: '🤔' },
];

const Step3ProductiveTime = ({ navigation }) => {
  // Дістаємо наші дані та функцію оновлення з тимчасового сховища
  const { data, updateData } = useOnboarding();

  const handleNext = () => {
    // Якщо користувач нічого не вибрав, можемо не пускати його далі
    if (!data.productiveTime) {
      // Тут можна додати Alert, але для простоти просто зупиняємо функцію
      return; 
    }
    // Перехід на наступний екран
    navigation.navigate('Step4WorkStyle'); 
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={6}
      slothImage={require('../../assets/icons/sloth_hero.png')} 
      slothMessage="Коли ти можеш звернути гори?"
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      <Text style={styles.subtitle}>
        Я намагатимусь ставити найскладніші справи на твій найпродуктивніший час.
      </Text>

      <View style={styles.optionsContainer}>
        {OPTIONS.map((option) => {
          // Перевіряємо, чи цей варіант зараз вибраний у нашому контексті
          const isSelected = data.productiveTime === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected // Додаємо стилі, якщо вибрано
              ]}
              onPress={() => updateData({ productiveTime: option.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{option.icon}</Text>
              <Text style={[
                styles.optionText,
                isSelected && styles.optionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0', // Світло-сірий текст як на дизайні
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF', // Світла рамка
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  optionCardSelected: {
    borderColor: '#4A3728', // Коричнева рамка для вибраного
    backgroundColor: '#FAF8F5', // Ледь помітний кремовий фон
  },
  icon: {
    fontSize: 20,
    marginRight: 16,
  },
  optionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    fontWeight: '700', // Робимо текст жирним, якщо вибрано
    color: '#4A3728',
  },
});

export default Step3ProductiveTime;
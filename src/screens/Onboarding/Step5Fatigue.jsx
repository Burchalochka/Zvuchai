// src/screens/Onboarding/Step5Fatigue.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import { useOnboarding } from '../../context/OnboardingContext';

const OPTIONS = [
  { id: 'rarely', label: 'Рідко (повен сил)', icon: '🔋' },
  { id: 'sometimes', label: 'Буває 2-3 рази на тиждень', icon: '🪫' },
  { id: 'almost_daily', label: 'Майже щодня (треба відпочинок)', icon: '🔌' },
];

const Step5Fatigue = ({ navigation }) => {
  const { data, updateData } = useOnboarding();

  const handleNext = () => {
    if (!data.fatigueLevel) return;
    navigation.navigate('Step6Summary'); // Перехід на фінальний екран №6
  };

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={6}
      slothImage={require('../../assets/icons/sloth_hero.png')}
      slothMessage="І останнє, чесно про втому"
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      <Text style={styles.subtitle}>Як часто ти відчуваєш сильне виснаження наприкінці дня?</Text>

      <View style={styles.optionsContainer}>
        {OPTIONS.map((option) => {
          const isSelected = data.fatigueLevel === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => updateData({ fatigueLevel: option.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{option.icon}</Text>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  subtitle: { fontSize: 14, color: '#A0A0A0', marginBottom: 24, lineHeight: 20 },
  optionsContainer: { flex: 1 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#EFEFEF', marginBottom: 12, backgroundColor: '#FFFFFF' },
  optionCardSelected: { borderColor: '#4A3728', backgroundColor: '#FAF8F5' },
  icon: { fontSize: 20, marginRight: 16 },
  optionText: { fontSize: 15, color: '#333', fontWeight: '500' },
  optionTextSelected: { fontWeight: '700', color: '#4A3728' },
});

export default Step5Fatigue;
// src/screens/Onboarding/Step4WorkStyle.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import { useOnboarding } from '../../context/OnboardingContext';

const Step4WorkStyle = ({ navigation }) => {
  const { data, updateData } = useOnboarding();

  const handleNext = () => {
    // Перевіряємо, чи користувач відповів на всі 3 питання на цьому екрані
    if (!data.workType || !data.workFormat || !data.hasDistractions) return;
    navigation.navigate('Step5Fatigue');
  };

  // Допоміжна функція для малювання кнопок
  const renderOption = (currentValue, targetValue, label, icon, updateField) => {
    const isSelected = currentValue === targetValue;
    return (
      <TouchableOpacity
        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
        onPress={() => updateData({ [updateField]: targetValue })}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={6}
      slothImage={require('../../assets/icons/sloth_hero.png')}
      slothMessage="Трохи про твій стиль роботи"
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Це допоможе мені правильно розраховувати час на перерви, щоб ти не вигорав.</Text>

        <Text style={styles.sectionTitle}>Тип праці:</Text>
        {renderOption(data.workType, 'mental', 'Більше розумова праця', '🧠', 'workType')}
        {renderOption(data.workType, 'physical', 'Більше фізична праця', '💪', 'workType')}

        <Text style={styles.sectionTitle}>Формат роботи:</Text>
        {renderOption(data.workFormat, 'single_tasking', 'Фокус на одному (Single-tasking)', '🎯', 'workFormat')}
        {renderOption(data.workFormat, 'multi_tasking', 'Багато справ (Multi-tasking)', '🤹', 'workFormat')}

        <Text style={styles.sectionTitle}>Діти або домашні улюбленці:</Text>
        {renderOption(data.hasDistractions, 'yes', 'Так, бувають сюрпризи', '🐕', 'hasDistractions')}
        {renderOption(data.hasDistractions, 'no', 'Немає', '🧘', 'hasDistractions')}
      </ScrollView>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  subtitle: { fontSize: 14, color: '#A0A0A0', marginBottom: 20, lineHeight: 20 },
  sectionTitle: { fontSize: 13, color: '#666', marginBottom: 10, marginTop: 10, fontWeight: '600' },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EFEFEF', marginBottom: 10, backgroundColor: '#FFFFFF' },
  optionCardSelected: { borderColor: '#4A3728', backgroundColor: '#FAF8F5' },
  icon: { fontSize: 20, marginRight: 12 },
  optionText: { fontSize: 14, color: '#333', fontWeight: '500' },
  optionTextSelected: { fontWeight: '700', color: '#4A3728' },
});

export default Step4WorkStyle;
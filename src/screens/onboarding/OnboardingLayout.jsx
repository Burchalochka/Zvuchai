// src/screens/Onboarding/OnboardingLayout.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';

// Обгортка для всіх екранів онбордингу
const OnboardingLayout = ({ 
  children,           // Унікальний контент екрана (слайдери, кнопки тощо)
  currentStep,        // Поточний крок (від 1 до 6)
  totalSteps = 6,     // Всього кроків
  slothImage,         // Картинка лінивця для цього екрана
  slothMessage,       // Текст у хмарці біля лінивця
  onNext,             // Функція, що виконується при натисканні "Далі"
  onBack,             // Функція для кнопки "Назад"
  nextButtonText = "Далі" // Текст на кнопці (можна змінити на останньому екрані)
}) => {
  
  // Вираховуємо ширину смуги прогресу у відсотках
  const progressWidth = `${(currentStep / totalSteps) * 100}%`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* 1. Верхня панель: Кнопка "Назад" та Прогрес-бар */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
        </View>

        {/* 2. Блок із лінивцем та підказкою */}
        <View style={styles.slothContainer}>
          <Image source={slothImage} style={styles.slothImage} resizeMode="contain" />
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{slothMessage}</Text>
          </View>
        </View>

        {/* 3. Основний контент (змінюється на кожному екрані) */}
        <View style={styles.contentContainer}>
          {children}
        </View>

        {/* 4. Кнопка "Далі" */}
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>{nextButtonText}</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    paddingRight: 15,
  },
  backArrow: {
    fontSize: 24,
    color: '#333',
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#EAEAEA',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A3728', // Темно-коричневий колір із дизайну
    borderRadius: 3,
  },
  slothContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  slothImage: {
    width: 80,
    height: 80,
    marginRight: 10,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 15,
    borderTopLeftRadius: 0, // Робимо хвостик хмарки
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  speechText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    // Тут контент буде займати весь вільний простір між лінивцем і кнопкою
  },
  nextButton: {
    backgroundColor: '#4A3728',
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingLayout;
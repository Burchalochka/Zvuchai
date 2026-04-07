import React, { createContext, useState, useContext } from 'react';

// 1. Створюємо сам контекст
const OnboardingContext = createContext(undefined);

// 2. Створюємо Провайдер — компонент, який огорне наші екрани онбордингу
export const OnboardingProvider = ({ children }) => {
  // Тут ми зберігаємо всі тимчасові відповіді користувача з 6 екранів
  const [data, setData] = useState({
    sleepSchedule: null,
    deadZones: [],
    productiveTime: null,
    workType: null,
    workFormat: null,
    hasDistractions: null,
    fatigueLevel: null,
  });

  // Функція для зручного оновлення лише частини даних
  // Наприклад, на першому екрані ми викличемо: updateData({ sleepSchedule: { start: '23:00', end: '07:00' } })
  const updateData = (newData) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  // Функція для очищення даних (викличемо її на останньому екрані після збереження в MMKV)
  const clearData = () => {
    setData({
      sleepSchedule: null,
      deadZones: [],
      productiveTime: null,
      workType: null,
      workFormat: null,
      hasDistractions: null,
      fatigueLevel: null,
    });
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, clearData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

// 3. Створюємо зручний хук для використання у компонентах
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding повинен використовуватися всередині OnboardingProvider');
  }
  
  return context;
};
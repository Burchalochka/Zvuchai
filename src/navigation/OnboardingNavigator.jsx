import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingProvider } from '../context/OnboardingContext';

// Імпортуємо всі 6 наших екранів онбордингу
import Step1Sleep from '../screens/Onboarding/Step1Sleep';
import Step2DeadZones from '../screens/Onboarding/Step2DeadZones';
import Step3ProductiveTime from '../screens/Onboarding/Step3ProductiveTime';
import Step4WorkStyle from '../screens/Onboarding/Step4WorkStyle';
import Step5Fatigue from '../screens/Onboarding/Step5Fatigue';
import Step6Summary from '../screens/Onboarding/Step6Summary';

const Stack = createNativeStackNavigator();

const OnboardingNavigator = () => {
  return (
    // Обгортаємо навігатор у Provider, щоб усі екрани мали спільне сховище даних
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Step1Sleep" component={Step1Sleep} />
        <Stack.Screen name="Step2DeadZones" component={Step2DeadZones} />
        <Stack.Screen name="Step3ProductiveTime" component={Step3ProductiveTime} />
        <Stack.Screen name="Step4WorkStyle" component={Step4WorkStyle} />
        <Stack.Screen name="Step5Fatigue" component={Step5Fatigue} />
        <Stack.Screen name="Step6Summary" component={Step6Summary} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
};

export default OnboardingNavigator;
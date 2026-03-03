import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import { TasksProvider } from './src/context/TasksContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { ModalProvider, useModal } from './src/context/ModalContext';
import { SelectedDateProvider } from './src/context/SelectedDateContext';
import AddItemModal from './src/components/common/AddItemModal';
import { useTasks } from './src/context/TasksContext';
import { COLORS } from './src/styles/theme';

const navigationRef = createNavigationContainerRef();

const AppContent = () => {
  const { isAddModalVisible, closeAddModal } = useModal();
  const { addTask, addHabit } = useTasks();
  const [showSplash, setShowSplash] = useState(true);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setShowLanguageSelection(true);
  };

  const handleLanguageSelected = () => {
    setShowLanguageSelection(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (showLanguageSelection) {
    return <LanguageSelectionScreen onLanguageSelected={handleLanguageSelected} />;
  }

  return (
    <>
      <View style={styles.container}>
        <AppNavigator />
      </View>
      <AddItemModal
        visible={isAddModalVisible}
        onClose={closeAddModal}
        onAddTask={addTask}
        onAddHabit={addHabit}
      />
    </>
  );
};

const App = () => {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: COLORS.background,
    },
  };
  return (
    <SafeAreaProvider style={styles.safeArea}>
      <NavigationContainer
        ref={navigationRef}
        theme={navTheme}
      >
        <LanguageProvider>
          <TasksProvider>
            <SelectedDateProvider>
              <ModalProvider>
                <AppContent />
              </ModalProvider>
            </SelectedDateProvider>
          </TasksProvider>
        </LanguageProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default App;
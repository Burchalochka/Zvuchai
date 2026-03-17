import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import { TasksProvider, useTasks } from './src/context/TasksContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { ModalProvider, useModal } from './src/context/ModalContext';
import { SelectedDateProvider } from './src/context/SelectedDateContext';
import AddItemModal from './src/components/common/AddItemModal';
import { COLORS } from './src/styles/theme';

const navigationRef = createNavigationContainerRef<any>();

const AppContent = () => {
  const { isAddModalVisible, closeAddModal, openAddModal } = useModal();
  const { addTask, addHabit } = useTasks();
  const insets = useSafeAreaInsets();

  const [showSplash, setShowSplash] = useState(true);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [fabMode, setFabMode] = useState('plus');
  const [currentRouteName, setCurrentRouteName] = useState('');

  useEffect(() => {
    const updateRoute = () => {
      const route = navigationRef.getCurrentRoute();
      setCurrentRouteName(route?.name ?? '');
    };

    updateRoute();

    const unsubscribe = navigationRef.addListener('state', updateRoute);

    return () => {
      unsubscribe();
    };
  }, []);

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
    return (
      <LanguageSelectionScreen onLanguageSelected={handleLanguageSelected} />
    );
  }

  return (
    <>
      <View style={styles.container}>
        <AppNavigator />

        {currentRouteName !== 'Microphone' && (
          <View
            style={[styles.fabWrapper, { bottom: 80 + insets.bottom - 4 }]}
            pointerEvents="box-none"
          >
            <View style={styles.fabPanel}>
              <TouchableOpacity
                style={[
                  styles.fabSegment,
                  styles.fabSegmentLeft,
                  fabMode === 'plus' ? styles.fabSegmentActive : null,
                ]}
                onPress={() => {
                  setFabMode('plus');
                  openAddModal();
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={
                    fabMode === 'plus'
                      ? require('./src/assets/icons/Group-5.png')
                      : require('./src/assets/icons/Group-6.png')
                  }
                  style={styles.fabIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.fabSegment,
                  styles.fabSegmentRight,
                  fabMode === 'voice' ? styles.fabSegmentActive : null,
                ]}
                onPress={() => {
                  setFabMode('voice');
                  if (navigationRef.isReady()) {
                    navigationRef.navigate('Microphone');
                  }
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={
                    fabMode === 'voice'
                      ? require('./src/assets/icons/Group-8.png')
                      : require('./src/assets/icons/Group-7.png')
                  }
                  style={styles.fabIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
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
      <NavigationContainer ref={navigationRef} theme={navTheme}>
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
  fabWrapper: {
    position: 'absolute',
    right: 12,
    bottom: 0,
  },
  fabPanel: {
    flexDirection: 'row',
    width: 108,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.panel,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  fabSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.panel,
  },
  fabSegmentLeft: {
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  fabSegmentRight: {
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  fabSegmentActive: {
    backgroundColor: COLORS.accentBrown,
  },
  fabIcon: {
    width: 24,
    height: 24,
  },
});

export default App;

import MicrophoneScreen from '../screens/MicrophoneScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import GoalsScreen from '../screens/GoalsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import InboxScreen from '../screens/InboxScreen';
import SplashScreen from '../screens/SplashScreen';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { COLORS, SPACING, FONTS } from '../styles/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabBarBackground = () => (
  <View
    style={[styles.tabBgWrapper, { backgroundColor: COLORS.panel }]}
    pointerEvents="none"
  />
);

const AppNavigator = () => {
  const { language } = useLanguage();
  const customTabBar = useMemo(() => props => <BottomTabBar {...props} />, []);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={customTabBar}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 12,
          paddingTop: 12,
          elevation: 0,
          borderTopLeftRadius: 40, // 50% от высоты панели (80)
          borderTopRightRadius: 40,
          overflow: 'hidden',
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarActiveTintColor: COLORS.textDark,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: FONTS.sizes.sm,
          fontWeight: '500',
          fontFamily: 'Montserrat-Medium',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          tabBarLabel: () => (
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Montserrat-Medium',
                fontWeight: '500',
                marginTop: 4,
                color: '#000000',
                letterSpacing: 0,
              }}
            >
              {getTranslation('inbox', language)}
            </Text>
          ),
          tabBarIcon: () => (
            <Image
              source={require('../assets/icons/24e9ba9bffd9a673b4a6a0f17a886d7d5e4b0aea.png')}
              style={{
                width: 24,
                height: 24,
                borderRadius: 0,
                opacity: 1,
                tintColor: '#000000',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Montserrat-Medium',
                fontWeight: '500',
                marginTop: 4,
                color: '#090808',
                letterSpacing: 0,
                textDecorationLine: focused ? 'underline' : 'none',
              }}
            >
              {getTranslation('home', language)}
            </Text>
          ),
          tabBarBackground: () => <TabBarBackground />,
          tabBarIcon: () => (
            <Image
              source={require('../assets/icons/9e70623cbed2c3b364216a3f594eec13751b4b0f.png')}
              style={{
                width: 24,
                height: 24,
                borderRadius: 0,
                opacity: 1,
                tintColor: '#090808',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarLabel: () => (
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Montserrat-Medium',
                fontWeight: '500',
                marginTop: 4,
                color: '#090808',
                letterSpacing: 0,
              }}
            >
              {getTranslation('goals', language)}
            </Text>
          ),
          tabBarIcon: () => (
            <Image
              source={require('../assets/icons/151f1a456a7563e9ac628c21059079c47ecfda19.png')}
              style={{
                width: 24,
                height: 24,
                borderRadius: 0,
                opacity: 1,
                tintColor: '#090808',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: () => (
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Montserrat-Medium',
                fontWeight: '500',
                marginTop: 4,
                color: '#090808',
                letterSpacing: 0,
              }}
            >
              {getTranslation('analytics', language)}
            </Text>
          ),
          tabBarIcon: () => (
            <Image
              source={require('../assets/icons/d639ce3cb8b74bfcb16ca887f2dae89cd8cdfdbf.png')}
              style={{
                width: 26,
                height: 24,
                borderRadius: 0,
                opacity: 1,
                tintColor: '#090808',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBgWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
});

const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Tabs" component={AppNavigator} />
      <Stack.Screen name="Microphone" component={MicrophoneScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;

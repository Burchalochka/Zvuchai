import MicrophoneScreen from '../screens/MicrophoneScreen';
import EditTaskScreen from '../screens/EditTaskScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import GoalsScreen from '../screens/GoalsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import InboxScreen from '../screens/InboxScreen';
import SplashScreen from '../screens/SplashScreen';
import WeekScheduleScreen from '../screens/WeekScheduleScreen';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { COLORS, SPACING, FONTS } from '../styles/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabBarBackground = ({ color }) => (
  <View
    style={[styles.tabBgWrapper, { backgroundColor: color || COLORS.panel }]}
    pointerEvents="none"
  />
);

const AppNavigator = () => {
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const customTabBar = useMemo(() => props => <BottomTabBar {...props} />, []);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={customTabBar}
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: COLORS.background },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 80 + insets.bottom,
          paddingBottom: 12 + insets.bottom,
          paddingTop: 12,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          overflow: 'visible',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.1,
              shadowRadius: 14,
            },
            android: {
              elevation: 12,
            },
            default: {},
          }),
        },
        tabBarBackground: () => <TabBarBackground color={COLORS.panel} />,
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
          // Keep tab bar background consistent (original color)
          tabBarBackground: () => <TabBarBackground color={COLORS.panel} />,
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

      {/* Hidden tab screen: opened from Home calendar menu */}
      <Tab.Screen
        name="WeekSchedule"
        component={WeekScheduleScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
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
      <Stack.Screen name="EditTask" component={EditTaskScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import HomeScreen from '../screens/HomeScreen';
import GoalsScreen from '../screens/GoalsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import InboxScreen from '../screens/InboxScreen';
import { useModal } from '../context/ModalContext';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { COLORS, SPACING, FONTS } from '../styles/theme';

const Tab = createBottomTabNavigator();

const TabBarBackground = () => (
  <View style={styles.tabBgWrapper} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <SvgLinearGradient id="tabGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#B8EFE6" stopOpacity="1" />
          <Stop offset="1" stopColor="#D9D9D9" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#tabGrad)" />
    </Svg>
  </View>
);

const TabBarBackgroundWhite = () => (
  <View style={styles.tabBgWrapper} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <SvgLinearGradient id="tabGradWhite" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#B8EFE6" stopOpacity="1" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#tabGradWhite)" />
    </Svg>
  </View>
);

const AppNavigator = () => {
  const { openAddModal, isAddModalVisible } = useModal();
  const { language } = useLanguage();
  
  const CustomTabBarButton = ({ onPress, ...props }) => {
    const handlePress = () => {
      console.log('🔵 CustomTabBarButton pressed');
      console.log('🔵 Calling openAddModal');
      openAddModal();
    };

    return (
      <TouchableOpacity
        style={styles.customButton}
        onPress={handlePress}
        activeOpacity={0.8}
        {...props}
      >
        <View style={styles.plusInner}>
          <Icon name="add" size={20} color="#000000" />
        </View>
      </TouchableOpacity>
    );
  };
  
  const customTabBar = useMemo(() => {
    return (props) => {
      return <BottomTabBar {...props} />;
    };
  }, []);
  
  return (
      <Tab.Navigator
      initialRouteName="Home"
      tabBar={customTabBar}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 74,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 0,
          borderTopLeftRadius: 48,
          borderTopRightRadius: 48,
          overflow: 'hidden',
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.text,
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
          tabBarLabel: getTranslation('inbox', language),
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={require('../assets/icons/24e9ba9bffd9a673b4a6a0f17a886d7d5e4b0aea.png')}
              style={{ width: 24, height: 24, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: getTranslation('home', language),
          tabBarBackground: () => <TabBarBackground />,
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={require('../assets/icons/9e70623cbed2c3b364216a3f594eec13751b4b0f.png')}
              style={{ width: 24, height: 24, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={HomeScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            console.log('🟢 Tab press event fired');
            e.preventDefault();
            console.log('🟢 Calling openAddModal from tabPress');
            openAddModal();
          },
        })}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarLabel: getTranslation('goals', language),
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={require('../assets/icons/151f1a456a7563e9ac628c21059079c47ecfda19.png')}
              style={{ width: 24, height: 24, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: getTranslation('analytics', language),
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={require('../assets/icons/d639ce3cb8b74bfcb16ca887f2dae89cd8cdfdbf.png')}
              style={{ width: 24, height: 24, tintColor: color }}
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
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    overflow: 'hidden',
  },
  customButton: {
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  plusInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppNavigator;
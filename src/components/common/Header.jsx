import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SPACING } from '../../styles/theme';

const CoinsIcon = () => (
  <Image 
    source={require('../../assets/icons/a5a4adec8fdac47d2c2fd92ab26df85f4a632fe0.png')} 
    style={styles.iconImage}
    resizeMode="cover"
  />
);

const NotificationIcon = () => (
  <Image 
    source={require('../../assets/icons/1a61716eb7ee43bda19f3963a91bba0a122e907a.png')} 
    style={styles.iconImage}
    resizeMode="cover"
  />
);

const NewIcon = () => (
  <Image 
    source={require('../../assets/icons/7e9400ea77a56506ebbfe24758745f1eff24c682.png')} 
    style={styles.iconImage}
    resizeMode="cover"
  />
);

const ProgressRing = ({ size = 50, strokeWidth = 4, progress = 0.75 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;
  
  return (
    <Svg width={size} height={size} style={styles.progressRing}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#1B4332"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
    </Svg>
  );
};

const Header = () => (
  <View style={styles.container}>
    <TouchableOpacity style={styles.menuButton}>
      <NewIcon />
    </TouchableOpacity>

    <View style={styles.centerSection}>
      <View style={styles.avatarContainer}>
        <ProgressRing size={50} strokeWidth={4} progress={0.75} />
        <Image
          source={require('../../assets/icons/1211f1716d7bd92d1d47476f7d426ffaab9085b7.png')}
          style={styles.avatar}
          resizeMode="contain"
        />
      </View>
    </View>

    <View style={styles.rightSection}>
      <TouchableOpacity style={styles.iconButton}>
        <CoinsIcon />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.iconButton}>
        <NotificationIcon />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#E5E7EB',
  },
  menuButton: {
    padding: SPACING.xs,
  },
  centerSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    zIndex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconButton: {
    padding: SPACING.xs,
    position: 'relative',
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  calendarIconContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#1B4332',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  calendarIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default Header;
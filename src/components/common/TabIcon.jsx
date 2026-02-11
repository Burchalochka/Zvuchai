import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../styles/theme';

const TabIcon = ({ name, focused }) => {
  return (
    <View style={styles.container}>
      <Icon
        name={name}
        size={24}
        color={focused ? COLORS.primary : COLORS.textSecondary}
      />
      {focused && <View style={styles.indicator} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
});

export default TabIcon;
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../styles/theme';
import Header from '../components/common/Header';

export default function WeekScheduleScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <View style={styles.body}>
        <Text style={styles.weekText}>Неделя</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  weekText: {
    fontFamily: FONTS.medium,
    fontSize: 20,
    color: COLORS.textDark,
  },
});


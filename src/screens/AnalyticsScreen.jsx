import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { COLORS, SPACING, FONTS } from '../styles/theme';

const AnalyticsScreen = () => {
  const { language } = useLanguage();
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.text}>{getTranslation('analyticsScreen', language)}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.textSecondary,
  },
});

export default AnalyticsScreen;
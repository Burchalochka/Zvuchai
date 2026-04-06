import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { COLORS, FONTS, SPACING } from '../styles/theme';

export default function WeekScheduleScreen() {
  const { language } = useLanguage();
  const navigation = useNavigation();
  const [calendarMenuVisible, setCalendarMenuVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        onCalendarPress={() => {
          setCalendarMenuVisible(true);
        }}
      />
      <View style={styles.body}>
        <Text style={styles.text}>
          {getTranslation('weekSchedule', language) || 'Тиждень'}
        </Text>
      </View>

      <Modal
        visible={calendarMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.calendarMenuBackdrop}
          activeOpacity={1}
          onPress={() => setCalendarMenuVisible(false)}
        >
          <View style={styles.calendarMenuCard}>
            <TouchableOpacity
              style={styles.calendarMenuItem}
              onPress={() => {
                setCalendarMenuVisible(false);
                navigation?.navigate?.('Home');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.calendarMenuIconSlot}>
                <Image
                  source={require('../assets/icons/Vector1.png')}
                  style={styles.calendarMenuIconActive}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.calendarMenuTextInactive}>День</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.calendarMenuItem, styles.calendarMenuItemActive]}
              onPress={() => {
                setCalendarMenuVisible(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.calendarMenuIconSlot}>
                <Image
                  source={require('../assets/icons/Vector32.png')}
                  style={styles.calendarMenuIconActive}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.calendarMenuTextActive}>Тиждень</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.textSecondary,
  },
  calendarMenuBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  calendarMenuCard: {
    position: 'absolute',
    top: 72,
    right: SPACING.md,
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(69, 44, 22, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    paddingVertical: 8,
  },
  calendarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  calendarMenuItemActive: {
    backgroundColor: 'rgba(69, 44, 22, 0.20)',
    borderRadius: 5,
  },
  calendarMenuIconSlot: {
    width: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMenuIconActive: {
    width: 19,
    height: 19,
    tintColor: '#452C16',
  },
  calendarMenuTextInactive: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#282828',
    marginLeft: 10,
  },
  calendarMenuTextActive: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#452C16',
    marginLeft: 10,
  },
});


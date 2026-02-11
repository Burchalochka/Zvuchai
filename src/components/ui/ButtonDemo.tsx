import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { HoverGlowButton } from './HoverGlowButton';
import { RippleButton } from './RippleButton';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const ButtonDemo = () => {
  const { language } = useLanguage();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <HoverGlowButton
          glowColor="#00ffc3"
          backgroundColor="#000"
          textColor="#ffffff"
          hoverTextColor="#67e8f9"
          onPress={() => console.log('Hover button pressed')}
        >
          {getTranslation('hoverMe', language)}
        </HoverGlowButton>
      </View>

      <View style={styles.section}>
        <RippleButton
          variant="default"
          rippleColor="rgba(255, 255, 255, 0.5)"
          onPress={() => console.log('Default ripple pressed')}
        >
          {getTranslation('clickMe', language)}
        </RippleButton>
      </View>

      <View style={styles.section}>
        <RippleButton
          variant="ghost"
          rippleColor="rgba(0, 0, 0, 0.1)"
          onPress={() => console.log('Ghost button pressed')}
        >
          {getTranslation('pressMe', language)}
        </RippleButton>
      </View>

      <View style={styles.section}>
        <RippleButton
          variant="hover"
          hoverBaseColor="#6996e2"
          rippleColor="rgba(105, 150, 226, 0.3)"
          onPress={() => console.log('Hover variant pressed')}
        >
          {getTranslation('submit', language)}
        </RippleButton>
      </View>

      <View style={styles.section}>
        <RippleButton
          variant="hoverborder"
          hoverBorderEffectColor="#6996e277"
          hoverBorderEffectThickness={3}
          rippleColor="rgba(105, 150, 226, 0.2)"
          onPress={() => console.log('Hover border pressed')}
        >
          {getTranslation('confirm', language)}
        </RippleButton>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    marginBottom: 20,
  },
});

export { ButtonDemo };


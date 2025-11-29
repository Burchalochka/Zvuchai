import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { FONTS, SPACING, COLORS } from '../styles/theme';

const CreateAccountScreen = ({ onSignIn, onBack }) => {
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardSlideAnim = useRef(new Animated.Value(100)).current;
  const imageScale = useRef(new Animated.Value(0.8)).current;
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(cardSlideAnim, {
        toValue: 0,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.backgroundImageContainer}>
        <Animated.View
          style={[
            styles.illustrationContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: imageScale }],
            },
          ]}
        >
          <View style={styles.grayscaleContainer}>
            <Image
              source={require('../assets/icons/febfe1f99b58e1de4aefb46a9ad18521280170d3.png')}
              style={styles.illustration}
              resizeMode="cover"
            />
            <View style={styles.grayscaleOverlay} />
          </View>
        </Animated.View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: cardSlideAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.headerContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>{getTranslation('createAccount', language)}</Text>
          </Animated.View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Icon name="facebook" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Icon name="twitter" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <View style={styles.googlePlusContainer}>
                <Text style={styles.googlePlusText}>G</Text>
                <Text style={styles.googlePlusPlus}>+</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.orText}>{getTranslation('orUseEmail', language)}</Text>

          <View style={styles.formGroup}>
            <View style={styles.emailInputContainer}>
              <Text style={styles.emailLabel}>{getTranslation('emailAddress', language)}</Text>
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder={getTranslation('emailPlaceholder', language)}
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={getTranslation('name', language)}
              placeholderTextColor="#6B7280"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={getTranslation('password', language)}
              placeholderTextColor="#6B7280"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => {
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>{getTranslation('register', language)}</Text>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>{getTranslation('alreadyHaveAccount', language)} </Text>
            <TouchableOpacity onPress={onSignIn} activeOpacity={0.7}>
              <Text style={styles.signInLink}>{getTranslation('signIn', language)}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  backgroundImageContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  illustrationContainer: {
    width: '100%',
    height: '55%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'absolute',
    top: -120,
    paddingTop: 0,
  },
  grayscaleContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  illustration: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  grayscaleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(150, 150, 150, 0.6)',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: '55%',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  socialButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  googlePlusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googlePlusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
  },
  googlePlusPlus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 2,
    fontFamily: 'Montserrat-Bold',
  },
  orText: {
    fontSize: FONTS.sizes.sm,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontFamily: 'Montserrat-Regular',
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: '#1B4332',
    marginBottom: SPACING.sm,
    fontFamily: 'Montserrat-SemiBold',
  },
  emailInputContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  emailLabel: {
    position: 'absolute',
    top: -10,
    left: SPACING.lg,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    fontSize: FONTS.sizes.sm,
    color: '#4B5563',
    fontFamily: 'Montserrat-Regular',
  },
  emailInput: {
    fontSize: FONTS.sizes.md,
    color: '#000000',
    fontFamily: 'Montserrat-Regular',
    paddingTop: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: FONTS.sizes.md,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#4B5563',
    fontFamily: 'Montserrat-Regular',
  },
  registerButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: SPACING.md + 6,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  registerButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  signInText: {
    fontSize: FONTS.sizes.sm,
    color: '#6B7280',
    fontFamily: 'Montserrat-Regular',
  },
  signInLink: {
    fontSize: FONTS.sizes.sm,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
});

export default CreateAccountScreen;


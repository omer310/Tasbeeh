import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;
const scale = width / 375; // 375 is standard iPhone width

const normalize = (size) => {
  return Math.round(scale * size);
};

const onboardingData = [
  {
    type: 'language',
    title: 'Choose Your Language',
    titleAr: 'اختر لغتك',
    options: [
      { label: 'English', value: 'en' },
      { label: 'العربية', value: 'ar' }
    ]
  },
  {
    title: 'Welcome To Manarat Al-Muslim',
    titleAr: 'مرحباً بك في منارة المسلم',
    description: 'Manarat Al-Muslim is your companion for prayer times, Quran, Dhikr, Duas, Hadith, and more. Designed to support your spiritual journey.',
    descriptionAr: 'منارة المسلم هي رفيقك لمواقيت الصلاة والقرآن والذكر والدعاء والحديث والمزيد. مصممة لدعم رحلتك الروحانية.',
    image: require('../assets/welcome.png')
  },
  {
    title: 'Prayer Times',
    titleAr: 'مواقيت الصلاة',
    description: 'Get accurate prayer times based on your location, with reminders to never miss a prayer.',
    descriptionAr: 'احصل على مواقيت دقيقة للصلاة بناءً على موقعك، مع تذكيرات لعدم تفويت أي صلاة.',
    image: require('../assets/prayer.png')
  },
  {
    title: 'Quran',
    titleAr: 'القرآن الكريم',
    description: 'Access the Quran in Arabic and English.',
    descriptionAr: 'اقرأ القرآن الكريم باللغتين العربية والإنجليزية.',
    image: require('../assets/quran.png')
  },
  {
    title: 'Tasbeeh and Duas',
    titleAr: 'التسبيح والأدعية',
    description: 'Count your Tasbeeh easily and explore a collection of powerful Duas.',
    descriptionAr: 'عدّ تسبيحك بسهولة واستكشف مجموعة من الأدعية المأثورة.',
    image: require('../assets/tasbeeh2.png')
  },
  {
    title: 'Hadith & Islamic Calendar',
    titleAr: 'الحديث والتقويم الإسلامي',
    description: 'Discover authentic Hadith and stay aligned with important Islamic dates.',
    descriptionAr: 'اكتشف الأحاديث الصحيحة وتابع المناسبات الإسلامية المهمة.',
    image: require('../assets/hadith.png')
  },
  {
    title: 'A Charity for All',
    titleAr: 'صدقة جارية',
    description: 'Manarat Al-Muslim is more than an app—it\'s an ongoing Sadaqah. By using it, you gain blessings while contributing to a legacy of faith and charity for my beloved grandmothers, Fathia Al-Tahir Asakir and Suad Abd Al-Rahim Abu Aqla.',
    descriptionAr: 'منارة المسلم أكثر من مجرد تطبيق - إنها صدقة جارية. باستخدامك لها، تكسب الأجر مع المساهمة في إرث من الإيمان والصدقة لجدتيّ الحبيبتين، فتحية الطاهر عساكر وسعاد عبد الرحيم أبو عقلة.',
    image: require('../assets/charity.png')
  }
];

const Onboarding = ({ navigation, onComplete, changeLanguage }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const scrollViewRef = useRef(null);

  const handleLanguageSelect = async (language) => {
    setSelectedLanguage(language);
    await changeLanguage(language);
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const currentIndex = Math.round(contentOffset.x / width);
    setCurrentIndex(currentIndex);
  };

  const handleNext = () => {
    if (currentIndex === 0 && !selectedLanguage) {
      // Don't proceed if language isn't selected
      return;
    }

    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true
      });
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const renderLanguageSlide = () => (
    <View style={[styles.languageSlide, styles.centerSlide]}>
      <View style={styles.languageContent}>
        <Text style={styles.title}>{onboardingData[0].title}</Text>
        <Text style={[styles.title, styles.arabicTitle]}>{onboardingData[0].titleAr}</Text>
        <View style={styles.languageOptions}>
          {onboardingData[0].options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.languageButton,
                selectedLanguage === option.value && styles.selectedLanguageButton
              ]}
              onPress={() => handleLanguageSelect(option.value)}
            >
              <Text style={[
                styles.languageButtonText,
                selectedLanguage === option.value && styles.selectedLanguageButtonText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderContentSlide = (item, index) => (
    <View style={styles.slide}>
      {item.image && (
        <Image 
          source={item.image}
          style={styles.image}
          resizeMode="contain"
        />
      )}
      <Text style={styles.title}>
        {selectedLanguage === 'ar' ? item.titleAr : item.title}
      </Text>
      <Text style={styles.description}>
        {selectedLanguage === 'ar' ? item.descriptionAr : item.description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>MANARAT</Text>
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {onboardingData.map((item, index) => (
          <View key={index} style={styles.slide}>
            {item.type === 'language' 
              ? renderLanguageSlide()
              : renderContentSlide(item, index)
            }
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive
              ]}
            />
          ))}
        </View>

        <TouchableOpacity 
          onPress={handleNext}
          disabled={currentIndex === 0 && !selectedLanguage}
        >
          <LinearGradient
            colors={['#2d8a5c', '#4CAF50']}
            style={[
              styles.button,
              currentIndex === 0 && !selectedLanguage && styles.buttonDisabled
            ]}
          >
            <Text style={styles.buttonText}>
              {currentIndex === onboardingData.length - 1 
                ? (selectedLanguage === 'ar' ? 'دخول' : 'Enter')
                : (selectedLanguage === 'ar' ? 'التالي' : 'Next')
              }
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  header: {
    padding: normalize(20),
    alignItems: 'flex-start'
  },
  logo: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: '#2d8a5c',
    top: normalize(20)
  },
  scrollContent: {
    flexGrow: 1,
  },
  slide: {
    width: width,
    alignItems: 'center',
    paddingHorizontal: width * 0.1, // 10% of screen width
    justifyContent: 'center',
  },
  image: {
    width: width * 0.7, // 70% of screen width
    height: height * 0.35, // 35% of screen height
    marginBottom: isSmallDevice ? normalize(20) : normalize(40),
  },
  title: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    marginBottom: normalize(16),
    textAlign: 'center',
    color: '#2d8a5c'
  },
  description: {
    fontSize: normalize(16),
    textAlign: 'center',
    color: '#666666',
    lineHeight: normalize(24),
    paddingHorizontal: width * 0.05, // 5% padding on sides
  },
  footer: {
    padding: normalize(20),
    paddingBottom: isSmallDevice ? normalize(10) : normalize(20),
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: isSmallDevice ? normalize(10) : normalize(20),
  },
  paginationDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: '#D9D9D9',
    marginHorizontal: normalize(4)
  },
  paginationDotActive: {
    backgroundColor: '#2d8a5c',
    width: normalize(20)
  },
  button: {
    paddingVertical: isSmallDevice ? normalize(12) : normalize(16),
    borderRadius: normalize(12),
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: normalize(16),
    fontWeight: 'bold'
  },
  languageSlide: {
    alignItems: 'center',
    paddingHorizontal: width * 0.1,
    width: width,
  },
  languageOptions: {
    marginTop: isSmallDevice ? normalize(20) : normalize(40),
    width: '100%',
  },
  languageButton: {
    paddingVertical: isSmallDevice ? normalize(12) : normalize(16),
    paddingHorizontal: normalize(32),
    borderRadius: normalize(12),
    borderWidth: 2,
    borderColor: '#2d8a5c',
    marginBottom: normalize(16),
    alignItems: 'center',
  },
  selectedLanguageButton: {
    backgroundColor: '#2d8a5c',
  },
  languageButtonText: {
    fontSize: normalize(18),
    fontWeight: 'bold',
    color: '#2d8a5c',
  },
  selectedLanguageButtonText: {
    color: '#FFFFFF',
  },
  arabicTitle: {
    fontFamily: 'Scheherazade',
    marginTop: normalize(8),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  centerSlide: {
    flex: 1,
    justifyContent: 'center',
  },
  languageContent: {
    alignItems: 'center',
    width: '100%',
  },
});

export default Onboarding;
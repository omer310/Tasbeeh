import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import PrayerTimeSettings from './PrayerTimeSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdhanPreferenceModel from './AdhanPreferencesModal';

const PrayerTimes = ({ themeColors, language }) => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [location, setLocation] = useState(null);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [settings, setSettings] = useState({
    showImsak: false,
    autoDetectLocation: true,
    automaticSettings: true,
    location: 'United States'
  });
  const [adhanModalVisible, setAdhanModalVisible] = useState(false);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState('');

  // Add translations
  const translations = {
    prayerTimes: { en: 'Prayer Times', ar: 'أوقات الصلاة' },
    today: { en: 'Today', ar: 'اليوم' },
    nextPrayer: { en: 'Next Prayer', ar: 'الصلاة القادمة' },
    in: { en: 'in', ar: 'في' },
    fajr: { en: 'Fajr', ar: 'الفجر' },
    sunrise: { en: 'Sunrise', ar: 'الشروق' },
    dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
    asr: { en: 'Asr', ar: 'العصر' },
    maghrib: { en: 'Maghrib', ar: 'المغرب' },
    isha: { en: 'Isha', ar: 'العشاء' },
    imsak: { en: 'Imsak', ar: 'الإمساك' },
    next: { en: 'Next', ar: 'التالي' },
  };

  const getTranslatedText = (key) => {
    return translations[key][language] || key;
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.autoDetectLocation) {
      detectLocation();
    } else {
      fetchPrayerTimes(settings.location);
    }
  }, [settings]);

  useEffect(() => {
    if (prayerTimes) {
      console.log('Prayer times:', prayerTimes);
      console.log('Current date:', new Date().toLocaleString());
      const timer = setInterval(() => {
        try {
          const next = getNextPrayer();
          setNextPrayer(next);
          const countdownTime = getCountdown(next);

          setCountdown(countdownTime);
        } catch (error) {
          console.error('Error updating countdown:', error);
          setCountdown('00:00:00');
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [prayerTimes]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('prayerTimeSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const detectLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      return;
    }

    let locationResult = await Location.getCurrentPositionAsync({});
    setLocation(locationResult);
    fetchPrayerTimes(locationResult.coords.latitude, locationResult.coords.longitude);
  };

  const fetchPrayerTimes = async (latitude, longitude) => {
    try {
      const response = await axios.get(`https://api.aladhan.com/v1/timings`, {
        params: {
          latitude,
          longitude,
          method: 'auto',
        },
      });
      console.log('API response:', response.data);
      setPrayerTimes(response.data.data.timings);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
    }
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    AsyncStorage.setItem('prayerTimeSettings', JSON.stringify(newSettings));
  };

  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    for (let prayer of prayers) {
      const [hours, minutes] = prayerTimes[prayer].split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
  
      if (prayerTime > currentTime) return prayer;
    }
    return 'Fajr';
  };

  const getCountdown = (prayer) => {
    if (!prayerTimes || !prayer) return '';
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = prayerTimes[prayer].split(':').map(Number);
    let prayerTime = hours * 60 + minutes;
    
    // If the prayer time has already passed today, set it for tomorrow
    if (prayerTime <= currentTime) {
      prayerTime += 24 * 60;
    }
    
    let diff = prayerTime - currentTime;
    
    // Ensure diff is positive
    if (diff < 0) return '00:00:00';
    
    const diffHours = Math.floor(diff / 60);
    const diffMinutes = diff % 60;
    const diffSeconds = Math.floor((now.getSeconds() / 60) * 60);
    
    return `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`;
  };

  const renderPrayerTime = (prayer) => {
    if (!prayerTimes) return null;
    const isNext = nextPrayer === prayer;
    const iconSource = getPrayerIcon(prayer);

    return (
      <TouchableOpacity 
        key={prayer}
        style={[styles.prayerItem, isNext && styles.nextPrayer]}
        onPress={() => {
          setSelectedPrayer(prayer);
          setAdhanModalVisible(true);
        }}
      >
        <View style={styles.leftContent}>
          <View style={styles.iconContainer}>
            {iconSource ? (
              <Image 
                source={iconSource} 
                style={[styles.icon, prayer === 'Asr' && styles.asrIcon]}
                resizeMode="contain"
              />
            ) : (
              <Ionicons 
                name={getPrayerIconName(prayer)}
                size={24}
                color={themeColors.textColor}
              />
            )}
          </View>
          <View style={styles.prayerInfo}>
            <Text style={[styles.prayerName, { color: themeColors.textColor }]}>
              {getTranslatedText(prayer.toLowerCase())}
            </Text>
            {prayer === 'Fajr' && (
              <Text style={[styles.sunriseTime, { color: themeColors.secondaryTextColor }]}>
                {getTranslatedText('sunrise')} {prayerTimes['Sunrise']}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.prayerTimeContainer}>
          <Text style={[styles.prayerTime, { color: themeColors.activeTabColor }]}>
            {prayerTimes[prayer]}
          </Text>
          {isNext && (
            <View style={styles.nextIndicator}>
              <Ionicons name="time-outline" size={16} color={themeColors.activeTabColor} />
              <Text style={[styles.nextText, { color: themeColors.activeTabColor }]}>
                {getTranslatedText('next')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getPrayerIcon = (prayer) => {
    switch (prayer) {
      case 'Fajr': return require('../assets/fajir.png');
      case 'Dhuhr': return require('../assets/dhur.png');
      case 'Asr': return require('../assets/asr.png');
      case 'Maghrib': return require('../assets/magrib.png');
      case 'Isha': return require('../assets/Isha.png');
      default: return null;
    }
  };

  const getPrayerIconName = (prayer) => {
    switch (prayer) {
      case 'Imsak': return 'sunny';
      case 'Midnight': return 'moon';
      case 'Lastthird': return 'partly-sunny';
      case 'Firstthird': return 'partly-sunny';
      default: return 'prayer-time';
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/islamic-pattern2.png')} 
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Prayer Times</Text>
          <TouchableOpacity onPress={() => setSettingsModalVisible(true)}>
            <Text style={[styles.subtitle, { color: themeColors.secondaryTextColor }]}>
              {settings.location}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.date, { color: themeColors.textColor }]}>
            Today, {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long' })}
          </Text>
          {nextPrayer && (
            <Text style={[styles.countdown, { color: themeColors.activeTabColor }]}>
              Next Prayer: {getTranslatedText(nextPrayer.toLowerCase())} {getTranslatedText('in')} {countdown}
            </Text>
          )}
        </View>
        <ScrollView style={styles.scrollView}>
          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(renderPrayerTime)}
          {settings.showImsak && renderPrayerTime('Imsak')}
        </ScrollView>
        <PrayerTimeSettings 
          isVisible={settingsModalVisible}
          onClose={() => setSettingsModalVisible(false)}
          themeColors={themeColors}
          onSettingsChange={handleSettingsChange}
          language={language}
        />
        <AdhanPreferenceModel
          isVisible={adhanModalVisible}
          onClose={() => setAdhanModalVisible(false)}
          prayer={selectedPrayer}
          themeColors={themeColors}
          language={language}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    opacity: 0.7, 
    width: '100%', 
    height: '100%', 

  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Add a slight overlay to improve text readability
  },
  header: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black', 
  },
  subtitle: {
    fontSize: 16,
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  nextPrayer: {
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: '100%',
    height: '100%',
    maxWidth: 60,
    maxHeight: 60,
  },
  asrIcon: {
    maxWidth: 34,
    maxHeight: 34,
  },
  prayerInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  prayerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sunriseTime: {
    fontSize: 14,
  },
  prayerTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  prayerTime: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  countdown: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  nextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  nextText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default PrayerTimes;

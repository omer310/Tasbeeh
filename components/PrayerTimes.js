import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Modal, FlatList, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const adhanOptions = [
  { id: 'adhan', name: 'Sudaesse Adhan', file: require('../assets/adhan.mp3') },
  { id: 'madinah-adhan', name: 'Makkah Adhan', file: require('../assets/makkah-adhan.mp3') },
  { id: 'makkah-adhan', name: 'Madinah Adhan', file: require('../assets/madinah-adhan.mp3') },
  // Add more Adhan options as needed
];

export default function PrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState({});
  const [nextPrayer, setNextPrayer] = useState('');
  const [nextPrayerTime, setNextPrayerTime] = useState(null);
  const [adhanSelections, setAdhanSelections] = useState({
    Fajr: adhanOptions[0],
    Dhuhr: adhanOptions[0],
    Asr: adhanOptions[0],
    Maghrib: adhanOptions[0],
    Isha: adhanOptions[0],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState('');
  const [sound, setSound] = useState();
  const [playingAdhan, setPlayingAdhan] = useState(null);
  const [adhanSettings, setAdhanSettings] = useState({
    Fajr: { mode: 'sound', useGlobal: true },
    Dhuhr: { mode: 'sound', useGlobal: true },
    Asr: { mode: 'sound', useGlobal: true },
    Maghrib: { mode: 'sound', useGlobal: true },
    Isha: { mode: 'sound', useGlobal: true },
  });
  const [globalAdhanSetting, setGlobalAdhanSetting] = useState('sound');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    fetchPrayerTimes();
    loadAdhanSettings();
    registerForPushNotificationsAsync();

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });

    return () => {
      if (adhanTimer) clearTimeout(adhanTimer);
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const fetchPrayerTimes = async () => {
    try {
      const response = await axios.get('https://api.aladhan.com/v1/timingsByCity', {
        params: {
          city: 'New York',
          country: 'United States',
          method: 2,
        },
      });
      setPrayerTimes(response.data.data.timings);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
    }
  };

  const loadAdhanSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('adhanSettings');
      if (savedSettings) {
        setAdhanSettings(JSON.parse(savedSettings));
      }
      const savedGlobalSetting = await AsyncStorage.getItem('globalAdhanSetting');
      if (savedGlobalSetting) {
        setGlobalAdhanSetting(savedGlobalSetting);
      }
    } catch (error) {
      console.error('Error loading adhan settings:', error);
    }
  };

  const saveAdhanSettings = async () => {
    try {
      await AsyncStorage.setItem('adhanSettings', JSON.stringify(adhanSettings));
      await AsyncStorage.setItem('globalAdhanSetting', globalAdhanSetting);
    } catch (error) {
      console.error('Error saving adhan settings:', error);
    }
  };

  useEffect(() => {
    if (Object.keys(prayerTimes).length > 0) {
      const next = getNextPrayer();
      setNextPrayer(next.prayer);
      setNextPrayerTime(next.time);
      scheduleAdhan(next.time);
    }
  }, [prayerTimes]);

  const getNextPrayer = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (let prayer of prayers) {
      const [hours, minutes] = prayerTimes[prayer].split(':');
      const prayerTime = parseInt(hours) * 60 + parseInt(minutes);
      if (prayerTime > currentTime) {
        // Ensure the next prayer has a setting in adhanSettings
        if (!adhanSettings[prayer]) {
          setAdhanSettings(prev => ({
            ...prev,
            [prayer]: { mode: 'sound', useGlobal: true }
          }));
        }
        return { prayer, time: prayerTime };
      }
    }
    // If no prayer is found, default to Fajr of the next day
    if (!adhanSettings['Fajr']) {
      setAdhanSettings(prev => ({
        ...prev,
        'Fajr': { mode: 'sound', useGlobal: true }
      }));
    }
    return { prayer: 'Fajr', time: parseInt(prayerTimes['Fajr'].split(':')[0]) * 60 + parseInt(prayerTimes['Fajr'].split(':')[1]) };
  };

  let adhanTimer = null;

  const scheduleAdhan = (prayerTime) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    let timeUntilAdhan = prayerTime - currentTime;

    if (timeUntilAdhan < 0) {
      timeUntilAdhan += 24 * 60; // Add 24 hours if the prayer is tomorrow
    }

    if (adhanTimer) clearTimeout(adhanTimer);

    if (timeUntilAdhan > 0) {
      console.log(`Scheduling adhan for ${timeUntilAdhan} minutes from now`);
      adhanTimer = setTimeout(() => {
        console.log('Adhan time reached, playing adhan and scheduling notification');
        playAdhan();
        scheduleNotification(nextPrayer);
      }, timeUntilAdhan * 60 * 1000);
    }
  };

  const scheduleNotification = async (prayer) => {
    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const prayerSetting = adhanSettings[prayer];
    const effectiveMode = prayerSetting.useGlobal ? globalAdhanSetting : prayerSetting.mode;

    let notificationContent = {
      title: "Prayer Time",
      body: `It's time for ${prayer} prayer`,
    };

    switch (effectiveMode) {
      case 'sound':
        notificationContent.sound = adhanSelections[prayer].id + '.mp3';
        break;
      case 'vibrate':
        notificationContent.vibrate = [0, 250, 250, 250];
        break;
      case 'mute':
        notificationContent.silent = true;
        break;
    }

    const now = new Date();
    const scheduledTime = new Date(now.getTime() + 10000); // Schedule 10 seconds from now for testing

    console.log(`Scheduling notification for ${scheduledTime.toLocaleTimeString()}`);

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: { date: scheduledTime },
    });
  };

  const playAdhan = async () => {
    const prayerSetting = adhanSettings[nextPrayer];
    const effectiveMode = prayerSetting.useGlobal ? globalAdhanSetting : prayerSetting.mode;

    switch (effectiveMode) {
      case 'sound':
        try {
          const adhan = adhanSelections[nextPrayer];
          const { sound } = await Audio.Sound.createAsync(adhan.file);
          await sound.playAsync();
        } catch (error) {
          console.error('Error playing Adhan:', error);
        }
        break;
      case 'vibrate':
        try {
          const adhan = adhanSelections[nextPrayer];
          const { sound } = await Audio.Sound.createAsync(adhan.file);
          const duration = await sound.getStatusAsync().then(status => status.durationMillis);
          Vibration.vibrate(duration);
        } catch (error) {
          console.error('Error getting adhan duration:', error);
          Vibration.vibrate(60000); // Fallback to 1 minute if duration can't be determined
        }
        break;
      case 'mute':
        // Do nothing, effectively muting the adhan
        break;
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  const openAdhanSelection = (prayer) => {
    setCurrentPrayer(prayer);
    setModalVisible(true);
  };

  const selectAdhan = (adhan) => {
    setAdhanSelections(prev => ({
      ...prev,
      [currentPrayer]: adhan
    }));
    setModalVisible(false);
    
    // Reschedule the notification with the new adhan sound
    if (currentPrayer === nextPrayer) {
      scheduleNotification(currentPrayer);
    }
  };

  const playAdhanPreview = async (adhan) => {
    if (sound) {
      await sound.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync(adhan.file);
    setSound(newSound);
    await newSound.playAsync();
    setPlayingAdhan(adhan.id);
  };

  const pauseAdhanPreview = async () => {
    if (sound) {
      await sound.pauseAsync();
      setPlayingAdhan(null);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const toggleAdhanMode = (prayer) => {
    const modes = ['sound', 'vibrate', 'mute', 'global'];
    const currentSettings = adhanSettings[prayer];
    const currentMode = currentSettings.useGlobal ? 'global' : currentSettings.mode;
    const currentIndex = modes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    
    if (nextMode === 'global') {
      setAdhanSettings(prev => ({
        ...prev,
        [prayer]: { mode: globalAdhanSetting, useGlobal: true }
      }));
    } else {
      setAdhanSettings(prev => ({
        ...prev,
        [prayer]: { mode: nextMode, useGlobal: false }
      }));
    }
    
    if (nextMode === 'vibrate') {
      Vibration.vibrate(500); // Vibrate for 500ms when switching to vibrate mode
    }
    
    saveAdhanSettings();
  };

  const toggleGlobalAdhanSetting = () => {
    const modes = ['sound', 'vibrate', 'mute'];
    const currentIndex = modes.indexOf(globalAdhanSetting);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newSetting = modes[nextIndex];
    setGlobalAdhanSetting(newSetting);
    
    // Update all prayer settings to use the new global setting
    const updatedSettings = {};
    Object.keys(adhanSettings).forEach(prayer => {
      updatedSettings[prayer] = { mode: newSetting, useGlobal: true };
    });
    setAdhanSettings(updatedSettings);
    
    if (newSetting === 'vibrate') {
      Vibration.vibrate(500); // Vibrate for 500ms when switching to vibrate mode
    }
    
    saveAdhanSettings();
  };

  const updateTimeLeft = useCallback(() => {
    if (nextPrayerTime) {
      const now = new Date();
      const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      let diff = nextPrayerTime * 60 - currentTime;
      
      if (diff < 0) {
        diff += 24 * 3600; // Add 24 hours if next prayer is tomorrow
      }
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }
  }, [nextPrayerTime]);

  useEffect(() => {
    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000); // Update every second
    return () => clearInterval(timer);
  }, [updateTimeLeft]);

  const renderAdhanOption = ({ item }) => (
    <View style={styles.adhanOptionContainer}>
      <TouchableOpacity
        style={styles.adhanOption}
        onPress={() => selectAdhan(item)}
      >
        <Text style={styles.adhanOptionText}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => playingAdhan === item.id ? pauseAdhanPreview() : playAdhanPreview(item)}
      >
        <Ionicons 
          name={playingAdhan === item.id ? "pause-circle-outline" : "play-circle-outline"} 
          size={24} 
          color="#4CAF50" 
        />
      </TouchableOpacity>
    </View>
  );

  const renderNextPrayerCard = () => (
    <View style={styles.nextPrayerCard}>
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={styles.nextPrayerGradient}
      >
        <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
        <Text style={styles.nextPrayerName}>{nextPrayer}</Text>
        <View style={styles.nextPrayerTimeContainer}>
          <Text style={styles.nextPrayerTime}>{formatTime(prayerTimes[nextPrayer])}</Text>
          <Text style={styles.timeLeft}>in {timeLeft}</Text>
        </View>
        <View style={styles.nextPrayerControls}>
          <TouchableOpacity onPress={() => openAdhanSelection(nextPrayer)} style={styles.nextPrayerAdhanSelector}>
            <Text style={styles.nextPrayerAdhanSelectorText}>
              {adhanSelections[nextPrayer]?.name || 'Select Adhan'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleAdhanMode(nextPrayer)} style={styles.nextPrayerAdhanModeSelector}>
            <Text style={styles.nextPrayerAdhanModeSelectorText}>
              {adhanSettings[nextPrayer]?.useGlobal ? 'Global' : adhanSettings[nextPrayer]?.mode}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderPrayerCard = (prayer, time) => (
    <View key={prayer} style={styles.card}>
      <LinearGradient
        colors={['#ffffff', '#f7f7f7']}
        style={styles.cardGradient}
      >
        <View style={styles.prayerInfo}>
          <Text style={styles.prayerName}>{prayer}</Text>
          <Text style={styles.prayerTime}>{formatTime(time)}</Text>
        </View>
        <TouchableOpacity onPress={() => openAdhanSelection(prayer)} style={styles.adhanSelector}>
          <Text style={styles.adhanSelectorText}>
            {adhanSelections[prayer]?.name || 'Select Adhan'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleAdhanMode(prayer)} style={styles.adhanModeSelector}>
          <Text style={styles.adhanModeSelectorText}>
            {adhanSettings[prayer].useGlobal ? 'Global' : adhanSettings[prayer].mode}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderGlobalAdhanSetting = () => (
    <View style={styles.globalAdhanSetting}>
      <Text style={styles.globalAdhanSettingText}>Global Adhan Setting:</Text>
      <TouchableOpacity onPress={toggleGlobalAdhanSetting} style={styles.globalAdhanButton}>
        <Text style={styles.globalAdhanButtonText}>{globalAdhanSetting}</Text>
      </TouchableOpacity>
    </View>
  );

  const mainPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const otherTimes = Object.keys(prayerTimes).filter(prayer => !mainPrayers.includes(prayer));

  const closeModal = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    setPlayingAdhan(null);
    setModalVisible(false);
  };

  const registerForPushNotificationsAsync = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/islamic-pattern3.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        automaticallyAdjustContentInsets={true}
      >
        {renderGlobalAdhanSetting()}
        <Text style={styles.title}>Prayer Times</Text>
        {renderNextPrayerCard()}
        <View style={styles.cardsContainer}>
          {mainPrayers.map(prayer => 
            prayer !== nextPrayer && renderPrayerCard(prayer, prayerTimes[prayer])
          )}
        </View>
        <Text style={styles.otherTimesTitle}>Other Times</Text>
        <View style={styles.otherTimesContainer}>
          {otherTimes.map(prayer => (
            <View key={prayer} style={styles.otherTimeItem}>
              <Text style={styles.otherTimeName}>{prayer}</Text>
              <Text style={styles.otherTimeValue}>{formatTime(prayerTimes[prayer])}</Text>
            </View>
          ))}
        </View>
        <View style={styles.bottomPadding} />
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Select Adhan for {currentPrayer}</Text>
              <FlatList
                data={adhanOptions}
                renderItem={renderAdhanOption}
                keyExtractor={item => item.id}
                style={styles.adhanList}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  cardsContainer: {
    flexDirection: 'column',
  },
  nextPrayerCard: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
  },
  nextPrayerGradient: {
    padding: 20,
    alignItems: 'center',
  },
  nextPrayerLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nextPrayerName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nextPrayerTimeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  nextPrayerTime: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 10,
  },
  timeLeft: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontStyle: 'italic',
  },
  nextPrayerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  nextPrayerAdhanSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 5,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  nextPrayerAdhanSelectorText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  nextPrayerAdhanModeSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 5,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  nextPrayerAdhanModeSelectorText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
  },
  cardGradient: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  prayerTime: {
    fontSize: 22,
    color: '#4CAF50',
  },
  adhanSelector: {
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 5,
  },
  adhanSelectorText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  otherTimesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  otherTimesContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
  },
  otherTimeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  otherTimeName: {
    fontSize: 16,
    color: '#555',
  },
  otherTimeValue: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
    color: '#4CAF50',
  },
  adhanList: {
    width: '100%',
  },
  adhanOptionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  adhanOption: {
    flex: 1,
  },
  adhanOptionText: {
    fontSize: 16,
    color: '#333',
  },
  playButton: {
    padding: 5,
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 20,
    width: '100%',
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  adhanModeSelector: {
    backgroundColor: '#e0e0e0',
    padding: 5,
    borderRadius: 5,
    marginLeft: 5,
  },
  adhanModeSelectorText: {
    fontSize: 12,
    color: '#666',
  },
  globalAdhanSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
    borderRadius: 10,
  },
  globalAdhanSettingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  globalAdhanButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
  },
  globalAdhanButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomPadding: {
    height: 80,
  },
});
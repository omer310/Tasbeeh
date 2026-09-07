import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scheduleAzanTest, getAndroidAlarmStatus } from '../services/NotificationService';
import { androidPrayerAlarm } from '../services/AndroidPrayerAlarm';
import { playAudio } from '../services/AudioService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const AdhanPreferencesModal = ({ isVisible, onClose, prayer, themeColors, onPreferenceChange }) => {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedAdhan, setSelectedAdhan] = useState('Adhan (Madina)');
  const [selectedReminder, setSelectedReminder] = useState('None');
  const [animation] = useState(new Animated.Value(0));
  const sound = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAdhan, setPlayingAdhan] = useState(null);

  useEffect(() => {
    if (!isVisible || !prayer) return;
    let active = true;
    setMessage(''); setBusy(true);
    Promise.all([
      AsyncStorage.getItem(`adhan_preference_${prayer}`),
      AsyncStorage.getItem(`reminder_preference_${prayer}`), getAndroidAlarmStatus(),
    ]).then(([adhan, reminder, current]) => {
      if (active) { setSelectedAdhan(adhan || 'Adhan (Madina)'); setSelectedReminder(reminder || 'None'); setStatus(current); }
    }).catch(e => { if (active) setMessage(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [prayer, isVisible]);

  useEffect(() => {
    if (isVisible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(animation, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, animation]);

  const adhanOptions = [
    { name: 'None', icon: 'ban-outline' },
    { name: 'Silent', icon: 'volume-mute-outline' },
    { name: 'Default notification sound', icon: 'notifications-outline' },
    { name: 'Adhan (Nureyn Mohammad)', image: require('../assets/adhan-icon.png'), flag: '🇸🇩', country: 'Sudan', sound: require('../assets/adhan.mp3') },
    { name: 'Adhan (Madina)', image: require('../assets/adhan-icon.png'), flag: '🇸🇦', country: 'Saudi Arabia', sound: require('../assets/madinah_adhan.mp3') },
    { name: 'Adhan (Makka)', image: require('../assets/adhan-icon.png'), flag: '🇸🇦', country: 'Saudi Arabia', sound: require('../assets/makkah_adhan.mp3') },
    { name: 'Long beep', icon: 'alarm-outline', sound: require('../assets/long_beep.mp3') }
  ];

  async function playSound(soundFile, adhanName) {
    try {
      sound.current?.stop();
      sound.current = playAudio(soundFile, () => {
        sound.current = null;
        setIsPlaying(false);
        setPlayingAdhan(null);
      }, adhanName);
      setIsPlaying(true);
      setPlayingAdhan(adhanName);
    } catch {
      setIsPlaying(false);
      setPlayingAdhan(null);
      setMessage('Unable to preview this sound. Please try again.');
    }
  }

  function pauseSound() {
    sound.current?.pause();
    setIsPlaying(false);
  }

  function stopAndPlayFromStart(soundFile, adhanName) { playSound(soundFile, adhanName); }

  useEffect(() => () => { sound.current?.stop(); }, []);
  useEffect(() => {
    if (!isVisible) { sound.current?.stop(); sound.current = null; setIsPlaying(false); setPlayingAdhan(null); }
  }, [isVisible]);

  const handleClose = () => {
    sound.current?.stop(); sound.current = null;
    setIsPlaying(false); setPlayingAdhan(null); onClose();
  };

  const saveSelection = async (adhan, reminder) => {
    if (busy) return;
    setBusy(true); setMessage('');
    sound.current?.stop(); sound.current = null; setIsPlaying(false); setPlayingAdhan(null);
    try {
      await onPreferenceChange(prayer, adhan, reminder);
      setSelectedAdhan(adhan); setSelectedReminder(reminder);
      setStatus(await getAndroidAlarmStatus());
    } catch (e) { setMessage(e.message || 'Could not save this preference.'); }
    finally { setBusy(false); }
  };
  const handleReminderSelection = option => saveSelection(selectedAdhan, option.name);
  const handleAdhanSelection = option => saveSelection(option.name, selectedReminder);
  const testDelivery = async () => {
    setMessage(''); setBusy(true);
    sound.current?.stop(); sound.current = null; setIsPlaying(false);
    try {
      await scheduleAzanTest(prayer, selectedAdhan);
      setMessage('Test scheduled in 15 seconds. Lock your screen now. Use Stop Azan on the notification to end playback.');
    } catch (e) { setMessage(e.message); }
    finally { setBusy(false); setStatus(await getAndroidAlarmStatus()); }
  };

  const reminderOptions = [
    { name: 'None', icon: 'ban-outline' },
    { name: '5 minutes before', icon: 'time-outline' },
    { name: '10 minutes before', icon: 'time-outline' },
    { name: '15 minutes before', icon: 'time-outline' },
    { name: '30 minutes before', icon: 'time-outline' },
    { name: '1 hour before', icon: 'time-outline' },
  ];

  const renderReminderDropdown = (options, selectedValue, onValueChange, label) => (
    <View style={[styles.dropdownContainer, { borderColor: themeColors.separatorColor }]}>
      <Text style={[styles.dropdownLabel, { color: themeColors.secondaryTextColor }]}>
        {label}
      </Text>
      <View style={[
        styles.pickerContainer, 
        { 
          backgroundColor: themeColors.backgroundColor,
          borderColor: themeColors.separatorColor 
        }
      ]}>
        <Picker
          enabled={!busy}
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          dropdownIconColor={themeColors.textColor}
          style={[styles.picker, { color: themeColors.textColor }]}
          mode="dropdown"
        >
          {options.map((option, index) => (
            <Picker.Item 
              key={index}
              label={option.name}
              value={option.name}
              color={themeColors.textColor}
            />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: themeColors.backgroundColor,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close Azan settings" style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={themeColors.textColor} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.textColor }]}>{prayer}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: themeColors.separatorColor }]} />
          
          {Platform.OS !== 'web' && <View style={{ gap: 8, marginBottom: 12 }}>
            <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={testDelivery} style={{ padding: 12, borderRadius: 10, backgroundColor: themeColors.inputBackground }}>
              <Text style={{ color: themeColors.activeTabColor, fontWeight: '600' }}>Test with screen locked (15 seconds)</Text>
            </TouchableOpacity>
            {status && !status.exact && <TouchableOpacity accessibilityRole="button" onPress={() => androidPrayerAlarm?.openAlarmSettings()}><Text style={{ color: themeColors.activeTabColor }}>Allow Alarms & reminders for on-time Azan</Text></TouchableOpacity>}
            <Text style={{ color: themeColors.secondaryTextColor, fontSize: 12 }}>Uses notification volume. Silent mode and Do Not Disturb mute Azan.</Text>
            {status?.lastEvent && <Text style={{ color: themeColors.secondaryTextColor, fontSize: 12 }}>{status.lastEvent}</Text>}
          </View>}
          {!!message && <Text accessibilityRole="alert" style={{ color: themeColors.textColor, marginBottom: 12 }}>{message}</Text>}
          {/* Pre-Adhan Reminder Dropdown */}
          {renderReminderDropdown(
            reminderOptions,
            selectedReminder,
            (value) => handleReminderSelection({ name: value }),
            "Pre-Adhan Reminder"
          )}

          {/* Adhan Options List */}
          <Text style={[styles.sectionTitle, { color: themeColors.secondaryTextColor }]}>Adhan Sound</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {adhanOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                accessibilityRole="radio" accessibilityState={{ checked: selectedAdhan === option.name }} accessibilityLabel={option.name} disabled={busy}
                style={[
                  styles.optionItem,
                  selectedAdhan === option.name && styles.selectedOption,
                  { backgroundColor: selectedAdhan === option.name ? themeColors.activeTabColor + '20' : 'transparent' }
                ]}
                onPress={() => handleAdhanSelection(option)}
              >
                <View style={styles.optionLeft}>
                  {option.image ? (
                    <Image source={option.image} style={styles.optionIcon} />
                  ) : (
                    <Ionicons name={option.icon} size={24} color={themeColors.textColor} />
                  )}
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionText, { color: themeColors.textColor }]}>{option.name}</Text>
                    {option.country && (
                      <Text style={[styles.countryText, { color: themeColors.secondaryTextColor }]}>
                        {option.flag} {option.country}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.optionRight}>
                  {selectedAdhan === option.name ? (
                    <Ionicons name="checkmark-circle" size={24} color={themeColors.activeTabColor} />
                  ) : null}
                  {option.sound && (
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Preview ${option.name}`}
                      onPress={() => {
                        if (playingAdhan === option.name && isPlaying) {
                          pauseSound();
                        } else {
                          stopAndPlayFromStart(option.sound, option.name);
                        }
                      }} 
                      style={styles.previewButton}
                    >
                      <Ionicons 
                        name={playingAdhan === option.name && isPlaying ? "pause-circle-outline" : "play-circle-outline"} 
                        size={24} 
                        color={themeColors.activeTabColor} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  separator: {
    height: 1,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  optionItemFirst: {
    marginBottom: 20,
  },
  selectedOption: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  optionText: {
    fontSize: 16,
  },
  countryText: {
    fontSize: 14,
    marginTop: 2,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewButton: {
    marginLeft: 10,
    padding: 5,
  },
  previewText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  optionIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  dropdownContainer: {
    marginBottom: 20,
    padding: 10,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  pickerContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
});

export default AdhanPreferencesModal;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdhanPreferencesModal = ({ isVisible, onClose, prayer, themeColors, onPreferenceChange }) => {
  const [selectedAdhan, setSelectedAdhan] = useState('Adhan (Madina)');
  const [animation] = useState(new Animated.Value(0));
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAdhan, setPlayingAdhan] = useState(null);

  useEffect(() => {
    loadPreference();
  }, [prayer]);

  const loadPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(`adhan_preference_${prayer}`);
      if (savedPreference !== null) {
        setSelectedAdhan(savedPreference);
      }
    } catch (error) {
      console.error('Error loading preference:', error);
    }
  };

  const savePreference = async (preference) => {
    try {
      await AsyncStorage.setItem(`adhan_preference_${prayer}`, preference);
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

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
  }, [isVisible]);

  const adhanOptions = [
    { name: 'None', icon: 'ban-outline' },
    { name: 'Silent', icon: 'volume-mute-outline' },
    { name: 'Default notification sound', icon: 'notifications-outline' },
    { name: 'Adhan (Nureyn Mohammad)', image: require('../assets/adhan-icon.png'), flag: '🇸🇩', country: 'Sudan', sound: require('../assets/adhan.mp3') },
    { name: 'Adhan (Madina)', image: require('../assets/adhan-icon.png'), flag: '🇸🇦', country: 'Saudi Arabia', sound: require('../assets/madinah_adhan.mp3') },
    { name: 'Adhan (Makka)', image: require('../assets/adhan-icon.png'), flag: '🇸🇦', country: 'Saudi Arabia', sound: require('../assets/makkah_adhan.mp3') },
    { name: 'Long beep', icon: 'alarm-outline' }
  ];

  async function playSound(soundFile, adhanName) {
    console.log("Attempting to play sound:", soundFile);
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(soundFile, { shouldPlay: true });
      setSound(newSound);
      setIsPlaying(true);
      setPlayingAdhan(adhanName);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log("Playback finished");
          setIsPlaying(false);
          setPlayingAdhan(null);
          newSound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }

  async function pauseSound() {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  }

  async function stopAndPlayFromStart(soundFile, adhanName) {
    if (sound) {
      await sound.unloadAsync();
    }
    playSound(soundFile, adhanName);
  }

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (!isVisible && sound) {
      pauseSound();
      setPlayingAdhan(null);
    }
  }, [isVisible]);

  const handleClose = () => {
    if (sound) {
      pauseSound();
      setPlayingAdhan(null);
    }
    onClose();
  };

  const handleAdhanSelection = (option) => {
    setSelectedAdhan(option.name);
    onPreferenceChange(prayer, option.name);
    savePreference(option.name);
  };

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
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={themeColors.textColor} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.textColor }]}>{prayer}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: themeColors.separatorColor }]} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: themeColors.secondaryTextColor }]}>Pre-Adhan Reminder</Text>
            <TouchableOpacity style={[styles.optionItem, styles.optionItemFirst]}>
              <Text style={[styles.optionText, { color: themeColors.textColor }]}>None</Text>
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: themeColors.secondaryTextColor }]}>Adhan Preferences</Text>
            {adhanOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
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
                    <TouchableOpacity 
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
  },
  optionIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});

export default AdhanPreferencesModal;
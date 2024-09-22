import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ImageBackground, Modal, TextInput, Image, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const adhkar = [
  { arabic: 'سُبْحَانَ اللهِ', translation: 'Glory be to Allah' },
  { arabic: 'الْحَمْدُ لِلَّهِ', translation: 'Praise be to Allah' },
  { arabic: 'اللهُ أَكْبَرُ', translation: 'Allah is the Greatest' },
  { arabic: 'لَا إِلَهَ إِلَّا اللهُ', translation: 'There is no god but Allah' },
  { arabic: 'أَسْتَغْفِرُ اللهَ', translation: 'I seek forgiveness from Allah' },
  { arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا اللهِ', translation: 'There is no power or might except with Allah' },
  { arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ', translation: 'Glory be to Allah and His is the praise' },
  { arabic: 'سُبْحَانَ اللهِ العَظِيمِ', translation: 'Glory be to Allah, the Magnificent' },
  { arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', translation: 'O Allah, send blessings upon Muhammad' },
  { arabic: 'سُبْحَانَ اللهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ', translation: 'Glory be to Allah, and praise be to Allah, and there is no god but Allah, and Allah is the Greatest' },
];

const duas = [
  { 
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    translation: 'Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.',
    // audioFile: require('../assets/audio/dua1.mp3'),
  },
  {
    arabic: 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
    translation: 'My Lord, forgive me and my parents and the believers the Day the account is established.',
    // audioFile: require('../assets/audio/dua2.mp3'),
  },
  {
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ',
    translation: 'Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.',
    // audioFile: require('../assets/audio/dua3.mp3'),
  },
  {
    arabic: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَدْخِلْنِي بِرَحْمَتِكَ فِي عِبَادِكَ الصَّالِحِينَ',
    translation: 'My Lord, enable me to be grateful for Your favor which You have bestowed upon me and upon my parents and to work righteousness of which You will approve and make righteous for me my offspring. Indeed, I have repented to You, and indeed, I am of the Muslims.',
    // audioFile: require('../assets/audio/dua4.mp3'),
  },
  {
    arabic: 'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
    translation: 'Our Lord, forgive us our sins and the excess [committed] in our affairs and plant firmly our feet and give us victory over the disbelieving people.',
    // audioFile: require('../assets/audio/dua5.mp3'),
  }
];

export default function TasbeehCounter({ themeColors }) {
  const [count, setCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scaleValue] = useState(new Animated.Value(1));
  const [sound, setSound] = useState();
  const [mode, setMode] = useState('adhkar'); // 'adhkar' or 'dua'
  const [customAdhkars, setCustomAdhkars] = useState([]);
  const [customDuas, setCustomDuas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAdhkar, setNewAdhkar] = useState({ arabic: '', translation: '' });
  const [newDua, setNewDua] = useState({ arabic: '', translation: '' });
  const [sessionAdhkarCounts, setSessionAdhkarCounts] = useState({});

  useEffect(() => {
    const initializeAsyncStorage = async () => {
      try {
        await AsyncStorage.setItem('@asyncStorageInitialized', 'true');
        console.log('AsyncStorage initialized');
      } catch (error) {
        console.error('Error initializing AsyncStorage:', error);
      }
    };

    initializeAsyncStorage();
    loadCustomAdhkars();
    loadCustomDuas();
  }, []);

  const loadCustomAdhkars = async () => {
    try {
      const savedAdhkars = await AsyncStorage.getItem('customAdhkars');
      if (savedAdhkars !== null) {
        setCustomAdhkars(JSON.parse(savedAdhkars));
      }
    } catch (error) {
      console.error('Error loading custom adhkars:', error);
    }
  };

  const saveCustomAdhkars = async (newAdhkars) => {
    try {
      await AsyncStorage.setItem('customAdhkars', JSON.stringify(newAdhkars));
    } catch (error) {
      console.error('Error saving custom adhkars:', error);
    }
  };

  const addCustomAdhkar = () => {
    if (newAdhkar.arabic) {
      const updatedAdhkars = [...customAdhkars, newAdhkar];
      setCustomAdhkars(updatedAdhkars);
      saveCustomAdhkars(updatedAdhkars);
      setNewAdhkar({ arabic: '', translation: '' });
      setModalVisible(false);
    }
  };

  const loadCustomDuas = async () => {
    try {
      const savedDuas = await AsyncStorage.getItem('customDuas');
      if (savedDuas !== null) {
        setCustomDuas(JSON.parse(savedDuas));
      }
    } catch (error) {
      console.error('Error loading custom duas:', error);
    }
  };

  const saveCustomDuas = async (newDuas) => {
    try {
      await AsyncStorage.setItem('customDuas', JSON.stringify(newDuas));
    } catch (error) {
      console.error('Error saving custom duas:', error);
    }
  };

  const addCustomDua = () => {
    if (newDua.arabic) {
      const updatedDuas = [...customDuas, newDua];
      setCustomDuas(updatedDuas);
      saveCustomDuas(updatedDuas);
      setNewDua({ arabic: '', translation: '' });
      setModalVisible(false);
    }
  };

  const incrementCount = () => {
    setCount(count + 1);
    if (mode === 'adhkar') {
      const currentAdhkar = [...adhkar, ...customAdhkars][currentIndex];
      setSessionAdhkarCounts(prevCounts => ({
        ...prevCounts,
        [currentAdhkar.arabic]: (prevCounts[currentAdhkar.arabic] || 0) + 1
      }));
    }
    animateButton();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  };

  const resetCount = () => {
    setCount(0);
  };

  const resetAllSessionCounts = () => {
    setSessionAdhkarCounts({});
    setCount(0);
  };

  const changeItem = (direction) => {
    const items = mode === 'adhkar' ? [...adhkar, ...customAdhkars] : [...duas, ...customDuas];
    setCurrentIndex((prevIndex) => {
      const newIndex = (prevIndex + direction + items.length) % items.length;
      return newIndex;
    });
    setCount(0);
  };

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'adhkar' ? 'dua' : 'adhkar');
    setCurrentIndex(0);
    setCount(0);
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const toArabicNumerals = (num) => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(digit => arabicNumerals[digit]).join('');
  };

  async function playSound() {
    if (mode === 'dua' && duas[currentIndex].audioFile) {
      const { sound } = await Audio.Sound.createAsync(duas[currentIndex].audioFile);
      setSound(sound);
      await sound.playAsync();
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const deleteCustomItem = (index) => {
    if (mode === 'adhkar') {
      const updatedAdhkars = customAdhkars.filter((_, i) => i !== index);
      setCustomAdhkars(updatedAdhkars);
      saveCustomAdhkars(updatedAdhkars);
    } else {
      const updatedDuas = customDuas.filter((_, i) => i !== index);
      setCustomDuas(updatedDuas);
      saveCustomDuas(updatedDuas);
    }
    setCurrentIndex(0);
  };

  const isCustomItem = () => {
    return mode === 'adhkar' 
      ? currentIndex >= adhkar.length
      : currentIndex >= duas.length;
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../assets/islamic-pattern2.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.title, { color: 'black' }]}>{mode === 'adhkar' ? 'تَسْبِيح' : 'دُعَاء'}</Text>
              <Text style={[styles.title, { color: 'black' }]}>{mode === 'adhkar' ? 'Tasbeeh' : 'Dua'}</Text>
              
              <TouchableOpacity style={styles.modeToggle} onPress={toggleMode}>
                {mode === 'adhkar' ? (
                  <Image 
                    source={require('../assets/custom-dua-icon.png')} 
                    style={styles.customIcon}
                  />
                ) : (
                  <Ionicons name="list-outline" size={28} color="#FFFFFF" />
                )}
                <Text style={styles.modeToggleText}>
                  Switch to {mode === 'adhkar' ? 'Dua' : 'Adhkar'}
                </Text>
              </TouchableOpacity>

              <View style={styles.contentContainer}>
                <TouchableOpacity onPress={() => changeItem(-1)} style={styles.arrowButton}>
                  <Ionicons name="chevron-back" size={24} color="#4CAF50" />
                </TouchableOpacity>
                <View style={styles.textContainer}>
                  {isCustomItem() && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>o</Text>
                    </View>
                  )}
                  <Text style={styles.arabic}>
                    {mode === 'adhkar' 
                      ? [...adhkar, ...customAdhkars][currentIndex].arabic 
                      : [...duas, ...customDuas][currentIndex].arabic}
                  </Text>
                  <Text style={styles.translation}>
                    {mode === 'adhkar' 
                      ? [...adhkar, ...customAdhkars][currentIndex].translation 
                      : [...duas, ...customDuas][currentIndex].translation}
                  </Text>
                  {mode === 'adhkar' && (
                    <Text style={styles.adhkarCount}>
                      Total Dhikr: {sessionAdhkarCounts[[...adhkar, ...customAdhkars][currentIndex].arabic] || 0}
                    </Text>
                  )}
                  {mode === 'dua' && (
                    <TouchableOpacity onPress={playSound} style={styles.audioButton}>
                      <Ionicons name="volume-high-outline" size={24} color="#4CAF50" />
                    </TouchableOpacity>
                  )}
                  {isCustomItem() && (
                    <TouchableOpacity 
                      onPress={() => deleteCustomItem(mode === 'adhkar' ? currentIndex - adhkar.length : currentIndex - duas.length)} 
                      style={styles.deleteButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity onPress={() => changeItem(1)} style={styles.arrowButton}>
                  <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
                </TouchableOpacity>
              </View>

              {mode === 'adhkar' && (
                <>
                  <View style={styles.counterContainer}>
                    <Animated.Text style={[styles.count, { transform: [{ scale: scaleValue }] }]}>
                      {toArabicNumerals(count)}
                    </Animated.Text>
                  </View>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={incrementCount}>
                      <Ionicons name="add-circle-outline" size={32} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetCount}>
                      <Ionicons name="refresh-outline" size={32} color="#4CAF50" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
            
            {/* Bottom buttons container */}
            <View style={[
              styles.bottomButtonsContainer,
              mode === 'dua' && styles.bottomButtonsContainerDua
            ]}>
              {mode === 'adhkar' && (
                <TouchableOpacity style={styles.resetAllButton} onPress={resetAllSessionCounts}>
                  <Ionicons name="refresh-circle-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.resetAllButtonText}>Reset All</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.addButton, mode === 'dua' && styles.addButtonDua]} 
                onPress={() => {
                  if (mode === 'adhkar') {
                    setNewAdhkar({ arabic: '', translation: '' });
                  } else {
                    setNewDua({ arabic: '', translation: '' });
                  }
                  setModalVisible(true);
                }}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add {mode === 'adhkar' ? 'Adhkar' : 'Dua'}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Arabic"
              value={mode === 'adhkar' ? newAdhkar.arabic : newDua.arabic}
              onChangeText={(text) => mode === 'adhkar' 
                ? setNewAdhkar({ ...newAdhkar, arabic: text })
                : setNewDua({ ...newDua, arabic: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Translation (optional)"
              value={mode === 'adhkar' ? newAdhkar.translation : newDua.translation}
              onChangeText={(text) => mode === 'adhkar'
                ? setNewAdhkar({ ...newAdhkar, translation: text })
                : setNewDua({ ...newDua, translation: text })
              }
            />
            <TouchableOpacity 
              style={styles.addAdhkarButton} 
              onPress={mode === 'adhkar' ? addCustomAdhkar : addCustomDua}
            >
              <Text style={styles.addAdhkarButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    fontFamily: 'System',
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modeToggleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 17,
    marginLeft: 10,
  },
  customIcon: {
    width: 40,
    height: 40,
    marginRight: 5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    minHeight: 100,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  arrowButton: {
    padding: 10,
  },
  arabic: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 5,
  },
  translation: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  counterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 75,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  count: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  audioButton: {
    marginTop: 10,
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 80,
  },
  bottomButtonsContainerDua: {
    justifyContent: 'center',
  },
  resetAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  resetAllButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  addButtonDua: {
    // You can add specific styles for the Add Dua button here if needed
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  addAdhkarButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addAdhkarButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  customBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    position: 'absolute',
    top: -10,
    right: -10,
  },
  customBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  adhkarCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, ScrollView, Dimensions, I18nManager, TextInput, Modal, Vibration, StatusBar, useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window')

const TasbeehCounter = ({ themeColors, language = 'en' }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [adhkars, setAdhkars] = useState({
    'سبحان الله وبحمده': { ar: 'سبحان الله وبحمده', en: 'Glory and praise be to Allah', count: 0, goal: 0 },
    'الحمد لله': { ar: 'الحمد لله', en: 'Praise be to Allah', count: 0, goal: 0 },
    'الله أكبر': { ar: 'الله أكبر', en: 'Allah is the Greatest', count: 0, goal: 0 },
    'لا إله إلا الله': { ar: 'لا إله إلا الله', en: 'There is no god but Allah', count: 0, goal: 0 },
    'أستغفر الله': { ar: 'أستغفر الله', en: 'I seek forgiveness from Allah', count: 0, goal: 0 },
    'سبحان الله': { ar: 'سبحان الله', en: 'Glory be to Allah', count: 0, goal: 0 },
    'لا حول ولا قوة إلا بالله': { ar: 'لا حول ولا قوة إلا بالله', en: 'There is no power and no strength except with Allah', count: 0, goal: 0 },
    'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد اللهم بارك على محمد وعلى آل محمد كما باركت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد': { ar: 'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد اللهم بارك على محمد وعلى آل محمد كما باركت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد', en: 'O Allah, send prayers upon Muhammad and upon the family of Muhammad, as You sent prayers upon Ibrahim and upon the family of Ibrahim. Indeed, You are praiseworthy and glorious. O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and upon the family of Ibrahim. Indeed, You are praiseworthy and glorious', count: 0, goal: 0 },
    'اللهم صلى على سيدنا محمد و على اله و صحبه و سلم': { ar: 'اللهم صلى على سيدنا محمد و على اله و صحبه و سلم', en: 'O Allah, send blessings upon our prohpet Muhammad, his family, his companions, and grant them peace', count: 0, goal: 0 },
    'سبحان الله وبحمده سبحان الله العظيم': { ar: 'سبحان الله وبحمده سبحان الله العظيم', en: 'Glory and praise be to Allah, glory be to Allah the Magnificent', count: 0, goal: 0 },
    'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير': { ar: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', en: 'There is no god but Allah, alone, without any partner. His is the dominion and His is the praise, and He is able to do all things', count: 0, goal: 0 },
    'اللهم إني أسألك العفو والعافية': { ar: 'اللهم إني أسألك العفو والعافية', en: 'O Allah, I ask You for pardon and well-being', count: 0, goal: 0 },
    'رب اغفر لي وتب علي إنك أنت التواب الرحيم': { ar: 'رب اغفر لي وتب علي إنك أنت التواب الرحيم', en: 'My Lord, forgive me and accept my repentance. Indeed, You are the Accepting of repentance, the Merciful', count: 0, goal: 0 },
    'اللهم أعني على ذكرك وشكرك وحسن عبادتك': { ar: 'اللهم أعني على ذكرك وشكرك وحسن عبادتك', en: 'O Allah, help me remember You, to be grateful to You, and to worship You in an excellent manner', count: 0, goal: 0 },
    'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم': { ar: 'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم', en: 'Sufficient for me is Allah; there is no deity except Him. On Him I have relied, and He is the Lord of the Great Throne', count: 0, goal: 0 },
    'اللهم إني أعوذ بك من الهم والحزن': { ar: 'اللهم إني أعوذ بك من الهم والحزن', en: 'O Allah, I seek refuge in You from anxiety and sorrow', count: 0, goal: 0 },
  });
  const [selectedAdhkar, setSelectedAdhkar] = useState('سبحان الله وبحمده');
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [isGoalModalVisible, setGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const bottomSheetAnimation = useRef(new Animated.Value(0)).current;
  const [isAddAdhkarModalVisible, setAddAdhkarModalVisible] = useState(false);
  const [newAdhkarAr, setNewAdhkarAr] = useState('');
  const [newAdhkarEn, setNewAdhkarEn] = useState('');
  const [goalReached, setGoalReached] = useState(false);
  const presetAdhkars = {
    afterPrayer: [
      { dhikr: 'سبحان الله', count: 33 },
      { dhikr: 'الحمد لله', count: 33 },
      { dhikr: 'الله أكبر', count: 33 },
      { dhikr: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', count: 1 }
    ],
    morning: [
      { dhikr: 'سبحان الله وبحمده', count: 100 },
      { dhikr: 'أستغفر الله', count: 100 },
      { dhikr: 'لا إله إلا الله', count: 100 }
    ]
  };
  const [activePreset, setActivePreset] = useState(null);
  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: themeColors.backgroundColor,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 80,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 20,
      paddingTop: 40,
      paddingBottom: 10,
    },
    count: {
      fontSize: 100,
      fontWeight: 'bold',
      color: themeColors.primary,
    },
    selectedAdhkar: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.textColor,
      marginTop: 20,
      textAlign: 'center',
    },
    bottomSheet: {
      position: 'absolute',
      bottom: -80,
      left: 0,
      right: 0,
      backgroundColor: themeColors.backgroundColor,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 130,
      maxHeight: height * 0.8,
      zIndex: 2000,
      elevation: 20,
    },
    bottomSheetContent: {
      maxHeight: height * 0.7,
    },
    bottomSheetTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.textColor,
      marginBottom: 16,
    },
    adhkarItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    adhkarItemText: {
      fontSize: 16,
      color: themeColors.textColor,
    },
    adhkarItemTranslation: {
      fontSize: 14,
      color: themeColors.textColor,
      marginTop: 4,
    },
    adhkarCount: {
      fontSize: 14,
      color: themeColors.primary,
      marginTop: 4,
    },
    goalModal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    goalModalContent: {
      backgroundColor: themeColors.backgroundColor,
      padding: 20,
      borderRadius: 10,
      width: '80%',
    },
    goalInput: {
      borderWidth: 1,
      borderColor: themeColors.primary,
      borderRadius: 5,
      padding: 10,
      marginBottom: 10,
      color: themeColors.textColor,
    },
    goalButton: {
      backgroundColor: themeColors.primary,
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
      fontWeight: 'bold',
    },
    goalButtonText: {
      color: themeColors.white,
      fontSize: 14,
      fontWeight: 'bold',
    },
    counterContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '120%',
    },
    counterTouchable: {
      width: '120%',
      height: '120%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 900,
      backgroundColor: themeColors.primaryLight,
    },
    adhkarSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '90%',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: themeColors.primaryLight,
      borderRadius: 15,
      marginTop: 20,
      marginBottom: 20,
    },
    selectedAdhkarContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectedAdhkarTextContainer: {
      flex: 1,
    },
    selectedAdhkarArabic: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.textColor,
      textAlign: 'right',
    },
    selectedAdhkarEnglish: {
      fontSize: 16,
      color: themeColors.textColor,
      textAlign: 'left',
      marginTop: 5,
    },
    addButton: {
      backgroundColor: themeColors.primary,
      padding: '2%',
      borderRadius: 5,
      marginTop: '7%',
      minWidth: '20%',
      maxWidth: '40%',
      alignSelf: 'center',
      flexGrow: 1,
    },
    addButtonText: {
      color: themeColors.white,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    modalInput: {
      borderWidth: 1,
      borderColor: themeColors.primary,
      borderRadius: 5,
      padding: 10,
      marginBottom: 10,
      color: themeColors.textColor,
    },
    goalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      marginBottom: 20,
      backdropFilter: 'blur(10px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    goalText: {
      color: themeColors.textColor,
      fontSize: 16,
      fontWeight: '500',
      opacity: 0.8,
    },
    goalProgress: {
      color: themeColors.primary,
      fontSize: 16,
      fontWeight: 'bold',
      marginHorizontal: 8,
    },
    cancelGoalButton: {
      padding: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      marginLeft: 5,
    },
    presetBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.primaryLight,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 10,
    },
    presetText: {
      color: themeColors.textColor,
      marginRight: 10,
      fontSize: 14,
    },
    cancelPresetButton: {
      padding: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 12,
    },
    presetButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    presetButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 15,
      marginHorizontal: 5,
    },
    presetButtonText: {
      color: themeColors.white,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

  const incrementCount = () => {
    const currentAdhkar = adhkars[selectedAdhkar];
    if (currentAdhkar.goal > 0 && currentAdhkar.count >= currentAdhkar.goal) {
      if (activePreset) {
        handlePresetComplete();
      }
      return;
    }

    // Light feedback for each count
    Vibration.vibrate([0, 40]);
    
    setAdhkars(prev => ({
      ...prev,
      [selectedAdhkar]: {
        ...prev[selectedAdhkar],
        count: prev[selectedAdhkar].count + 1
      }
    }));

    // Goal completion feedback
    if (currentAdhkar.goal > 0 && currentAdhkar.count + 1 === currentAdhkar.goal) {
      Vibration.vibrate([0, 60, 60, 60]);
      setGoalReached(true);
    }
  };

  const resetCount = () => {
    setAdhkars(prev => ({
      ...prev,
      [selectedAdhkar]: {
        ...prev[selectedAdhkar],
        count: 0
      }
    }));
    setGoalReached(false);
  };

  const toggleBottomSheet = () => {
    setBottomSheetVisible(!isBottomSheetVisible);
    Animated.timing(bottomSheetAnimation, {
      toValue: isBottomSheetVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const selectAdhkar = (adhkar) => {
    setSelectedAdhkar(adhkar);
    toggleBottomSheet();
  };

  const getTranslation = (key, lang) => {
    return language === 'ar' ? adhkars[key].ar : adhkars[key].en;
  };

  const openGoalModal = () => {
    setGoalModalVisible(true);
  };

  const setGoal = () => {
    const goal = parseInt(goalInput);
    if (!isNaN(goal) && goal > 0) {
      setAdhkars(prev => ({
        ...prev,
        [selectedAdhkar]: {
          ...prev[selectedAdhkar],
          goal: goal
        }
      }));
    }
    setGoalModalVisible(false);
    setGoalInput('');
  };

  const cancelGoal = () => {
    setAdhkars(prev => ({
      ...prev,
      [selectedAdhkar]: {
        ...prev[selectedAdhkar],
        goal: 0
      }
    }));
  };

  const openAddAdhkarModal = () => {
    setAddAdhkarModalVisible(true);
  };

  const addNewAdhkar = () => {
    if (newAdhkarAr.trim() !== '') {
      const newKey = newAdhkarAr.trim();
      setAdhkars(prev => ({
        ...prev,
        [newKey]: { ar: newAdhkarAr.trim(), en: newAdhkarEn.trim() || newAdhkarAr.trim(), count: 0, goal: 0 }
      }));
      setNewAdhkarAr('');
      setNewAdhkarEn('');
      setAddAdhkarModalVisible(false);
    }
  };

  const toArabicNumerals = (num) => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(digit => arabicNumerals[digit] || digit).join('');
  };

  const handlePresetComplete = () => {
    if (!activePreset) return;
    
    const preset = presetAdhkars[activePreset];
    if (currentPresetIndex < preset.length - 1) {
      Vibration.vibrate([0, 60, 60, 60]);
      setCurrentPresetIndex(currentPresetIndex + 1);
      const nextDhikr = preset[currentPresetIndex + 1];
      setSelectedAdhkar(nextDhikr.dhikr);
      setAdhkars(prev => ({
        ...prev,
        [nextDhikr.dhikr]: {
          ...prev[nextDhikr.dhikr],
          count: 0,
          goal: nextDhikr.count
        }
      }));
    } else {
      Vibration.vibrate([0, 100, 50, 100, 50, 100]);
      setAdhkars(prev => ({
        ...prev,
        [selectedAdhkar]: {
          ...prev[selectedAdhkar],
          goal: 0
        }
      }));
      setActivePreset(null);
      setCurrentPresetIndex(0);
    }
  };

  const startPreset = (presetName) => {
    const preset = presetAdhkars[presetName];
    setActivePreset(presetName);
    setCurrentPresetIndex(0);
    const firstDhikr = preset[0];
    setSelectedAdhkar(firstDhikr.dhikr);
    setAdhkars(prev => ({
      ...prev,
      [firstDhikr.dhikr]: {
        ...prev[firstDhikr.dhikr],
        count: 0,
        goal: firstDhikr.count
      }
    }));
    toggleBottomSheet();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.backgroundColor }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetCount}>
            <Icon name="refresh-ccw" size={24} color={themeColors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openGoalModal}>
            <Text style={{ color: themeColors.primary }}>{language === 'ar' ? 'تحديد هدف' : 'Set Goal'}</Text>
          </TouchableOpacity>
        </View>

        {activePreset && (
          <View style={styles.presetBanner}>
            <Text style={styles.presetText}>
              {language === 'ar' 
                ? `${currentPresetIndex + 1}/${presetAdhkars[activePreset].length} :${activePreset}` 
                : `${activePreset}: ${currentPresetIndex + 1}/${presetAdhkars[activePreset].length}`}
            </Text>
            <TouchableOpacity 
              style={styles.cancelPresetButton} 
              onPress={() => {
                setAdhkars(prev => ({
                  ...prev,
                  [selectedAdhkar]: {
                    ...prev[selectedAdhkar],
                    goal: 0
                  }
                }));
                setActivePreset(null);
              }}
            >
              <Icon name="x" size={16} color={themeColors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={styles.adhkarSelector} 
          onPress={toggleBottomSheet}
        >
          <View style={styles.selectedAdhkarContainer}>
            <View style={styles.selectedAdhkarTextContainer}>
              <Text style={styles.selectedAdhkarArabic}>
                {adhkars[selectedAdhkar].ar}
              </Text>
              {language === 'en' && (
                <Text style={styles.selectedAdhkarEnglish}>
                  {adhkars[selectedAdhkar].en}
                </Text>
              )}
            </View>
            <Icon name="chevron-down" size={24} color={themeColors.primary} />
          </View>
        </TouchableOpacity>

        {adhkars[selectedAdhkar].goal > 0 && (
          <View style={styles.goalContainer}>
            <Text style={styles.goalText}>
              {language === 'ar' ? 'الهدف:' : 'Goal:'} 
            </Text>
            <Text style={styles.goalProgress}>
              {language === 'ar' 
                ? toArabicNumerals(adhkars[selectedAdhkar].goal)
                : adhkars[selectedAdhkar].goal
              }
            </Text>
            <TouchableOpacity style={styles.cancelGoalButton} onPress={cancelGoal}>
              <Icon name="x" size={16} color={themeColors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.counterContainer}>
          <TouchableOpacity style={styles.counterTouchable} onPress={incrementCount}>
            <Text style={styles.count}>
              {language === 'ar' 
                ? toArabicNumerals(adhkars[selectedAdhkar].count)
                : adhkars[selectedAdhkar].count}
            </Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [
                {
                  translateY: bottomSheetAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.bottomSheetTitle}>{language === 'ar' ? 'الأذكار' : 'Adhkars'}</Text>
            <TouchableOpacity onPress={toggleBottomSheet}>
              <Icon name="x" size={24} color={themeColors.textColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.presetButtons}>
            <TouchableOpacity 
              style={styles.presetButton} 
              onPress={() => startPreset('afterPrayer')}
            >
              <Text style={styles.presetButtonText}>
                {language === 'ar' ? 'أذكار بعد الصلاة' : 'After Prayer Adhkar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.presetButton} 
              onPress={() => startPreset('morning')}
            >
              <Text style={styles.presetButtonText}>
                {language === 'ar' ? 'أذكار الصباح' : 'Morning Adhkar'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.bottomSheetContent}>
            {Object.entries(adhkars).map(([key, value], index) => (
              <TouchableOpacity
                key={index}
                style={styles.adhkarItem}
                onPress={() => selectAdhkar(key)}
              >
                <Text style={styles.adhkarItemText}>{value.ar}</Text>
                {language === 'en' && <Text style={styles.adhkarItemTranslation}>{value.en}</Text>}
                <Text style={styles.adhkarCount}>
                  {language === 'ar' 
                    ? `العدد: ${toArabicNumerals(value.count)}`
                    : `Count: ${value.count}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.addButton} onPress={openAddAdhkarModal}>
            <Text style={styles.addButtonText}>{language === 'ar' ? 'إضافة ذكر جديد' : 'Add New Dhikr'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Modal
          visible={isGoalModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setGoalModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.goalModal} 
            activeOpacity={1} 
            onPress={() => setGoalModalVisible(false)}
          >
            <TouchableOpacity 
              style={styles.goalModalContent} 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <TextInput
                style={styles.goalInput}
                onChangeText={setGoalInput}
                value={goalInput}
                placeholder={language === 'ar' ? "أدخل الهدف" : "Enter goal"}
                keyboardType="numeric"
                placeholderTextColor={themeColors.placeholderColor}
              />
              <TouchableOpacity style={styles.goalButton} onPress={setGoal}>
                <Text style={styles.goalButtonText}>{language === 'ar' ? "تعيين الهدف" : "Set Goal"}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={isAddAdhkarModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAddAdhkarModalVisible(false)}
        >
          <View style={styles.goalModal}>
            <View style={styles.goalModalContent}>
              <TextInput
                style={styles.modalInput}
                onChangeText={setNewAdhkarAr}
                value={newAdhkarAr}
                placeholder={language === 'ar' ? "أدخل الذكر بالعربية" : "Enter Adhkar in Arabic"}
                placeholderTextColor={themeColors.placeholderColor}
              />
              <TextInput
                style={styles.modalInput}
                onChangeText={setNewAdhkarEn}
                value={newAdhkarEn}
                placeholder={language === 'ar' ? "أدخل الذكر بالإنجليزية (اختياري)" : "Enter Adhkar in English (optional)"}
                placeholderTextColor={themeColors.placeholderColor}
              />
              <TouchableOpacity style={styles.goalButton} onPress={addNewAdhkar}>
                <Text style={styles.goalButtonText}>{language === 'ar' ? "إضافة" : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default TasbeehCounter;
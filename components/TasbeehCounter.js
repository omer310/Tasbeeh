import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, ScrollView, Dimensions, I18nManager, TextInput, Modal, Vibration } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window')



const TasbeehCounter = ({ themeColors, language = 'en' }) => {
  const [adhkars, setAdhkars] = useState({
    'سبحان الله وبحمده': { ar: 'سبحان الله وبحمده', en: 'Glory and praise be to Allah', count: 0, goal: 0 },
    'الحمد لله': { ar: 'الحمد لله', en: 'Praise be to Allah', count: 0, goal: 0 },
    'الله أكبر': { ar: 'الله أكبر', en: 'Allah is the Greatest', count: 0, goal: 0 },
    'لا إله إلا الله': { ar: 'لا إله إلا الله', en: 'There is no god but Allah', count: 0, goal: 0 },
    'أستغفر الله': { ar: 'أستغفر الله', en: 'I seek forgiveness from Allah', count: 0, goal: 0 },
    'سبحان الله': { ar: 'سبحان الله', en: 'Glory be to Allah', count: 0, goal: 0 },
    'لا حول ولا قوة إلا بالله': { ar: 'لا حول ولا قوة إلا بالله', en: 'There is no power and no strength except with Allah', count: 0, goal: 0 },
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
      width: '100%',
    },
    counterTouchable: {
      width: '80%',
      height: '90%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 1400,
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
      marginBottom: 10,
    },
    goalText: {
      color: themeColors.textColor,
      marginRight: 10,
    },
    cancelGoalButton: {
      padding: 5,
    },
  });

  const incrementCount = () => {
    const currentAdhkar = adhkars[selectedAdhkar];
    if (currentAdhkar.goal > 0 && currentAdhkar.count >= currentAdhkar.goal) {
      return;
    }

    Vibration.vibrate([0, 100, 50, 100]);
    setAdhkars(prev => ({
      ...prev,
      [selectedAdhkar]: {
        ...prev[selectedAdhkar],
        count: prev[selectedAdhkar].count + 1
      }
    }));

    if (currentAdhkar.goal > 0 && currentAdhkar.count + 1 === currentAdhkar.goal) {
      Vibration.vibrate([0, 200, 100, 200, 100, 200]);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetCount}>
            <Icon name="refresh-ccw" size={24} color={themeColors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openGoalModal}>
            <Text style={{ color: themeColors.primary }}>{language === 'ar' ? 'تحديد هدف' : 'Set Goal'}</Text>
          </TouchableOpacity>
        </View>

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
              {language === 'ar' ? `الهدف: ${adhkars[selectedAdhkar].goal}` : `Goal: ${adhkars[selectedAdhkar].goal}`}
            </Text>
            <TouchableOpacity style={styles.cancelGoalButton} onPress={cancelGoal}>
              <Icon name="x" size={20} color={themeColors.primary} />
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
          <View style={styles.goalModal}>
            <View style={styles.goalModalContent}>
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
            </View>
          </View>
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
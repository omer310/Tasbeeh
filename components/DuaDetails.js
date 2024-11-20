import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, TextInput, Alert, Animated, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useDua } from '../contexts/DuaContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SuccessModal = ({ visible, onClose, message }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Success</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const DuaDetails = ({ route, navigation }) => {
  const { 
    dua, 
    category, 
    index, 
    isDarkMode, 
    themeColors, 
    language 
  } = route.params;

  const { 
    favorites, 
    onToggleFavorite, 
    onAddNote, 
    onAddToCollection,
    myDuas,
    notes,
    getDuaNote
  } = useDua();

  const [note, setNote] = useState(getDuaNote(dua.id) || dua.note || '');
  const [favorite, setFavorite] = useState(favorites?.[dua.id] || false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const translateX = useRef(new Animated.Value(0)).current;
  const panRef = useRef(null);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      
      // Check if we're in MyDuas view or regular category view
      const items = category?.subcategories || myDuas;
      const totalItems = items?.length || 0;
      
      if (!items || totalItems === 0) return;

      if (translationX > 30 && index > 0) {
        navigation.replace('DuaDetails', {
          dua: items[index - 1],
          category: category || { title: 'My Duas', titleAr: 'أدعيتي' },
          index: index - 1,
          isDarkMode,
          themeColors,
          language,
          isFavorite: favorites?.[items[index - 1].id] || false
        });
      } else if (translationX < -30 && index < totalItems - 1) {
        navigation.replace('DuaDetails', {
          dua: items[index + 1],
          category: category || { title: 'My Duas', titleAr: 'أدعيتي' },
          index: index + 1,
          isDarkMode,
          themeColors,
          language,
          isFavorite: favorites?.[items[index + 1].id] || false
        });
      }
    }
  };

  useEffect(() => {
    setFavorite(favorites?.[dua.id] || false);
  }, [favorites]);

  useEffect(() => {
    setNote(getDuaNote(dua.id) || dua.note || '');
  }, [dua.id, notes]);

  const handleToggleFavorite = () => {
    console.log('handleToggleFavorite called');
    if (typeof onToggleFavorite === 'function') {
      onToggleFavorite(dua);
      setFavorite(!favorite);
    } else {
      console.error('onToggleFavorite is not a function');
    }
  };

  const handleAddNote = () => {
    if (typeof onAddNote === 'function') {
      onAddNote(dua.id, note, dua);
      setSuccessMessage('Note saved successfully!');
      setShowSuccessModal(true);
    } else {
      console.error('onAddNote is not a function');
    }
  };

  const handleAddToCollection = () => {
    if (typeof onAddToCollection === 'function') {
      const duaWithCategory = {
        ...dua,
        category: category,
        parentCategory: category
      };
      onAddToCollection(duaWithCategory);
      setSuccessMessage('Dua added to collection!');
      setShowSuccessModal(true);
    } else {
      console.error('onAddToCollection is not a function');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <View style={{ flex: 1 }}>
          <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1E1E1E' : themeColors.backgroundColor }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            <View style={styles.container}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFFFFF' : themeColors.textColor} />
                  </TouchableOpacity>
                  <Text style={[styles.duaCounter, { color: themeColors.accent }]}>
                    {index + 1}/{(category?.subcategories || myDuas)?.length || 1}
                  </Text>
                </View>
                <Text style={[styles.headerText, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
                  {language === 'ar' ? 
                    (category?.titleAr || 'أدعيتي') : 
                    (category?.title || 'My Duas')}
                </Text>
                <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                  <Ionicons name={favorite ? "star" : "star-outline"} size={24} color="#FFD700" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.duaDetailsContent}>
                <Text style={[styles.duaDetailsTitle, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
                  {language === 'ar' ? dua.titleAr : dua.title}
                </Text>
                <View style={styles.arabicContainer}>
                  <Text style={[styles.arabicText, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
                    {dua.arabic}
                  </Text>
                </View>
                <Text style={[styles.transliterationText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : themeColors.secondaryTextColor }]}>
                  {language === 'ar' ? dua.transliterationAr : dua.transliteration}
                </Text>
                <Text style={[styles.translationText, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
                  {language === 'ar' ? dua.translationAr : dua.translation}
                </Text>
                <View style={[styles.referenceContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : themeColors.accent + '20' }]}>
                  <Text style={[styles.referenceTitle, { color: themeColors.accent }]}>
                    {language === 'ar' ? 'المرجع' : 'Reference'}
                  </Text>
                  <Text style={[styles.referenceText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : themeColors.secondaryTextColor }]}>
                    {language === 'ar' ? dua.referenceAr : dua.reference}
                  </Text>
                </View>
                <View style={styles.noteContainer}>
                  <Text style={[styles.noteTitle, { color: themeColors.accent }]}>Note</Text>
                  <TextInput
                    style={[styles.noteInput, { 
                      color: isDarkMode ? '#FFFFFF' : themeColors.textColor, 
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)' 
                    }]}
                    multiline
                    value={note}
                    onChangeText={setNote}
                    placeholder="Add a note..."
                    placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                  />
                  <TouchableOpacity style={styles.saveNoteButton} onPress={handleAddNote}>
                    <Text style={styles.saveNoteButtonText}>Save Note</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.addToCollectionButton} onPress={handleAddToCollection}>
                  <Text style={styles.addToCollectionButtonText}>Add to Collection</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </PanGestureHandler>
      <SuccessModal 
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: StatusBar.currentHeight || 0, // Add padding for status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  duaCounter: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  favoriteButton: {
    padding: 5,
    marginLeft: 10,
  },
  duaDetailsContent: {
    flex: 1,
  },
  duaDetailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  arabicContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  arabicText: {
    fontSize: 24,
    textAlign: 'right',
    lineHeight: 40,
    fontFamily: 'Scheherazade',
  },
  transliterationText: {
    fontSize: 18,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  translationText: {
    fontSize: 18,
    marginBottom: 20,
    lineHeight: 26,
  },
  referenceContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  referenceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  referenceText: {
    fontSize: 16,
  },
  noteContainer: {
    marginTop: 20,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveNoteButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addToCollectionButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  addToCollectionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4CAF50',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 25,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DuaDetails;

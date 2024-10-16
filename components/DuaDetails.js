import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DuaDetails = ({ route, navigation }) => {
  const { 
    dua, 
    category, 
    index, 
    isDarkMode, 
    themeColors, 
    language, 
    onToggleFavorite, 
    onAddNote, 
    onAddToCollection,
    isFavorite 
  } = route.params;

  const [note, setNote] = useState(dua.note || '');
  const [favorite, setFavorite] = useState(isFavorite);

  useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

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
    console.log('handleAddNote called');
    if (typeof onAddNote === 'function') {
      onAddNote(dua.id, note);
    } else {
      console.error('onAddNote is not a function');
    }
  };

  const handleAddToCollection = () => {
    console.log('handleAddToCollection called');
    if (typeof onAddToCollection === 'function') {
      onAddToCollection(dua);
    } else {
      console.error('onAddToCollection is not a function');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1E1E1E' : themeColors.backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFFFFF' : themeColors.textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
            {language === 'ar' ? category.titleAr : category.title}
          </Text>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
            <Ionicons name={favorite ? "star" : "star-outline"} size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.duaDetailsContent}>
          <Text style={[styles.duaDetailsProgress, { color: themeColors.accent }]}>
            {index + 1}/{category.subcategories.length}
          </Text>
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
              style={[styles.noteInput, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)' }]}
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
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  duaDetailsContent: {
    flex: 1,
  },
  duaDetailsProgress: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
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
  favoriteButton: {
    padding: 5,
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
});

export default DuaDetails;

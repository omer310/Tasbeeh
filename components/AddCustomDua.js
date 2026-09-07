import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDua } from '../contexts/DuaContext';

const AddCustomDua = ({ route, navigation }) => {
  const { isDarkMode, themeColors } = route.params;
  const { onAddCustomDua, hydrated } = useDua();

  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [arabic, setArabic] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [translation, setTranslation] = useState('');

  const handleSave = () => {
    if (hydrated && title.trim() && arabic.trim() && translation.trim()) {
      const newDua = {
        title,
        titleAr,
        arabic,
        transliteration,
        translation,
      };
      onAddCustomDua(newDua);
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Please fill in at least the title, Arabic text, and translation.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#1E1E1E' : themeColors.backgroundColor }]}>
      <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={{ paddingVertical: 12 }}><Text style={{ color: themeColors.activeTabColor }}>Back to Duas</Text></TouchableOpacity>
      <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>Title</Text>
      <TextInput
        style={[styles.input, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor, borderColor: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter title"
        placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
      />

      <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>Arabic Title</Text>
      <TextInput
        style={[styles.input, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor, borderColor: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}
        value={titleAr}
        onChangeText={setTitleAr}
        placeholder="Enter Arabic title"
        placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
      />

      <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>Arabic Text</Text>
      <TextInput
        style={[styles.input, styles.multilineInput, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor, borderColor: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}
        value={arabic}
        onChangeText={setArabic}
        placeholder="Enter Arabic text"
        placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
        multiline
      />

      <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>Transliteration</Text>
      <TextInput
        style={[styles.input, styles.multilineInput, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor, borderColor: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}
        value={transliteration}
        onChangeText={setTransliteration}
        placeholder="Enter transliteration"
        placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
        multiline
      />

      <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>Translation</Text>
      <TextInput
        style={[styles.input, styles.multilineInput, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor, borderColor: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}
        value={translation}
        onChangeText={setTranslation}
        placeholder="Enter translation"
        placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
        multiline
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Dua</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddCustomDua;
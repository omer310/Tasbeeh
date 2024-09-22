//TODO: fix the margin problem where the text goes under the navigation bar

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Platform,
  SafeAreaView,
  Modal
} from 'react-native';
import axios from 'axios';
import { colors, globalStyles } from '../styles/globalStyles';

const EDITIONS = [
  { label: 'Bukhari', value: 'bukhari' },
  { label: 'Muslim', value: 'muslim' },
  { label: 'Abu Dawud', value: 'abudawud' },
  { label: 'Tirmidhi', value: 'tirmidhi' },
  { label: 'Nasai', value: 'nasai' },
  { label: 'Ibn Majah', value: 'ibnmajah' },
];

export default function HadithOfTheDay({ themeColors }) {
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEdition, setSelectedEdition] = useState('bukhari');
  const [isPickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    fetchRandomHadith();
  }, [selectedEdition]);

  const fetchRandomHadith = async () => {
    try {
      setLoading(true);
      setError(null);
      const engResponse = await axios.get(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${selectedEdition}.json`);
      const araResponse = await axios.get(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${selectedEdition}.json`);
      const engHadiths = engResponse.data.hadiths;
      const araHadiths = araResponse.data.hadiths;
      const randomIndex = Math.floor(Math.random() * engHadiths.length);
      setHadiths([{
        engText: engHadiths[randomIndex].text,
        araText: araHadiths[randomIndex].text,
        collection: EDITIONS.find(e => e.value === selectedEdition).label,
        hadithnumber: engHadiths[randomIndex].hadithnumber
      }]);
    } catch (error) {
      console.error('Error fetching hadith:', error);
      setError('Failed to fetch hadith. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchHadith = async () => {
    if (!searchTerm.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const engResponse = await axios.get(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${selectedEdition}.json`);
      const araResponse = await axios.get(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${selectedEdition}.json`);
      const engHadiths = engResponse.data.hadiths;
      const araHadiths = araResponse.data.hadiths;
      
      const foundHadiths = engHadiths.filter(h => 
        h.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.hadithnumber.toString() === searchTerm ||
        araHadiths.find(ah => ah.hadithnumber === h.hadithnumber).text.includes(searchTerm)
      );
      
      if (foundHadiths.length > 0) {
        setHadiths(foundHadiths.map(h => ({
          engText: h.text,
          araText: araHadiths.find(ah => ah.hadithnumber === h.hadithnumber).text,
          collection: EDITIONS.find(e => e.value === selectedEdition).label,
          hadithnumber: h.hadithnumber
        })));
      } else {
        setError('No hadiths found with the given search term.');
      }
    } catch (error) {
      console.error('Error searching hadith:', error);
      setError('Failed to search hadith. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderHadith = useCallback(({ item }) => (
    <View style={styles.hadithContainer}>
      <Text style={styles.hadithText}>{item.engText}</Text>
      <Text style={styles.arabicText}>{item.araText}</Text>
      <Text style={styles.hadithReference}>- {item.collection}, Hadith {item.hadithnumber}</Text>
    </View>
  ), []);

  const onChangeSearchTerm = useCallback((text) => {
    setSearchTerm(text);
  }, []);

  const onPressSearch = useCallback(() => {
    searchHadith();
  }, [searchHadith, searchTerm]);

  const onPressRandom = useCallback(() => {
    fetchRandomHadith();
  }, [fetchRandomHadith]);

  const renderHeader = useMemo(() => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: themeColors.textColor }]}>Hadith Search</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { color: themeColors.textColor, borderColor: themeColors.textColor }]}
          placeholder="Search for a hadith..."
          placeholderTextColor={themeColors.textColor}
          value={searchTerm}
          onChangeText={onChangeSearchTerm}
        />
        <TouchableOpacity style={styles.button} onPress={onPressSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={[styles.pickerButton, { borderColor: themeColors.textColor }]} 
        onPress={() => setPickerVisible(true)}
      >
        <Text style={[styles.pickerButtonText, { color: themeColors.textColor }]}>
          {EDITIONS.find(e => e.value === selectedEdition).label}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onPressRandom}>
        <Text style={styles.buttonText}>Get Random Hadith</Text>
      </TouchableOpacity>
    </View>
  ), [themeColors, searchTerm, selectedEdition, onChangeSearchTerm, onPressSearch, onPressRandom]);

  const renderPickerModal = () => (
    <Modal
      visible={isPickerVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={[styles.pickerContainer, { backgroundColor: themeColors.backgroundColor }]}>
          {EDITIONS.map((edition) => (
            <TouchableOpacity
              key={edition.value}
              style={[
                styles.pickerItem,
                selectedEdition === edition.value && styles.pickerItemSelected
              ]}
              onPress={() => {
                setSelectedEdition(edition.value);
                setPickerVisible(false);
              }}
            >
              <Text style={[
                styles.pickerItemText,
                { color: themeColors.textColor },
                selectedEdition === edition.value && styles.pickerItemTextSelected
              ]}>
                {edition.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={() => setPickerVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={hadiths}
        renderItem={renderHadith}
        keyExtractor={(item) => item.hadithnumber.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={styles.error}>No hadiths found.</Text>
          )
        }
        contentContainerStyle={styles.flatListContent}
      />
      {renderPickerModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  flatListContent: {
    padding: 20,
    paddingBottom: 100, // Add extra padding at the bottom for the tab bar
  },
  title: {
    ...globalStyles.title,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  hadithContainer: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hadithText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 10,
  },
  arabicText: {
    fontSize: 18,
    lineHeight: 30,
    color: colors.text,
    marginBottom: 10,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  hadithReference: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  error: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginTop: 20,
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  pickerButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: {
    backgroundColor: colors.primary + '20', // 20% opacity
  },
  pickerItemText: {
    fontSize: 18,
  },
  pickerItemTextSelected: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    height: 20,
  },
});
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
  { label: 'Bukhari', value: 'bukhari', labelAr: 'البخاري' },
  { label: 'Muslim', value: 'muslim', labelAr: 'مسلم' },
  { label: 'Abu Dawud', value: 'abudawud', labelAr: 'أبو داود' },
  { label: 'Tirmidhi', value: 'tirmidhi', labelAr: 'الترمذي' },
  { label: 'Nasai', value: 'nasai', labelAr: 'النسائي' },
  { label: 'Ibn Majah', value: 'ibnmajah', labelAr: 'ابن ماجه' },
];

const translations = {
  hadithSearch: { en: 'Hadith Search', ar: 'بحث الاحاديث' },
  searchPlaceholder: { en: 'Search for a hadith...', ar: 'ابحث عن حديث...' },
  search: { en: 'Search', ar: 'بحث' },
  getRandomHadith: { en: 'Get Random Hadith', ar: 'احصل على حديث عشوائي' },
  noHadithsFound: { en: 'No hadiths found.', ar: 'لم يتم العثور على أحاديث.' },
  hadith: { en: 'Hadith', ar: 'حديث' },
  close: { en: 'Close', ar: 'إغلاق' },
  relevance: { en: 'Relevance', ar: 'الصلة' },
  relevanceExplanation: { 
    en: 'Higher score means more matches found', 
    ar: 'الدرجة الأعلى تعني المزيد من التطابقات'
  },
  searching: { en: 'Searching...', ar: 'جاري البحث...' },
  searchingInBook: { 
    en: 'Searching in', 
    ar: 'جاري البحث في' 
  },
};

export default function HadithOfTheDay({ themeColors, language }) {
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEdition, setSelectedEdition] = useState('bukhari');
  const [isPickerVisible, setPickerVisible] = useState(false);

  const getTranslatedText = (key) => {
    return translations[key][language] || key;
  };

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
      
      const searchTerms = searchTerm
        .split(' ')
        .filter(term => term.length > 0)
        .map(term => term.trim());
      
      const foundHadiths = engHadiths.filter(h => {
        const engText = h.text.toLowerCase();
        const araText = araHadiths.find(ah => ah.hadithnumber === h.hadithnumber).text;
        const hadithNumber = h.hadithnumber.toString();

        return searchTerms.some(term => {
          const normalizedAraText = araText.normalize('NFKD').replace(/[\u064B-\u065F]/g, '');
          const normalizedSearchTerm = term.normalize('NFKD').replace(/[\u064B-\u065F]/g, '');
          
          const isArabic = /[\u0600-\u06FF]/.test(term);
          
          if (isArabic) {
            return normalizedAraText.includes(normalizedSearchTerm);
          } else {
            return engText.includes(term.toLowerCase()) || hadithNumber === term;
          }
        });
      });
      
      const sortedHadiths = foundHadiths.sort((a, b) => {
        const scoreA = calculateRelevanceScore(a, searchTerms, araHadiths);
        const scoreB = calculateRelevanceScore(b, searchTerms, araHadiths);
        return scoreB - scoreA;
      });
      
      if (sortedHadiths.length > 0) {
        setHadiths(sortedHadiths.map(h => ({
          engText: h.text,
          araText: araHadiths.find(ah => ah.hadithnumber === h.hadithnumber).text,
          collection: EDITIONS.find(e => e.value === selectedEdition).label,
          hadithnumber: h.hadithnumber,
          relevanceScore: calculateRelevanceScore(h, searchTerms, araHadiths)
        })));
      } else {
        setError(getTranslatedText('noHadithsFound'));
      }
    } catch (error) {
      console.error('Error searching hadith:', error);
      setError('Failed to search hadith. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateRelevanceScore = (hadith, searchTerms, araHadiths) => {
    const engText = hadith.text.toLowerCase();
    const araText = araHadiths.find(ah => ah.hadithnumber === hadith.hadithnumber).text;
    const normalizedAraText = araText.normalize('NFKD').replace(/[\u064B-\u065F]/g, '');
    const hadithNumber = hadith.hadithnumber.toString();

    let score = 0;
    searchTerms.forEach(term => {
      const normalizedSearchTerm = term.normalize('NFKD').replace(/[\u064B-\u065F]/g, '');
      const isArabic = /[\u0600-\u06FF]/.test(term);

      if (isArabic) {
        const araMatches = (normalizedAraText.match(new RegExp(normalizedSearchTerm, 'g')) || []).length;
        score += araMatches * 1.2;
      } else {
        const engMatches = (engText.match(new RegExp(term.toLowerCase(), 'g')) || []).length;
        score += engMatches;
      }

      if (hadithNumber === term) {
        score += 10;
      }
    });
    
    return Math.round(score);
  };

  const renderHadith = useCallback(({ item }) => (
    <View style={[
      styles.hadithContainer, 
      { 
        backgroundColor: themeColors.isDark ? 'rgba(255, 255, 255, 0.05)' : themeColors.backgroundColor,
        borderRadius: 15,
      }
    ]}>
      <View style={styles.hadithHeader}>
        <Text style={[styles.hadithNumber, { color: themeColors.secondaryTextColor }]}>
          #{item.hadithnumber}
        </Text>
        {item.relevanceScore > 0 && (
          <TouchableOpacity 
            style={[styles.relevanceBadge, { backgroundColor: themeColors.primary + '20' }]}
            onPress={() => alert(getTranslatedText('relevanceExplanation'))}
          >
            <Text style={[styles.relevanceText, { color: themeColors.primary }]}>
              {getTranslatedText('relevance')}: {item.relevanceScore} ⓘ
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {language === 'ar' ? (
        // Arabic mode - show Arabic first
        <>
          <Text style={[styles.arabicText, { color: themeColors.textColor }]}>{item.araText}</Text>
          <View style={styles.separator} />
          <Text style={[styles.hadithText, { color: themeColors.textColor }]}>{item.engText}</Text>
        </>
      ) : (
        // English mode - show English first
        <>
          <Text style={[styles.hadithText, { color: themeColors.textColor }]}>{item.engText}</Text>
          <View style={styles.separator} />
          <Text style={[styles.arabicText, { color: themeColors.textColor }]}>{item.araText}</Text>
        </>
      )}
      
      <Text style={[styles.hadithReference, { color: themeColors.secondaryTextColor }]}>
        - {language === 'ar' ? EDITIONS.find(e => e.value === selectedEdition).labelAr : item.collection}, 
        {getTranslatedText('hadith')} {item.hadithnumber}
      </Text>
    </View>
  ), [language, selectedEdition, themeColors]);

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
      <Text style={[styles.title, { color: themeColors.textColor }]}>{getTranslatedText('hadithSearch')}</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { color: themeColors.textColor, borderColor: themeColors.textColor, backgroundColor: themeColors.inputBackground }]}
          placeholder={getTranslatedText('searchPlaceholder')}
          placeholderTextColor={themeColors.secondaryTextColor}
          value={searchTerm}
          onChangeText={onChangeSearchTerm}
          editable={!loading}
        />
        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: themeColors.primary },
            loading && styles.buttonDisabled
          ]} 
          onPress={onPressSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={themeColors.backgroundColor} />
          ) : (
            <Text style={[styles.buttonText, { color: themeColors.backgroundColor }]}>
              {getTranslatedText('search')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      {loading && (
        <View style={styles.searchingIndicator}>
          <Text style={[styles.searchingText, { color: themeColors.textColor }]}>
            {getTranslatedText('searchingInBook')} {' '}
            {language === 'ar' 
              ? EDITIONS.find(e => e.value === selectedEdition).labelAr 
              : EDITIONS.find(e => e.value === selectedEdition).label}
            ...
          </Text>
        </View>
      )}
      <TouchableOpacity 
        style={[styles.pickerButton, { borderColor: themeColors.textColor }]} 
        onPress={() => setPickerVisible(true)}
        disabled={loading}
      >
        <Text style={[styles.pickerButtonText, { color: themeColors.textColor }]}>
          {language === 'ar' 
            ? EDITIONS.find(e => e.value === selectedEdition).labelAr 
            : EDITIONS.find(e => e.value === selectedEdition).label}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: themeColors.primary }]} 
        onPress={onPressRandom}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: themeColors.backgroundColor }]}>
          {getTranslatedText('getRandomHadith')}
        </Text>
      </TouchableOpacity>
    </View>
  ), [themeColors, searchTerm, selectedEdition, language, onChangeSearchTerm, onPressSearch, onPressRandom, loading]);

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
                {language === 'ar' ? edition.labelAr : edition.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: themeColors.primary }]}
            onPress={() => setPickerVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: themeColors.backgroundColor }]}>{getTranslatedText('close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: themeColors.isDark ? '#121212' : themeColors.backgroundColor 
    }]}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={hadiths}
        renderItem={renderHadith}
        keyExtractor={(item) => item.hadithnumber.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={[styles.loadingText, { color: themeColors.textColor }]}>
                {getTranslatedText('searching')}
              </Text>
            </View>
          ) : error ? (
            <Text style={[styles.error, { color: themeColors.textColor }]}>{error}</Text>
          ) : (
            <Text style={[styles.error, { color: themeColors.textColor }]}>{getTranslatedText('noHadithsFound')}</Text>
          )
        }
        contentContainerStyle={[
          styles.flatListContent,
          { backgroundColor: themeColors.isDark ? '#121212' : themeColors.backgroundColor }
        ]}
      />
      {renderPickerModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  hadithContainer: {
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
    marginBottom: 15,
    direction: 'ltr',
  },
  arabicText: {
    fontSize: 20,
    lineHeight: 36,
    marginBottom: 15,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    direction: 'rtl',
  },
  hadithReference: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  error: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 10,
  },
  hadithHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hadithNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  relevanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  relevanceText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchingText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
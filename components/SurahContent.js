import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';

const SurahContent = ({ surah, themeColors, onBack }) => {
  const [surahContent, setSurahContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurahContent();
  }, []);

  const fetchSurahContent = async () => {
    try {
      const response = await axios.get(`http://api.alquran.cloud/v1/surah/${surah.number}/quran-uthmani`);
      const surahData = response.data.data;
      
      if (surah.number !== 1 && surahData.ayahs.length > 0) {
        const firstVerse = surahData.ayahs[0];
        if (firstVerse.text.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')) {
          firstVerse.text = firstVerse.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
        }
      }
      
      setSurahContent(surahData.ayahs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching surah content:', error);
      setLoading(false);
    }
  };

  const renderVerse = ({ item }) => (
    <View style={styles.verseContainer}>
      <Text style={[styles.verseText, { color: themeColors.textColor }]}>
        {item.text}
        <Text style={styles.verseNumber}> {'\u06DD'}{item.numberInSurah}</Text>
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.textColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <View style={styles.backButtonIcon}>
          <Text style={styles.backButtonArrow}>←</Text>
        </View>
        <Text style={[styles.backButtonLabel, { color: themeColors.textColor }]}>
          Back to Surahs
        </Text>
      </TouchableOpacity>
      <View style={styles.surahHeader}>
        <Text style={[styles.surahTitle, { color: themeColors.textColor }]}>{surah.name}</Text>
        <Text style={[styles.surahSubtitle, { color: themeColors.textColor }]}>{surah.englishName}</Text>
        <Text style={[styles.surahInfo, { color: themeColors.textColor }]}>
          {surah.numberOfAyahs} Verses • {surah.revelationType}
        </Text>
      </View>
      {surah.number !== 1 && surah.number !== 9 && (
        <Text style={[styles.bismillahText, { color: themeColors.textColor }]}>
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </Text>
      )}
      <FlatList
        data={surahContent}
        renderItem={renderVerse}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={styles.surahContentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backButtonLabel: {
    fontSize: 18,
    fontWeight: '500',
  },
  surahHeader: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    paddingBottom: 10,
  },
  surahTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  surahSubtitle: {
    fontSize: 20,
    marginTop: 5,
    textAlign: 'center',
  },
  surahInfo: {
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  bismillahText: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Scheherazade', // Use an appropriate Arabic font
  },
  surahContentContainer: {
    paddingBottom: 20,
  },
  verseContainer: {
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  verseText: {
    fontSize: 24,
    lineHeight: 50,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'Scheherazade', // Use an appropriate Arabic font
  },
  verseNumber: {
    fontSize: 18,
    color: '#4CAF50',
    marginLeft: 5,
  },
});

export default SurahContent;
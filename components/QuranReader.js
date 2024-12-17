import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, ActivityIndicator, TextInput, ScrollView, Platform, TouchableWithoutFeedback, StatusBar, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import quranImages from './quranImages';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomColorPicker from './CustomColorPicker';
import { useNavigation } from '@react-navigation/native';
import { Switch } from 'react-native';
import { surahData } from '../data/surahData';
import EnglishTranslation from './EnglishTranslation';
import BookmarkManager from './BookmarkManager';
import BookmarkList from './BookmarkList';

function QuranReader({ navigation, themeColors, language }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [filteredSurahs, setFilteredSurahs] = useState([]);
  const [showSurahList, setShowSurahList] = useState(true);
  const [currentJuz, setCurrentJuz] = useState(16);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSurah, setCurrentSurah] = useState("");
  const [bookmarkedPage, setBookmarkedPage] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FF9800');
  const [bookmarks, setBookmarks] = useState({});
  const [isEnglishVersion, setIsEnglishVersion] = useState(false);
  const [englishPages, setEnglishPages] = useState({});
  const [focusMode, setFocusMode] = useState(false);
  const [showBookmarkList, setShowBookmarkList] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Fetch surahs data from API and load bookmarks
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.quran.com/api/v4/chapters?language=en');
        const data = await response.json();
        const savedBookmarks = await AsyncStorage.getItem('quranBookmarks');
        
        if (savedBookmarks !== null) {
          setBookmarks(JSON.parse(savedBookmarks));
        }
        
        const sortedSurahs = sortSurahs(data.chapters, JSON.parse(savedBookmarks) || {});
        setSurahs(sortedSurahs);
        setFilteredSurahs(sortedSurahs);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Fetch English translation when isEnglishVersion is true
    if (isEnglishVersion) {
      fetchEnglishTranslation();
    }
  }, [isEnglishVersion]);

  const fetchEnglishTranslation = async () => {
    try {
      const response = await fetch('https://api.quran.com/api/v4/quran/translations/131');
      const data = await response.json();

      if (!data.translations || !Array.isArray(data.translations)) {
        console.error('Unexpected API response structure:', data);
        return;
      }

      const formattedPages = {};
      data.translations.forEach((verse, index) => {
        if (!verse || typeof verse.text !== 'string') {
          return;
        }

        // Enhanced text cleaning
        const cleanText = verse.text
          .replace(/<sup.*?<\/sup>/g, '') // Remove sup elements with their content
          .replace(/[<>]/g, '') // Remove any remaining angle brackets
          .replace(/foot_note=\d+/g, '') // Remove foot_note references
          .replace(/\s+/g, ' ') // Normalize spaces
          .replace(/["]/g, '"') // Replace special quotes
          .replace(/[']/g, "'") // Replace special apostrophes
          .replace(/\s+([.,!?])/g, '$1') // Remove spaces before punctuation
          .trim();

        // Calculate page number (adjust this calculation as needed)
        const pageNumber = Math.floor(index / 7) + 1;
        
        if (!formattedPages[pageNumber]) {
          formattedPages[pageNumber] = [];
        }
        
        formattedPages[pageNumber].push({
          verseNumber: index + 1,
          text: cleanText
        });
      });

      setEnglishPages(formattedPages);
    } catch (error) {
      console.error('Error fetching English translation:', error);
      console.error('Error details:', error.message, error.stack);
    }
  };

  const sortSurahs = (surahsToSort, currentBookmarks) => {
    return BookmarkManager.sortSurahs(surahsToSort, currentBookmarks);
  };

  const saveBookmarks = async (newBookmarks) => {
    try {
      await AsyncStorage.setItem('quranBookmarks', JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
      const sortedSurahs = sortSurahs(surahs, newBookmarks);
      setSurahs(sortedSurahs);
      setFilteredSurahs(sortedSurahs);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };

  useEffect(() => {
    // Update Juz number based on current page
    // This is a simplified calculation and might need adjustment
    const calculatedJuz = Math.min(Math.ceil(currentPage / 20), 30);
    setCurrentJuz(calculatedJuz);

    // Update Surah name
    const surah = surahData.reduce((prev, curr) => 
      (curr.startPage <= currentPage) ? curr : prev
    );
    setCurrentSurah(surah.name);
  }, [currentPage]);

  useEffect(() => {
    // Update filtered surahs when search query changes
    const normalizeText = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF]/gi, '')
        .replace(/\s+/g, '');
    };

    const filtered = surahs.filter(surah =>
      normalizeText(surah.name_simple).includes(normalizeText(searchQuery)) ||
      normalizeText(surah.name_arabic).includes(normalizeText(searchQuery)) ||
      surah.id.toString().includes(searchQuery)
    );
    setFilteredSurahs(filtered);
  }, [searchQuery, surahs]);

  const toggleSurahList = () => {
    setShowSurahList(false);
    setShowBookmarkList(false);
    setShowColorPicker(false);
    setShowSurahList(!showSurahList);
  };

  const handleSurahClick = (surah) => {
    // Find the bookmarked page for this surah
    const bookmarkedPage = Object.keys(bookmarks).find(page => 
      parseInt(page) >= surah.pages[0] && parseInt(page) <= surah.pages[surah.pages.length - 1]
    );
    
    // Update both states at once
    setSelectedSurah(surah);
    setCurrentPage(bookmarkedPage ? parseInt(bookmarkedPage) : surah.pages[0]);
    setShowSurahList(false);
  };

  const handleGestureEvent = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (Math.abs(nativeEvent.translationX) > 50) {  // Check if swipe is significant enough
        if (nativeEvent.translationX > 0) {
          // Swipe right - go to next page (opposite of before)
          setCurrentPage((prevPage) => Math.min(prevPage + 1, 604));
        } else {
          // Swipe left - go to previous page (opposite of before)
          setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
        }
      }
    }
  };

  const toggleBookmark = async () => {
    if (bookmarks[currentPage]) {
      // Remove bookmark
      const newBookmarks = await BookmarkManager.removeBookmark(currentPage);
      setBookmarks(newBookmarks);
      const sortedSurahs = sortSurahs(surahs, newBookmarks);
      setSurahs(sortedSurahs);
      setFilteredSurahs(sortedSurahs);
    } else {
      // Show color picker and close other menus
      setShowSurahList(false);
      setShowBookmarkList(false);
      setShowColorPicker(true);
    }
  };

  const handleColorSelect = async (color) => {
    try {
      const newBookmarks = await BookmarkManager.saveBookmark(currentPage, color);
      setBookmarks(newBookmarks);
      const sortedSurahs = sortSurahs(surahs, newBookmarks);
      setSurahs(sortedSurahs);
      setFilteredSurahs(sortedSurahs);
      setShowColorPicker(false);
      setShowSurahList(false);
      setShowBookmarkList(false);
    } catch (error) {
      console.error('Error handling color selection:', error);
    }
  };

  const getUsedColors = () => {
    return Object.values(bookmarks) || [];
  };

  const handleOutsideClick = () => {
    setShowSurahList(false);
    setShowBookmarkList(false);
    setShowColorPicker(false);
  };

  const renderBookmarkIcon = () => {
    const bookmarkData = bookmarks[currentPage];
    const bookmarkColor = bookmarkData?.color || bookmarkData;
    return (
      <TouchableOpacity onPress={toggleBookmark} style={styles.iconButtonContainer}>
        <LinearGradient
          colors={[themeColors.gradientStart, themeColors.gradientEnd]}
          style={styles.iconButton}
        >
          <Ionicons 
            name={bookmarkColor ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={bookmarkColor || "#FFFFFF"} 
          />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderSurahItem = ({ item }) => {
    const bookmarkedPage = Object.keys(bookmarks).find(page => 
      parseInt(page) >= item.pages[0] && parseInt(page) <= item.pages[item.pages.length - 1]
    );
    const isBookmarked = !!bookmarkedPage;
    const bookmarkData = bookmarks[bookmarkedPage];
    const bookmarkColor = bookmarkData?.color || bookmarkData;

    return (
      <TouchableOpacity onPress={() => handleSurahClick(item)} style={styles.surahItemContainer}>
        <LinearGradient
          colors={[themeColors.gradientStart, themeColors.gradientEnd]}
          style={styles.surahNumberContainer}
        >
          <Text style={styles.surahNumber}>{item.id}</Text>
        </LinearGradient>
        <View style={styles.surahInfoContainer}>
          <Text style={[styles.surahName, { color: themeColors.textColor }]}>
            {isEnglishVersion ? item.translated_name.name : item.name_simple}
          </Text>
          <Text style={[styles.surahArabicName, { color: themeColors.textColor }]}>{item.name_arabic}</Text>
          <Text style={[styles.surahDetails, { color: themeColors.secondaryTextColor }]}>
            Page {item.pages[0]}  {item.verses_count} verses • {item.revelation_place}
          </Text>
        </View>
        {isBookmarked && (
          <View style={styles.bookmarkIconContainer}>
            <Ionicons 
              name="bookmark" 
              size={24} 
              color={bookmarkColor} 
              style={[
                styles.bookmarkIcon,
                themeColors.isDark && { opacity: 0.9 }
              ]} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
    console.warn('Failed to load Quran page image');
  };

  const handleVersePress = async (verseKey) => {
    try {
      // Stop any playing audio
      if (audioPlayer) {
        audioPlayer.stop();
      }

      // Fetch audio URL
      const audioResponse = await fetch(
        `https://api.quran.com/api/v4/recitations/7/by_ayah/${verseKey}`
      );
      const audioData = await audioResponse.json();
      const audioUrl = audioData.audio_files[0]?.audio_url;

      // Fetch tafsir
      const tafsirResponse = await fetch(
        `https://api.quran.com/api/v4/tafsirs/169/by_ayah/${verseKey}`
      );
      const tafsirData = await tafsirResponse.json();
      setTafsirContent(tafsirData.tafsirs[0]?.text || 'Tafsir not available');

      // Play audio
      if (audioUrl) {
        const sound = new Sound(audioUrl, null, (error) => {
          if (error) {
            console.error('Error loading sound:', error);
            return;
          }
          sound.play();
          setAudioPlayer(sound);
        });
      }

      setSelectedVerse(verseKey);
      setShowTafsir(true);
    } catch (error) {
      console.error('Error handling verse press:', error);
    }
  };

  const renderVerseOverlay = () => {
    if (!showTafsir) return null;

    return (
      <BlurView
        intensity={120}
        tint={themeColors.isDark ? 'dark' : 'light'}
        style={styles.verseOverlay}
      >
        <View style={[styles.tafsirContainer, { backgroundColor: themeColors.backgroundColor + '80' }]}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              setShowTafsir(false);
              if (audioPlayer) {
                audioPlayer.stop();
              }
            }}
          >
            <Ionicons name="close" size={24} color={themeColors.textColor} />
          </TouchableOpacity>
          <ScrollView style={styles.tafsirContent}>
            <Text style={[styles.tafsirText, { color: themeColors.textColor }]}>
              {tafsirContent}
            </Text>
          </ScrollView>
        </View>
      </BlurView>
    );
  };

  const renderQuranPage = () => (
    <View style={[
      styles.pageContainer, 
      { backgroundColor: themeColors.isDark ? themeColors.backgroundColor : 'white' }
    ]}>
      <View style={styles.headerInfoContainer}>
        <LinearGradient
          colors={[themeColors.gradientStart, themeColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerStrip}
        >
          <View style={styles.headerContent}>
            <Text style={styles.surahLabel} numberOfLines={1} adjustsFontSizeToFit>
              {currentSurah}
            </Text>
            <View style={styles.stripDivider} />
            <Text style={styles.pageLabel}>
              Page {currentPage}
            </Text>
            <View style={styles.stripDivider} />
            <Text style={styles.juzLabel}>
              Juz {currentJuz}
            </Text>
          </View>
        </LinearGradient>
      </View>
      
      <View style={styles.imageContainer}>
        <Image
          style={[styles.pageImage, themeColors.isDark && styles.invertedImage]}
          source={quranImages[currentPage] || quranImages[1]}
          resizeMode="contain"
        />
      </View>
    </View>
  );

  useEffect(() => {
    return () => {
      // Cleanup resources when component unmounts
      setCurrentPage(1);
      setIsLoading(false);
      setImageError(false);
    };
  }, []);

  const toggleBookmarkList = () => {
    setShowSurahList(false);
    setShowColorPicker(false);
    setShowBookmarkList(!showBookmarkList);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleOutsideClick}
          style={styles.content}
        >
          <View style={styles.quranContent}>
            <View style={[styles.topBar, { backgroundColor: themeColors.backgroundColor }]}>
              <TouchableOpacity onPress={toggleSurahList} style={styles.iconButtonContainer}>
                <LinearGradient
                  colors={[themeColors.gradientStart, themeColors.gradientEnd]}
                  style={styles.iconButton}
                >
                  <Ionicons name={showSurahList ? "menu" : "menu-outline"} size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              {renderBookmarkIcon()}
              <TouchableOpacity 
                onPress={toggleBookmarkList} 
                style={styles.iconButtonContainer}
              >
                <LinearGradient
                  colors={[themeColors.gradientStart, themeColors.gradientEnd]}
                  style={styles.iconButton}
                >
                  <Ionicons name="bookmarks-outline" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <PanGestureHandler
              onHandlerStateChange={handleGestureEvent}
              activeOffsetX={[-20, 20]}
            >
              <View style={styles.pageContainer}>
                {renderQuranPage()}
              </View>
            </PanGestureHandler>
          </View>
          {showSurahList && (
            <BlurView
              intensity={120}
              tint={themeColors.isDark ? 'dark' : 'light'}
              style={styles.surahListContainer}
            >
              <View style={[styles.surahList, { backgroundColor: themeColors.backgroundColor + '80' }]}>
                <View style={styles.surahListHeader}>
                  <Text style={[styles.heading, { color: themeColors.textColor }]}>Contents</Text>
                  <View style={styles.languageToggleContainer}>
                    <Text style={[styles.languageText, { color: themeColors.textColor }]}>Arabic</Text>
                    <Switch
                      value={isEnglishVersion}
                      onValueChange={setIsEnglishVersion}
                      trackColor={{ false: themeColors.gradientStart, true: themeColors.gradientEnd }}
                      thumbColor={isEnglishVersion ? themeColors.gradientStart : themeColors.gradientEnd}
                    />
                    <Text style={[styles.languageText, { color: themeColors.textColor }]}>English</Text>
                  </View>
                  <View style={[styles.searchContainer, { backgroundColor: themeColors.inputBackground }]}>
                    <Ionicons name="search" size={20} color={themeColors.textColor} style={styles.searchIcon} />
                    <TextInput
                      style={[styles.searchInput, { color: themeColors.textColor }]}
                      placeholder="Search Surah"
                      placeholderTextColor={themeColors.placeholderColor}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>
                <FlatList
                  data={filteredSurahs}
                  renderItem={renderSurahItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.surahListContent}
                />
              </View>
            </BlurView>
          )}
          {showColorPicker && (
            <BlurView
              intensity={120}
              tint={themeColors.isDark ? 'dark' : 'light'}
              style={styles.colorPickerContainer}
            >
              <View style={styles.colorPickerContent}>
                <Text style={[styles.colorPickerTitle, { color: themeColors.textColor }]}>
                  Select Bookmark Color
                </Text>
                <CustomColorPicker
                  onColorSelected={handleColorSelect}
                  currentColor={bookmarks[currentPage]}
                  usedColors={getUsedColors()}
                />
                <TouchableOpacity 
                  onPress={() => setShowColorPicker(false)}
                  style={styles.closeColorPickerButton}
                >
                  <Text style={styles.closeColorPickerText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          )}
          {showBookmarkList && (
            <BookmarkList
              bookmarks={bookmarks}
              onBookmarkPress={(page) => {
                setCurrentPage(page);
                setShowBookmarkList(false);
                BookmarkManager.updateLastVisited(page);
              }}
              themeColors={themeColors}
              onClose={() => setShowBookmarkList(false)}
              surahs={surahs}
            />
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  quranContent: {
    flex: 1,
  },
  SafeAreaView: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 54 : 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderColor: 'rgba(204, 204, 204, 0.3)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  iconButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 90,
    paddingBottom: 0,
  },
  headerInfoContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerStrip: {
    height: 32,
    marginHorizontal: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  surahLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
  },
  pageLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  juzLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  stripDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
  },
  pageImage: {
    width: '100%',
    height: '100%',
    aspectRatio: 0.6,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  pageNumberContainer: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '500',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderRadius: 15,
    backgroundColor: '#F1F8E9',
    overflow: 'hidden',
    textAlign: 'center',
  },
  pageNumberFrame: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 20,
    borderStyle: 'dashed',
  },
  surahListContainer: {
    position: 'absolute',
    top: 85,
    left: 0,
    width: '85%',
    height: '87%',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    zIndex: 1000,
  },
  surahList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  surahListHeader: {
    paddingVertical: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  surahListContent: {
    paddingBottom: 80,
  },
  surahItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  surahNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  surahNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  colorPickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
  },
  colorPickerContent: {
    width: '80%',
    height: '60%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeColorPickerButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeColorPickerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  languageToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  languageText: {
    fontSize: 14,
    marginHorizontal: 10,
  },
  darkModeImage: {
    opacity: 0.87, // Slightly reduce opacity in dark mode for better contrast
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invertedImage: {
    opacity: 0.87,
    tintColor: '#FFFFFF',
  },
  bookmarkIconContainer: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  bookmarkIcon: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default QuranReader;
import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions,  ActivityIndicator, TextInput, ScrollView, Platform, TouchableWithoutFeedback, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import QuranTextPage from './QuranTextPage';
import chapters from '../data/quran/chapters.json';
import { getQuranPage } from '../utils/quranData';
import BookmarkManager from './BookmarkManager';
import BookmarkList from './BookmarkList';

function QuranReader({ navigation, themeColors, language }) {
  const isDarkMode = themeColors.isDark;
  const [readerMode, setReaderMode] = useState('mushaf');
  const [fontSize, setFontSize] = useState(30);
  const [showTranslation, setShowTranslation] = useState(true);
  const [readerReady, setReaderReady] = useState(false);

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
        const data = { chapters };
        const preferences = JSON.parse(await AsyncStorage.getItem('quranReaderPreferences') || '{}');
        if (['mushaf', 'flow', 'verses'].includes(preferences.mode)) setReaderMode(preferences.mode);
        if (Number.isFinite(preferences.fontSize)) setFontSize(Math.max(24, Math.min(44, preferences.fontSize)));
        setShowTranslation(preferences.translation !== false);
        if (Number.isInteger(preferences.page)) setCurrentPage(Math.max(1, Math.min(604, preferences.page)));
        const savedBookmarks = await AsyncStorage.getItem('quranBookmarks');

        if (savedBookmarks !== null) {
          setBookmarks(JSON.parse(savedBookmarks));
        }

        const sortedSurahs = sortSurahs(data.chapters, JSON.parse(savedBookmarks) || {});
        setSurahs(sortedSurahs);
        setFilteredSurahs(sortedSurahs);
      } catch (error) {
        setSurahs(chapters); setFilteredSurahs(chapters);
        console.warn('Reading settings could not be loaded:', error);
      } finally { setReaderReady(true); }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!readerReady) return;
    AsyncStorage.setItem('quranReaderPreferences', JSON.stringify({ mode: readerMode, fontSize, translation: showTranslation, page: currentPage })).catch(console.warn);
  }, [readerReady, readerMode, fontSize, showTranslation, currentPage]);

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
    const calculatedJuz = getQuranPage(currentPage)[0]?.juz || 1;
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
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Bookmark this page" onPress={toggleBookmark} style={styles.iconButtonContainer}>
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

  const renderQuranPage = () => (
    <View style={[
      styles.pageContainer,
      { backgroundColor: '#FAF9F4' }
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
          style={styles.pageImage}
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
        <View style={styles.content}>
          <View style={styles.quranContent}>
            <View style={[styles.topBar, { backgroundColor: themeColors.backgroundColor }]}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Quran contents" onPress={toggleSurahList} style={styles.iconButtonContainer}>
                <LinearGradient
                  colors={[themeColors.gradientStart, themeColors.gradientEnd]}
                  style={styles.iconButton}
                >
                  <Ionicons name={showSurahList ? "menu" : "menu-outline"} size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              {renderBookmarkIcon()}
              <TouchableOpacity
                accessibilityRole="button" accessibilityLabel="Quran bookmarks" onPress={toggleBookmarkList}
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
            <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingBottom: 10 }}>
              {[['mushaf', 'Mushaf'], ['flow', 'Flowing'], ['verses', 'Ayah cards']].map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="tab" accessibilityState={{ selected: readerMode === id }} onPress={() => setReaderMode(id)} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: readerMode === id ? themeColors.activeTabColor : themeColors.inputBackground }}><Text style={{ color: readerMode === id ? '#fff' : themeColors.textColor, fontWeight: '600' }}>{label}</Text></TouchableOpacity>)}
            </View>
            {readerMode !== 'mushaf' && <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 }}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Decrease Quran text size" disabled={fontSize <= 24} onPress={() => setFontSize(value => Math.max(24, value - 2))} style={{ padding: 10 }}><Text style={{ color: themeColors.textColor }}>A−</Text></TouchableOpacity>
              <Text style={{ color: themeColors.secondaryTextColor }}>{fontSize}</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Increase Quran text size" disabled={fontSize >= 44} onPress={() => setFontSize(value => Math.min(44, value + 2))} style={{ padding: 10 }}><Text style={{ color: themeColors.textColor }}>A+</Text></TouchableOpacity>
              {readerMode === 'verses' && <><Text style={{ color: themeColors.textColor }}>English</Text><Switch accessibilityLabel="Show English translation" value={showTranslation} onValueChange={setShowTranslation} /></>}
            </View>}
            <PanGestureHandler enabled={readerMode === 'mushaf'}
              onHandlerStateChange={handleGestureEvent}
              activeOffsetX={[-20, 20]}
            >
              <View style={styles.pageContainer}>
                {readerMode === 'mushaf' ? renderQuranPage() : <QuranTextPage page={currentPage} mode={readerMode} fontSize={fontSize} translation={showTranslation} themeColors={themeColors} />}
              </View>
            </PanGestureHandler>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 }}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous Quran page" disabled={currentPage <= 1} onPress={() => setCurrentPage(page => Math.max(1, page - 1))} style={{ padding: 10, opacity: currentPage <= 1 ? 0.3 : 1 }}><Ionicons name="chevron-back" size={22} color={themeColors.activeTabColor} /></TouchableOpacity>
              <Text style={{ color: themeColors.secondaryTextColor }}>{currentPage} / 604</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next Quran page" disabled={currentPage >= 604} onPress={() => setCurrentPage(page => Math.min(604, page + 1))} style={{ padding: 10, opacity: currentPage >= 604 ? 0.3 : 1 }}><Ionicons name="chevron-forward" size={22} color={themeColors.activeTabColor} /></TouchableOpacity>
            </View>
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
        </View>
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
    paddingTop: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(204, 204, 204, 0.3)',
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
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerInfoContainer: { paddingVertical: 10 },
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
    marginTop: 0,
  },
  pageImage: {
    width: '100%',
    height: '100%',

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
    top: 66,
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

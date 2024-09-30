import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import quranImages from './quranImages';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomColorPicker from './CustomColorPicker';
import { useNavigation } from '@react-navigation/native';


// Surah lookup table (page numbers are examples, please verify and adjust)
const surahData = [
  { name: "Al-Fatihah", startPage: 1 },
  { name: "Al-Baqarah", startPage: 2 },
  { name: "Aal-E-Imran", startPage: 50 },
  { name: "An-Nisa", startPage: 77 },
  { name: "Al-Ma'idah", startPage: 106 },
  { name: "Al-An'am", startPage: 128 },
  { name: "Al-A'raf", startPage: 151 },
  { name: "Al-Anfal", startPage: 177 },
  { name: "At-Tawbah", startPage: 187 },
  { name: "Yunus", startPage: 208 },
  { name: "Hud", startPage: 221 },
  { name: "Yusuf", startPage: 235 },
  { name: "Ar-Ra'd", startPage: 249 },
  { name: "Ibrahim", startPage: 255 },
  { name: "Al-Hijr", startPage: 262 },
  { name: "An-Nahl", startPage: 267 },
  { name: "Al-Isra", startPage: 282 },
  { name: "Al-Kahf", startPage: 293 },
  { name: "Maryam", startPage: 305 },
  { name: "Ta-Ha", startPage: 312 },
  { name: "Al-Anbiya", startPage: 322 },
  { name: "Al-Hajj", startPage: 332 },
  { name: "Al-Mu'minun", startPage: 342 },
  { name: "An-Nur", startPage: 350 },
  { name: "Al-Furqan", startPage: 359 },
  { name: "Ash-Shu'ara", startPage: 367 },
  { name: "An-Naml", startPage: 377 },
  { name: "Al-Qasas", startPage: 385 },
  { name: "Al-Ankabut", startPage: 396 },
  { name: "Ar-Rum", startPage: 404 },
  { name: "Luqman", startPage: 411 },
  { name: "As-Sajdah", startPage: 415 },
  { name: "Al-Ahzab", startPage: 418 },
  { name: "Saba", startPage: 428 },
  { name: "Fatir", startPage: 434 },
  { name: "Ya-Sin", startPage: 440 },
  { name: "As-Saffat", startPage: 446 },
  { name: "Sad", startPage: 453 },
  { name: "Az-Zumar", startPage: 458 },
  { name: "Ghafir", startPage: 467 },
  { name: "Fussilat", startPage: 477 },
  { name: "Ash-Shura", startPage: 483 },
  { name: "Az-Zukhruf", startPage: 489 },
  { name: "Ad-Dukhan", startPage: 496 },
  { name: "Al-Jathiya", startPage: 499 },
  { name: "Al-Ahqaf", startPage: 502 },
  { name: "Muhammad", startPage: 507 },
  { name: "Al-Fath", startPage: 511 },
  { name: "Al-Hujurat", startPage: 515 },
  { name: "Qaf", startPage: 518 },
  { name: "Adh-Dhariyat", startPage: 520 },
  { name: "At-Tur", startPage: 523 },
  { name: "An-Najm", startPage: 526 },
  { name: "Al-Qamar", startPage: 528 },
  { name: "Ar-Rahman", startPage: 531 },
  { name: "Al-Waqi'ah", startPage: 534 },
  { name: "Al-Hadid", startPage: 537 },
  { name: "Al-Mujadila", startPage: 542 },
  { name: "Al-Hashr", startPage: 545 },
  { name: "Al-Mumtahanah", startPage: 549 },
  { name: "As-Saff", startPage: 551 },
  { name: "Al-Jumu'ah", startPage: 553 },
  { name: "Al-Munafiqun", startPage: 554 },
  { name: "At-Taghabun", startPage: 556 },
  { name: "At-Talaq", startPage: 558 },
  { name: "At-Tahrim", startPage: 560 },
  { name: "Al-Mulk", startPage: 562 },
  { name: "Al-Qalam", startPage: 564 },
  { name: "Al-Haqqah", startPage: 566 },
  { name: "Al-Ma'arij", startPage: 568 },
  { name: "Nuh", startPage: 570 },
  { name: "Al-Jinn", startPage: 572 },
  { name: "Al-Muzzammil", startPage: 574 },
  { name: "Al-Muddaththir", startPage: 575 },
  { name: "Al-Qiyamah", startPage: 577 },
  { name: "Al-Insan", startPage: 578 },
  { name: "Al-Mursalat", startPage: 580 },
  { name: "An-Naba", startPage: 582 },
  { name: "An-Nazi'at", startPage: 583 },
  { name: "Abasa", startPage: 585 },
  { name: "At-Takwir", startPage: 586 },
  { name: "Al-Infitar", startPage: 587 },
  { name: "Al-Mutaffifin", startPage: 587 },
  { name: "Al-Inshiqaq", startPage: 589 },
  { name: "Al-Buruj", startPage: 590 },
  { name: "At-Tariq", startPage: 591 },
  { name: "Al-A'la", startPage: 591 },
  { name: "Al-Ghashiyah", startPage: 592 },
  { name: "Al-Fajr", startPage: 593 },
  { name: "Al-Balad", startPage: 594 },
  { name: "Ash-Shams", startPage: 595 },
  { name: "Al-Lail", startPage: 595 },
  { name: "Ad-Duha", startPage: 596 },
  { name: "Ash-Sharh", startPage: 596 },
  { name: "At-Tin", startPage: 597 },
  { name: "Al-Alaq", startPage: 597 },
  { name: "Al-Qadr", startPage: 598 },
  { name: "Al-Bayyinah", startPage: 598 },
  { name: "Az-Zalzalah", startPage: 599 },
  { name: "Al-Adiyat", startPage: 599 },
  { name: "Al-Qari'ah", startPage: 600 },
  { name: "At-Takathur", startPage: 600 },
  { name: "Al-Asr", startPage: 601 },
  { name: "Al-Humazah", startPage: 601 },
  { name: "Al-Fil", startPage: 601 },
  { name: "Quraish", startPage: 602 },
  { name: "Al-Ma'un", startPage: 602 },
  { name: "Al-Kawthar", startPage: 602 },
  { name: "Al-Kafirun", startPage: 603 },
  { name: "An-Nasr", startPage: 603 },
  { name: "Al-Masad", startPage: 603 },
  { name: "Al-Ikhlas", startPage: 604 },
  { name: "Al-Falaq", startPage: 604 },
  { name: "An-Nas", startPage: 604 }
];

function QuranReader({ navigation, themeColors }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [filteredSurahs, setFilteredSurahs] = useState([]);
  const [showSurahList, setShowSurahList] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [currentJuz, setCurrentJuz] = useState(16);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSurah, setCurrentSurah] = useState("");
  const [bookmarkedPage, setBookmarkedPage] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FF9800');
  const [bookmarks, setBookmarks] = useState({});

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

  const sortSurahs = (surahsToSort, currentBookmarks) => {
    return [...surahsToSort].sort((a, b) => {
      const aBookmarked = Object.keys(currentBookmarks).some(page => 
        parseInt(page) >= a.pages[0] && parseInt(page) <= a.pages[a.pages.length - 1]
      );
      const bBookmarked = Object.keys(currentBookmarks).some(page => 
        parseInt(page) >= b.pages[0] && parseInt(page) <= b.pages[b.pages.length - 1]
      );
      
      if (aBookmarked && !bBookmarked) return -1;
      if (!aBookmarked && bBookmarked) return 1;
      return a.id - b.id;
    });
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
    if (selectedSurah) {
      setCurrentPage(selectedSurah.pages[0]); // Assuming the API provides a 'pages' array
    }
  }, [selectedSurah]);

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
    setShowSurahList(!showSurahList);
  };

  const toggleFocusMode = () => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    navigation.setParams({ tabBarVisible: !newFocusMode });
  };

  const handleSurahClick = (surah) => {
    setSelectedSurah(surah);
  };

  const handleGestureEvent = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX > 50) {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
      } else if (nativeEvent.translationX < -50) {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, 604));
      }
    }
  };

  const toggleBookmark = () => {
    if (bookmarks[currentPage]) {
      // If there's already a bookmark, remove it
      const newBookmarks = { ...bookmarks };
      delete newBookmarks[currentPage];
      saveBookmarks(newBookmarks);
    } else {
      // If there's no bookmark, show the color picker
      setShowColorPicker(true);
    }
  };

  const handleColorSelect = (color) => {
    const newBookmarks = { ...bookmarks };
    if (newBookmarks[currentPage] === color) {
      delete newBookmarks[currentPage];
    } else {
      newBookmarks[currentPage] = color;
    }
    saveBookmarks(newBookmarks);
    setShowColorPicker(false);
  };

  const getUsedColors = () => {
    return Object.values(bookmarks) || [];
  };

  const renderBookmarkIcon = () => {
    const bookmarkColor = bookmarks[currentPage];
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
    const isBookmarked = Object.keys(bookmarks).some(page => 
      page >= item.pages[0] && page <= item.pages[item.pages.length - 1]
    );
    const bookmarkColor = isBookmarked ? bookmarks[item.pages[0]] : null;

    return (
      <TouchableOpacity onPress={() => handleSurahClick(item)} style={styles.surahItemContainer}>
        <LinearGradient
          colors={[themeColors.gradientStart, themeColors.gradientEnd]}
          style={styles.surahNumberContainer}
        >
          <Text style={styles.surahNumber}>{item.id}</Text>
        </LinearGradient>
        <View style={styles.surahInfoContainer}>
          <Text style={[styles.surahName, { color: themeColors.textColor }]}>{item.name_simple}</Text>
          <Text style={[styles.surahArabicName, { color: themeColors.textColor }]}>{item.name_arabic}</Text>
          <Text style={[styles.surahDetails, { color: themeColors.secondaryTextColor }]}>
            Page {item.pages[0]} • {item.verses_count} verses • {item.revelation_place}
          </Text>
        </View>
        {isBookmarked && (
          <Ionicons name="bookmark" size={24} color={bookmarkColor} style={styles.bookmarkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const renderQuranPage = () => (
    <View style={[
      styles.pageContainer,
      focusMode && styles.fullScreenPageContainer
    ]}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{currentSurah}</Text>
        <Text style={styles.headerText}>Juz {currentJuz}</Text>
      </View>
      <View style={styles.imageContainer}>
        <Image
          style={styles.pageImage}
          source={quranImages[currentPage] || quranImages[1]}
          resizeMode="contain"
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
        />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B4513" />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
        <View style={styles.content}>
          <View style={styles.quranContent}>
            {!focusMode && (
              <View style={[styles.topBar, { backgroundColor: themeColors.backgroundColor }]}>
                <TouchableOpacity onPress={toggleSurahList} style={styles.iconButtonContainer}>
                  <LinearGradient
                    colors={[themeColors.gradientStart, themeColors.gradientEnd]}
                    style={styles.iconButton}
                  >
                    <Ionicons name={showSurahList ? "menu" : "menu-outline"} size={24} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleFocusMode} style={styles.iconButtonContainer}>
                  <LinearGradient
                    colors={[themeColors.gradientStart, themeColors.gradientEnd]}
                    style={styles.iconButton}
                  >
                    <Ionicons name="expand" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
                {renderBookmarkIcon()}
              </View>
            )}
            <PanGestureHandler
              onHandlerStateChange={handleGestureEvent}
              activeOffsetX={[-20, 20]}
            >
              <View style={[styles.pageContainer, focusMode && styles.fullScreenContainer]}>
                {renderQuranPage()}
                <View style={styles.pageNumberContainer}>
                  <Text style={styles.pageNumberText}>{currentPage}</Text>
                </View>
              </View>
            </PanGestureHandler>
            {focusMode && (
              <TouchableOpacity 
                onPress={toggleFocusMode} 
                style={styles.exitFullScreenButton}
              >
                <LinearGradient
                  colors={[themeColors.gradientStart, themeColors.gradientEnd]}
                  style={styles.exitFullScreenGradient}
                >
                  <Ionicons name="contract" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          {!focusMode && showSurahList && (
            <BlurView
              intensity={120}
              tint={themeColors.isDark ? 'dark' : 'light'}
              style={styles.surahListContainer}
            >
              <View style={[styles.surahList, { backgroundColor: themeColors.backgroundColor + '80' }]}>
                <View style={styles.surahListHeader}>
                  <Text style={[styles.heading, { color: themeColors.textColor }]}>Contents</Text>
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
    backgroundColor: '#F8F9FB',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  fullScreenPageContainer: {
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageImage: {
    width: width - 32,
    height: height - 180,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 241, 227, 0.7)',
  },
  pageNumberContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberText: {
    fontSize: 13,
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
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default QuranReader;

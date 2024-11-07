import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Dimensions, StatusBar, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialDuaCategories } from '../data/duasData';
import MyDuas from './MyDuas';

// Add this function at the top of your file, outside of the Duas component
const isColorDark = (color) => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return true if the color is dark
  return brightness < 128;
};


const Duas = ({ route, navigation }) => {
  const { themeColors, language, isDarkMode } = route.params || {};

  const [duaCategories, setDuaCategories] = useState(initialDuaCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [activeTab, setActiveTab] = useState('categories');
  const [myDuas, setMyDuas] = useState([]);
  const [collections, setCollections] = useState([]);
  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    loadDuaCategories();
    loadMyDuas();
    loadCollections();
    loadFavorites();
  }, []);


  useEffect(() => {
    if (searchQuery) {
      const filtered = duaCategories.flatMap(category => {
        const matchingSubcategories = category.subcategories.filter(subcategory =>
          subcategory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subcategory.titleAr.includes(searchQuery) ||
          subcategory.arabic.includes(searchQuery) ||
          subcategory.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subcategory.translation.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return matchingSubcategories.map(subcategory => ({
          ...subcategory,
          parentCategory: category
        }));
      });
      setFilteredItems(filtered);
    } else {
      setFilteredItems(duaCategories.map(category => ({ ...category, isMainCategory: true })));
    }
  }, [searchQuery, duaCategories]);

  const loadDuaCategories = async () => {
    try {
      const storedCategories = await AsyncStorage.getItem('duaCategories');
      if (storedCategories !== null) {
        const parsedCategories = JSON.parse(storedCategories);
        // Check if stored categories have the same length as initialDuaCategories
        if (parsedCategories.length === initialDuaCategories.length) {
          setDuaCategories(parsedCategories);
        } else {
          // If lengths don't match, use initialDuaCategories and update AsyncStorage
          setDuaCategories(initialDuaCategories);
          await AsyncStorage.setItem('duaCategories', JSON.stringify(initialDuaCategories));
        }
      } else {
        // If no stored categories, use initialDuaCategories and save to AsyncStorage
        setDuaCategories(initialDuaCategories);
        await AsyncStorage.setItem('duaCategories', JSON.stringify(initialDuaCategories));
      }
    } catch (error) {
      console.error('Error loading dua categories:', error);
      // Fallback to initialDuaCategories if there's an error
      setDuaCategories(initialDuaCategories);
    }
  };

  const loadMyDuas = async () => {
    try {
      const storedMyDuas = await AsyncStorage.getItem('myDuas');
      if (storedMyDuas !== null) {
        setMyDuas(JSON.parse(storedMyDuas));
      }
    } catch (error) {
      console.error('Error loading my duas:', error);
    }
  };

  const loadCollections = async () => {
    try {
      const storedCollections = await AsyncStorage.getItem('duaCollections');
      if (storedCollections !== null) {
        setCollections(JSON.parse(storedCollections));
      }
    } catch (error) {
      console.error('Error loading dua collections:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites !== null) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveDuaCategories = async (categories) => {
    try {
      await AsyncStorage.setItem('duaCategories', JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving dua categories:', error);
    }
  };

  const saveMyDuas = async (updatedMyDuas) => {
    try {
      await AsyncStorage.setItem('myDuas', JSON.stringify(updatedMyDuas));
      setMyDuas(updatedMyDuas);
    } catch (error) {
      console.error('Error saving my duas:', error);
    }
  };

  const saveCollections = async (updatedCollections) => {
    try {
      await AsyncStorage.setItem('duaCollections', JSON.stringify(updatedCollections));
      setCollections(updatedCollections);
    } catch (error) {
      console.error('Error saving dua collections:', error);
    }
  };

  const saveFavorites = async (updatedFavorites) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const toggleFavorite = useCallback((dua) => {
    console.log('Toggling favorite for dua:', dua.id);
    const updatedFavorites = { ...favorites, [dua.id]: !favorites[dua.id] };
    console.log('Updated favorites:', updatedFavorites);
    saveFavorites(updatedFavorites);

    let updatedMyDuas;
    if (updatedFavorites[dua.id]) {
      if (!myDuas.some(d => d.id === dua.id)) {
        updatedMyDuas = [...myDuas, { ...dua, isFavorite: true }];
      } else {
        updatedMyDuas = myDuas.map(d => d.id === dua.id ? { ...d, isFavorite: true } : d);
      }
    } else {
      updatedMyDuas = myDuas.filter(d => d.id !== dua.id);
    }
    console.log('Updated myDuas:', updatedMyDuas);
    saveMyDuas(updatedMyDuas);

    setFavorites(updatedFavorites);
    setMyDuas(updatedMyDuas);
  }, [favorites, myDuas, saveFavorites, saveMyDuas]);

  const addNote = useCallback((duaId, note) => {
    console.log('Adding note for dua:', duaId, 'Note:', note);
    let updatedMyDuas;
    if (myDuas.some(dua => dua.id === duaId)) {
      updatedMyDuas = myDuas.map(dua => 
        dua.id === duaId ? { ...dua, note, isFavorite: true } : dua
      );
    } else {
      const duaToAdd = duaCategories.flatMap(cat => cat.subcategories).find(d => d.id === duaId);
      updatedMyDuas = [...myDuas, { ...duaToAdd, note, isFavorite: true }];
    }
    saveMyDuas(updatedMyDuas);
    setActiveTab('myDuas');
  }, [myDuas, duaCategories, saveMyDuas, setActiveTab]);

  const addToCollection = useCallback((dua) => {
    console.log('Adding dua to collection:', dua.id);
    if (!myDuas.some(d => d.id === dua.id)) {
      const updatedMyDuas = [...myDuas, { ...dua, isFavorite: true }];
      saveMyDuas(updatedMyDuas);
    }
    setActiveTab('myDuas');
  }, [myDuas, saveMyDuas, setActiveTab]);

  const addDuaToCollection = (duaId, collectionId) => {
    console.log('Adding dua to collection:', duaId, 'Collection:', collectionId);
    const updatedCollections = collections.map(collection => 
      collection.id === collectionId
        ? { ...collection, duas: [...collection.duas, duaId] }
        : collection
    );
    saveCollections(updatedCollections);
  };

  // Add translations
  const translations = {
    duas: { en: 'Duas', ar: 'الأدعية' },
    categories: { en: 'Categories', ar: 'الفئات' },
    myDuas: { en: 'My Duas', ar: 'أدعيتي' },
    search: { en: 'Search', ar: 'بحث' },
    chapters: { en: 'Chapters', ar: 'فصول' },
  };

  const getTranslatedText = (key) => {
    return translations[key][language] || key;
  };

  const getCategoryImage = (categoryId) => {
    const images = {
      1: require('../assets/ablution.png'),
      2: require('../assets/clothe.png'),
      3: require('../assets/Home.png'),
      4: require('../assets/Food.png'),
      5: require('../assets/travel.png'),
      6: require('../assets/morning and evening.png'),
      7: require('../assets/sleep.png'),
      // The Miscellaneous category won't have an image
    };
    return images[categoryId] || null;
  };

  const renderItem = ({ item, index }) => {
    if (item.isMainCategory) {
      return renderCategoryItem({ item, index });
    } else {
      return renderSubcategoryItem({ item, index });
    }
  };

  const renderCategoryItem = ({ item, index }) => {
    const backgroundColor = getCategoryColor(index);
    const textColor = isColorDark(backgroundColor) ? '#FFFFFF' : '#000000';

    const matchingSubcategories = item.subcategories.filter(subcategory =>
      subcategory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subcategory.titleAr.includes(searchQuery) ||
      subcategory.arabic.includes(searchQuery) ||
      subcategory.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subcategory.translation.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categoryImage = getCategoryImage(item.id);

    return (
      <TouchableOpacity
        key={`category-${item.id}`}
        style={[
          styles.categoryItem,
          { backgroundColor }
        ]}
        onPress={() => navigation.navigate('DuaList', { 
          category: item, 
          isDarkMode, 
          themeColors, 
          language,
          initialFilteredSubcategories: matchingSubcategories,
          searchQuery
        })}
      >
        <View style={styles.categoryContent}>
          <View style={styles.categoryTextContainer}>
            <Text style={[styles.categoryTitle, { color: textColor }]} numberOfLines={2} ellipsizeMode="tail">
              {language === 'ar' ? item.titleAr : item.title}
            </Text>
            <Text style={[styles.categoryCount, { color: textColor }]}>
              {searchQuery ? matchingSubcategories.length : item.subcategories.length} {getTranslatedText('chapters')}
            </Text>
          </View>
          {categoryImage && (
            <Image
              source={categoryImage}
              style={styles.categoryImage}
              resizeMode="contain"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSubcategoryItem = useCallback(({ item, index }) => {
    return (
      <TouchableOpacity
        key={`subcategory-${item.id}`}
        style={[
          styles.subcategoryItem,
          { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF' }
        ]}
        onPress={() => {
          console.log('Navigating to DuaDetails with item:', item);
          navigation.navigate('DuaDetails', { 
            dua: item, 
            category: item.parentCategory, 
            index: item.parentCategory.subcategories.indexOf(item),
            isDarkMode, 
            themeColors, 
            language,
            onToggleFavorite: (dua) => toggleFavorite(dua),
            onAddNote: (duaId, note) => addNote(duaId, note),
            onAddToCollection: (dua) => addToCollection(dua),
            isFavorite: favorites[item.id] || false
          });
        }}
      >
        <Text style={[styles.subcategoryTitle, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
          {language === 'ar' ? item.titleAr : item.title}
        </Text>
        <Text style={[styles.parentCategoryTitle, { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : themeColors.secondaryTextColor }]}>
          {language === 'ar' ? item.parentCategory.titleAr : item.parentCategory.title}
        </Text>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
        >
          <Ionicons 
            name={favorites[item.id] ? "star" : "star-outline"} 
            size={24} 
            color={favorites[item.id] ? "#FFD700" : (isDarkMode ? '#FFFFFF' : themeColors.textColor)} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [isDarkMode, themeColors, language, favorites, toggleFavorite, addNote, addToCollection, navigation]);

  const getCategoryColor = (index) => {
    const colors = [
      '#FFFFFF', '#34495E', '#AED6F1', '#A2D9CE', 
      '#F9E79F', '#EDBB99', '#D7BDE2', '#F2F3F4'
    ];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1E1E1E' : themeColors.backgroundColor }]}>
      <StatusBar />
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1E1E1E' : themeColors.backgroundColor }]}>
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
            {getTranslatedText('duas')}
          </Text>
        </View>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'categories' && styles.activeTab]}
            onPress={() => setActiveTab('categories')}
          >
            <Text style={[styles.tabButtonText, { color: activeTab === 'categories' ? themeColors.accent : (isDarkMode ? '#BBBBBB' : '#689F38') }]}>
              {getTranslatedText('categories')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'myDuas' && styles.activeTab]}
            onPress={() => setActiveTab('myDuas')}
          >
            <Text style={[styles.tabButtonText, { color: activeTab === 'myDuas' ? themeColors.accent : (isDarkMode ? '#BBBBBB' : '#689F38') }]}>
              {getTranslatedText('myDuas')}
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'categories' ? (
          <>
            <View style={[
              styles.searchBar,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            ]}>
              <Ionicons name="search" size={20} color={isDarkMode ? '#FFFFFF' : themeColors.secondaryTextColor} />
              <TextInput
                style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}
                placeholder={getTranslatedText('search')}
                placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : themeColors.secondaryTextColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <FlatList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.isMainCategory ? `category-${item.id}` : `subcategory-${item.id}`}  // Modify this line
              numColumns={searchQuery ? 1 : 2}
              key={searchQuery ? 'list' : 'grid'}
              columnWrapperStyle={searchQuery ? null : styles.columnWrapper}
              contentContainerStyle={styles.listContainer}
            />
          </>
        ) : (
          <MyDuas 
            navigation={navigation}
            isDarkMode={isDarkMode}
            themeColors={themeColors}
            language={language}
            myDuas={myDuas}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onAddNote={addNote}
            onAddToCollection={addToCollection}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const itemWidth = (width - 40) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 10,
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    marginBottom: 15,
    marginTop: -25,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    padding: 5,
    paddingLeft: 10,
    paddingRight: 10,
    width: '97%', // Reduce the width to make it shorter
    alignSelf: 'center', // Center the search bar

    marginBottom: 15,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    paddingVertical: 5,
  },
  listContainer: {
    paddingBottom: 20,
    paddingLeft: 5,
    paddingRight: 5,  
    paddingTop: 5,
    
    
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: itemWidth,
    height: itemWidth * 0.8,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  categoryTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
    paddingRight: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  categoryCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  categoryImage: {
    width: '35%',
    height: '75%',
  },
  subcategoryItem: {
    
    width: '100%',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  subcategoryTitle: {
    
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  parentCategoryTitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});


export default Duas;
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDua } from '../contexts/DuaContext';

const MyDuas = ({ navigation, isDarkMode, themeColors, language }) => {
  const { myDuas, favorites, notes, onToggleFavorite } = useDua();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDuas, setFilteredDuas] = useState([]);

  useEffect(() => {
    if (myDuas && myDuas.length > 0) {
      const filtered = myDuas.filter(dua => {
        const title = dua.title?.toLowerCase() || '';
        const titleAr = dua.titleAr || '';
        const arabic = dua.arabic || '';
        const transliteration = dua.transliteration?.toLowerCase() || '';
        const translation = dua.translation?.toLowerCase() || '';
        const duaNote = notes[dua.id]?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();

        return (
          title.includes(query) ||
          titleAr.includes(searchQuery) ||
          arabic.includes(searchQuery) ||
          transliteration.includes(query) ||
          translation.includes(query) ||
          duaNote.includes(query)
        );
      });
      setFilteredDuas(filtered);
    } else {
      setFilteredDuas([]);
    }
  }, [searchQuery, myDuas, notes]);

  const renderDuaItem = ({ item, index }) => {
    if (!item || !item.id) return null;

    const duaNote = notes[item.id] || item.note;
    const title = language === 'ar' ? (item.titleAr || '') : (item.title || '');
    const parentCategory = item.parentCategory ? 
      (language === 'ar' ? item.parentCategory.titleAr : item.parentCategory.title) : '';

    return (
      <TouchableOpacity
        style={[
          styles.duaItem,
          { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF' }
        ]}
        onPress={() => navigation.navigate('DuaDetails', { 
          dua: item, 
          category: null,
          index: index,
          isDarkMode, 
          themeColors, 
          language,
          isFavorite: favorites[item.id] || false
        })}
      >
        <View style={styles.duaItemContent}>
          <View style={styles.duaTitleContainer}>
            <Text style={[styles.duaTitle, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
              {title}
            </Text>
            {parentCategory && (
              <Text style={[styles.parentCategory, { color: isDarkMode ? '#BBBBBB' : themeColors.secondaryTextColor }]}>
                {parentCategory}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => onToggleFavorite(item)}>
            <Ionicons 
              name={favorites[item.id] ? "star" : "star-outline"} 
              size={24} 
              color={favorites[item.id] ? "#FFD700" : (isDarkMode ? '#FFFFFF' : themeColors.textColor)} 
            />
          </TouchableOpacity>
        </View>
        {duaNote && (
          <Text style={[styles.duaNote, { color: isDarkMode ? '#BBBBBB' : themeColors.secondaryTextColor }]}>
            Note: {duaNote}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
            color: isDarkMode ? '#FFFFFF' : themeColors.textColor,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5',
          }]}
          placeholder="Search My Duas"
          placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : themeColors.secondaryTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredDuas}
        renderItem={renderDuaItem}
        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
            No duas added yet. Add duas by favoriting them!
          </Text>
        }
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 10,
  },
  searchInput: {
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
  duaItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  duaItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duaTitleContainer: {
    flex: 1,
  },
  duaTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  parentCategory: {
    fontSize: 14,
    marginTop: 5,
  },
  duaNote: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default MyDuas;

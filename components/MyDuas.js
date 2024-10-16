import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MyDuas = ({ 
  navigation, 
  isDarkMode, 
  themeColors, 
  language, 
  myDuas, 
  favorites, 
  onToggleFavorite, 
  onAddNote, 
  onAddToCollection 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDuas, setFilteredDuas] = useState([]);

  useEffect(() => {
    if (myDuas && myDuas.length > 0) {
      const filtered = myDuas.filter(dua => 
        dua.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dua.titleAr.includes(searchQuery) ||
        dua.arabic.includes(searchQuery) ||
        dua.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dua.translation.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDuas(filtered);
    } else {
      setFilteredDuas([]);
    }
  }, [searchQuery, myDuas]);

  const renderDuaItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.duaItem,
        { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF' }
      ]}
      onPress={() => navigation.navigate('DuaDetails', { 
        dua: item, 
        category: { title: 'My Duas', titleAr: 'أدعيتي' },
        index: myDuas.indexOf(item),
        isDarkMode, 
        themeColors, 
        language,
        onToggleFavorite: (dua) => onToggleFavorite(dua),
        onAddNote: (duaId, note) => onAddNote(duaId, note),
        onAddToCollection: (dua) => onAddToCollection(dua),
        isFavorite: favorites[item.id] || false
      })}
    >
      <View style={styles.duaItemContent}>
        <View style={styles.duaTitleContainer}>
          <Text style={[styles.duaTitle, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
            {language === 'ar' ? item.titleAr : item.title}
          </Text>
          {item.parentCategory && (
            <Text style={[styles.parentCategory, { color: isDarkMode ? '#BBBBBB' : themeColors.secondaryTextColor }]}>
              {language === 'ar' ? item.parentCategory.titleAr : item.parentCategory.title}
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
      {item.note && (
        <Text style={[styles.duaNote, { color: isDarkMode ? '#BBBBBB' : themeColors.secondaryTextColor }]}>
          Note: {item.note}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
            No duas added yet. Add duas by favoriting them!
          </Text>
        }
      />
    </View>
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

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DuaList = ({ route, navigation }) => {
  const { category, isDarkMode, themeColors, language, initialFilteredSubcategories, searchQuery } = route.params;

  const [filteredSubcategories, setFilteredSubcategories] = useState(initialFilteredSubcategories || category.subcategories);

  useEffect(() => {
    if (searchQuery) {
      const filtered = category.subcategories.filter(subcategory =>
        subcategory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subcategory.titleAr.includes(searchQuery) ||
        subcategory.arabic.includes(searchQuery) ||
        subcategory.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subcategory.translation.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSubcategories(filtered);
    } else {
      setFilteredSubcategories(category.subcategories);
    }
  }, [searchQuery, category]);

  const renderDuaItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.duaListItem,
        { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : themeColors.inputBackground }
      ]}
      onPress={() => navigation.navigate('DuaDetails', { dua: item, category: category, index: index, isDarkMode, themeColors, language })}
    >
      <View style={[
        styles.duaListItemNumber,
        { backgroundColor: themeColors.accent + '20' }
      ]}>
        <Text style={[
          styles.duaListItemNumberText,
          { color: themeColors.accent }
        ]}>
          {index + 1}
        </Text>
      </View>
      <Text style={[
        styles.duaListItemTitle,
        { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }
      ]}>
        {language === 'ar' ? item.titleAr : item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1E1E1E' : themeColors.backgroundColor }]}>
      <StatusBar />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFFFFF' : themeColors.textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: isDarkMode ? '#FFFFFF' : themeColors.textColor }]}>
            {language === 'ar' ? category.titleAr : category.title}
          </Text>
        </View>
        <FlatList
          data={filteredSubcategories}
          renderItem={renderDuaItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: StatusBar.currentHeight || 0, // Add padding for status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  duaListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  duaListItemNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  duaListItemNumberText: {
    fontWeight: 'bold',
  },
  duaListItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DuaList;
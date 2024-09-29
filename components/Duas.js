import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ImageBackground, TextInput, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialDuaCategories } from './duasData';

const Duas = ({ route, navigation }) => {
  const { themeColors, language } = route.params || {};

  const [duaCategories, setDuaCategories] = useState(initialDuaCategories);
  const [activeTab, setActiveTab] = useState('All Duas');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(duaCategories);

  useEffect(() => {
    loadDuaCategories();
  }, []);

  useEffect(() => {
    const filtered = duaCategories.filter(category =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [searchQuery, duaCategories]);

  const loadDuaCategories = async () => {
    try {
      const storedCategories = await AsyncStorage.getItem('duaCategories');
      if (storedCategories !== null) {
        setDuaCategories(JSON.parse(storedCategories));
      }
    } catch (error) {
      console.error('Error loading dua categories:', error);
    }
  };

  const saveDuaCategories = async (categories) => {
    try {
      await AsyncStorage.setItem('duaCategories', JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving dua categories:', error);
    }
  };

  const addCategory = (newCategory) => {
    const updatedCategories = [...duaCategories, newCategory];
    setDuaCategories(updatedCategories);
    saveDuaCategories(updatedCategories);
  };

  const addSubcategory = (categoryId, newSubcategory) => {
    const updatedCategories = duaCategories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subcategories: [...category.subcategories, newSubcategory]
        };
      }
      return category;
    });
    setDuaCategories(updatedCategories);
    saveDuaCategories(updatedCategories);
  };

  const updateSubcategory = (categoryId, subcategoryId, updatedSubcategory) => {
    const updatedCategories = duaCategories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subcategories: category.subcategories.map(subcategory => 
            subcategory.id === subcategoryId ? updatedSubcategory : subcategory
          )
        };
      }
      return category;
    });
    setDuaCategories(updatedCategories);
    saveDuaCategories(updatedCategories);
  };

  const handleOptionsPress = (item) => {
    Alert.alert(
      "Options",
      "Choose an action",
      [
        { 
          text: "Share", 
          onPress: () => handleShare(item),
          style: "default"
        },
        { 
          text: "Edit", 
          onPress: () => handleEdit(item),
          style: "default"
        },
        { 
          text: "Delete", 
          onPress: () => handleDelete(item),
          style: "destructive"
        },
        { 
          text: "Cancel", 
          style: "cancel"
        }
      ],
      {
        cancelable: true,
        containerStyle: { 
          backgroundColor: themeColors.backgroundColor,
          borderRadius: 0,
          padding: 10,
        },
        contentStyle: { 
          color: themeColors.textColor,
          fontSize: 16,
        },
        titleStyle: {
          color: themeColors.accent,
          fontSize: 20,
          fontWeight: 'bold',
        },
        buttonStyle: {
          backgroundColor: themeColors.accent,
          borderRadius: 0,
          marginVertical: 5,
        },
        textStyle: {
          color: '#FFFFFF',
          textAlign: 'center',
          padding: 10,
        },
      }
    );
  };

  const handleShare = async (item) => {
    try {
      const result = await Share.share({
        message: `Check out this dua: ${item.title}\n\n${item.arabic}\n\n${item.translation}`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('shared with activity type of', result.activityType);
        } else {
          console.log('shared');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('dismissed');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEdit = (item) => {
    // Navigate to an edit screen or show an edit modal
    navigation.navigate('EditDua', { dua: item });
  };

  const handleDelete = (item) => {
    Alert.alert(
      "Delete Dua",
      "Are you sure you want to delete this dua?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => {
            const updatedCategories = duaCategories.map(category => ({
              ...category,
              subcategories: category.subcategories.filter(dua => dua.id !== item.id)
            }));
            setDuaCategories(updatedCategories);
            saveDuaCategories(updatedCategories);
            navigation.goBack();
          },
          style: "destructive"
        }
      ],
      {
        cancelable: true,
        containerStyle: { 
          backgroundColor: themeColors.backgroundColor,
          borderRadius: 0,
          padding: 10,
        },
        contentStyle: { 
          color: themeColors.textColor,
          fontSize: 16,
        },
        titleStyle: {
          color: themeColors.accent,
          fontSize: 20,
          fontWeight: 'bold',
        },
        buttonStyle: {
          backgroundColor: themeColors.accent,
          borderRadius: 0,
          marginVertical: 5,
        },
        textStyle: {
          color: themeColors.textColor,
          textAlign: 'center',
          padding: 10,
        },
      }
    );
  };

  const renderHomePage = () => (
    <ImageBackground 
      source={require('../assets/dome-icon.png')} 
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      <ImageBackground
        source={require('../assets/Overlay.png')}
        style={styles.overlayImage}
        imageStyle={styles.overlayImageStyle}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <View style={styles.header}>
            <Text style={[styles.headerText, { color: themeColors.textColor }]}>Dua</Text>
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={themeColors.secondaryTextColor} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.textColor }]}
              placeholder="Search duas"
              placeholderTextColor={themeColors.secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Text style={[styles.sectionTitle, { color: themeColors.textColor }]}>All Duas</Text>
          <FlatList
            data={filteredCategories}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryItem, { backgroundColor: themeColors.inputBackground }]}
                onPress={() => navigation.navigate('DuaList', { category: item })}
              >
                <View>
                  <Text style={[styles.categoryTitle, { color: themeColors.textColor }]}>{item.title}</Text>
                  <Text style={[styles.categoryCount, { color: themeColors.secondaryTextColor }]}>
                    {item.subcategories.length} sub-categories
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={themeColors.secondaryTextColor} />
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
          />
        </SafeAreaView>
      </ImageBackground>
    </ImageBackground>
  );

  const renderDuaListPage = () => {
    const { category } = route.params;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={themeColors.textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerText, { color: themeColors.textColor }]}>{category.title}</Text>
          </View>
          <TouchableOpacity onPress={() => handleOptionsPress(category)}>
            <Ionicons name="ellipsis-vertical" size={24} color={themeColors.textColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.tabBar}>
          <TouchableOpacity onPress={() => setActiveTab('All Duas')} style={styles.tabButton}>
            <Text style={[styles.tabButtonText, { color: activeTab === 'All Duas' ? themeColors.accent : themeColors.secondaryTextColor }]}>All Duas</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('My Favorites')} style={styles.tabButton}>
            <Text style={[styles.tabButtonText, { color: activeTab === 'My Favorites' ? themeColors.accent : themeColors.secondaryTextColor }]}>My Favorites</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={category.subcategories}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.duaListItem, { backgroundColor: themeColors.inputBackground }]}
              onPress={() => navigation.navigate('DuaDetails', { dua: item, category: category, index: index })}
            >
              <View style={[styles.duaListItemNumber, { backgroundColor: themeColors.accent + '20' }]}>
                <Text style={[styles.duaListItemNumberText, { color: themeColors.accent }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.duaListItemTitle, { color: themeColors.textColor }]}>{item.title}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
        />
      </SafeAreaView>
    );
  };

  const renderDuaDetailsPage = () => {
    const { dua, category, index } = route.params;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={themeColors.textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerText, { color: themeColors.textColor }]}>{category.title}</Text>
          </View>
          <TouchableOpacity onPress={() => handleOptionsPress(dua)}>
            <Ionicons name="ellipsis-vertical" size={24} color={themeColors.textColor} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.duaDetailsContent}>
          <Text style={[styles.duaDetailsProgress, { color: themeColors.accent }]}>{index + 1}/{category.subcategories.length}</Text>
          <Text style={[styles.duaDetailsTitle, { color: themeColors.textColor }]}>{dua.title}</Text>
          <Text style={[styles.arabicText, { color: themeColors.textColor }]}>
            {dua.arabic}
          </Text>
          <Text style={[styles.transliterationText, { color: themeColors.secondaryTextColor }]}>
            {dua.transliteration}
          </Text>
          <Text style={[styles.translationText, { color: themeColors.textColor }]}>
            {dua.translation}
          </Text>
          <View style={[styles.referenceContainer, { backgroundColor: themeColors.accent + '20' }]}>
            <Text style={[styles.referenceTitle, { color: themeColors.accent }]}>Reference</Text>
            <Text style={[styles.referenceText, { color: themeColors.secondaryTextColor }]}>
              {dua.reference}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  if (!themeColors) {
    console.error('themeColors is undefined in Duas component');
    return null;
  }

  switch (route.name) {
    case 'Home':
      return renderHomePage();
    case 'DuaList':
      return renderDuaListPage();
    case 'DuaDetails':
      return renderDuaDetailsPage();
    default:
      return renderHomePage();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    height: '50%',
    width: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.9,
    height: '40%',
  },
  overlayImage: {
    flex: 3,
  },
  overlayImageStyle: {
    resizeMode: 'stretch',
    height: '50%',
    width: '100%',
    flex: 1,
    position: 'absolute',
    top: 0,
    bottom: 5,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
    paddingTop: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingTop: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  categoryCount: {
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  duaDetailsContent: {
    flex: 1,
  },
  duaDetailsProgress: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  duaDetailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  arabicText: {
    fontSize: 26,
    textAlign: 'right',
    marginBottom: 20,
    lineHeight: 40,
    fontFamily: 'Scheherazade',
  },
  transliterationText: {
    fontSize: 18,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  translationText: {
    fontSize: 18,
    marginBottom: 20,
    lineHeight: 26,
  },
  referenceContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  referenceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  referenceText: {
    fontSize: 16,
    marginBottom: 10,
  },
  referenceSource: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default Duas;
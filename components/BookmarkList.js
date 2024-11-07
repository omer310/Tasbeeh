import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const BookmarkList = ({ 
  bookmarks, 
  onBookmarkPress, 
  themeColors, 
  onClose,
  surahs 
}) => {
  // Group bookmarks by label
  const groupedBookmarks = Object.entries(bookmarks).reduce((acc, [page, data]) => {
    const label = data.label || 'Unlabeled';
    if (!acc[label]) acc[label] = [];
    acc[label].push({ page: parseInt(page), ...data });
    return acc;
  }, {});

  // Find surah name for a page
  const getSurahName = (page) => {
    const surah = surahs.find(s => 
      page >= s.pages[0] && page <= s.pages[s.pages.length - 1]
    );
    return surah ? surah.name_simple : '';
  };

  return (
    <BlurView
      intensity={120}
      tint={themeColors.isDark ? 'dark' : 'light'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
        <View style={[styles.content, { backgroundColor: themeColors.backgroundColor + '80' }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.textColor }]}>Bookmarks</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bookmarkGroups}>
            {Object.entries(groupedBookmarks).map(([label, bookmarks]) => (
              <View key={label} style={styles.group}>
                <Text style={[styles.groupLabel, { color: themeColors.textColor }]}>
                  {label}
                </Text>
                {bookmarks.map((bookmark) => (
                  <TouchableOpacity
                    key={bookmark.page}
                    style={styles.bookmarkItem}
                    onPress={() => onBookmarkPress(bookmark.page)}
                  >
                    <View style={[styles.colorIndicator, { backgroundColor: bookmark.color }]} />
                    <View style={styles.bookmarkInfo}>
                      <Text style={[styles.surahName, { color: themeColors.textColor }]}>
                        {getSurahName(bookmark.page)}
                      </Text>
                      <Text style={[styles.pageNumber, { color: themeColors.secondaryTextColor }]}>
                        Page {bookmark.page}
                      </Text>
                    </View>
                    <Text style={[styles.timestamp, { color: themeColors.secondaryTextColor }]}>
                      {new Date(bookmark.lastVisited).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 85,
    right: 0,
    width: '85%',
    height: '87%',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
    zIndex: 1000,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  bookmarkGroups: {
    flex: 1,
  },
  group: {
    marginBottom: 20,
  },
  groupLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 8,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  bookmarkInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 16,
    fontWeight: '500',
  },
  pageNumber: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
  },
});

export default BookmarkList; 
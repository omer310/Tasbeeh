import React, { memo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const EnglishTranslation = memo(function EnglishTranslation({ verses, themeColors, isLoading }) {
  if (isLoading) {
    return (
      <Text style={[styles.loadingText, { color: themeColors.textColor }]}>
        Loading translation...
      </Text>
    );
  }

  if (!verses || verses.length === 0) {
    return (
      <Text style={[styles.loadingText, { color: themeColors.textColor }]}>
        No translation available for this page.
      </Text>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.isDark ? themeColors.backgroundColor : 'white' }]}
      contentContainerStyle={styles.contentContainer}
    >
      {verses.map((verse, index) => (
        <View 
          key={index} 
          style={[
            styles.verseContainer,
            { backgroundColor: themeColors.isDark ? themeColors.backgroundColor : 'white' }
          ]}
        >
          <View style={[
            styles.verseNumberContainer,
            { backgroundColor: themeColors.gradientStart }
          ]}>
            <Text style={styles.verseNumber}>
              {verse.verseNumber}
            </Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.verseText, { color: themeColors.textColor }]}>
              {verse.text}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width - 32,
  },
  contentContainer: {
    paddingVertical: 20,
  },
  verseContainer: {
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  verseNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '400',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
});

export default EnglishTranslation; 
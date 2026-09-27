import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { riwayahFor, verseWords } from '../utils/quranReaderText';

function QuranWordChoices({ verse, reciter, range, onSelectWord, theme: t }) {
  return <ScrollView nestedScrollEnabled style={styles.scroll} contentContainerStyle={styles.words}>
    {verseWords(verse).map(word => {
      const selected = range?.from === word.from && range?.to === word.to;
      return <Pressable key={`${verse.key}:${word.from}`} accessibilityRole="button" accessibilityLabel={word.text} accessibilityState={{ selected }}
        onPress={() => onSelectWord(verse.key, word)} pressRetentionOffset={0}
        style={({ pressed }) => [styles.word, { borderColor: selected ? t.activeTabColor : 'transparent', backgroundColor: pressed || selected ? t.inputBackground : 'transparent' }]}>
        <Text selectable={false} style={[styles.text, { fontFamily: riwayahFor(reciter) === 'duri' ? 'QuranDuri' : 'Amiri', color: t.textColor }]}>{word.text}</Text>
      </Pressable>;
    })}
  </ScrollView>;
}
export default memo(QuranWordChoices);
const styles = StyleSheet.create({
  scroll: { maxHeight: 210 },
  words: { direction: 'ltr', flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 4 },
  word: { minWidth: 44, minHeight: 52, maxWidth: '100%', paddingHorizontal: 6, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 28, lineHeight: 52 },
});

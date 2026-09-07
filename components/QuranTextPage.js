import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { getQuranPage } from '../utils/quranData';
const arabicNumber = number => String(number).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
export default function QuranTextPage({ page, mode, fontSize, translation, themeColors: t }) {
  const verses = getQuranPage(page);
  const groups = verses.reduce((result, verse) => {
    if (result[result.length - 1]?.chapter !== verse.chapter) result.push({ chapter: verse.chapter, name: verse.chapterName, verses: [] });
    result[result.length - 1].verses.push(verse); return result;
  }, []);
  const arabic = { color: t.textColor, fontFamily: 'Amiri', fontSize, lineHeight: fontSize * 2.05, textAlign: 'right', writingDirection: 'rtl' };
  return <ScrollView key={`${page}-${mode}`} style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 30 }}>
    <View style={[styles.header, { borderColor: t.separatorColor }]}><Text style={{ color: t.secondaryTextColor }}>Page {page}</Text><Text style={{ color: t.secondaryTextColor }}>Juz {verses[0]?.juz}</Text></View>
    {groups.map(group => <View key={group.chapter}>
      <Text style={[styles.surah, { color: t.activeTabColor }]}>{group.name}</Text>
      {mode === 'flow' ? <Text selectable style={arabic}>{group.verses.map(verse => `${verse.text} ۝${arabicNumber(verse.id)}`).join(' ')}</Text> : group.verses.map(verse => <View key={verse.key} style={[styles.ayah, { backgroundColor: t.inputBackground }]}>
        <Text style={{ color: t.activeTabColor, fontSize: 12, fontWeight: '600' }}>{verse.key}</Text>
        <Text selectable style={arabic}>{verse.text} <Text style={{ color: t.activeTabColor }}>۝{arabicNumber(verse.id)}</Text></Text>
        {translation && <Text selectable style={{ color: t.textColor, lineHeight: 27, fontSize: 17, marginTop: 12 }}>{verse.translation}</Text>}
      </View>)}
    </View>)}
    <Text style={{ color: t.secondaryTextColor, fontSize: 11, lineHeight: 18, marginTop: 24 }}>Arabic: The Noble Qur’an Encyclopedia. {mode === 'verses' && translation ? 'English: Saheeh International. ' : ''}Text via Quran JSON by Risan Bagja Pradana · CC BY-SA 4.0. Page references: Al Quran Cloud.</Text>
    <Text accessibilityRole="link" onPress={() => Linking.openURL('https://github.com/risan/quran-json')} style={{ color: t.activeTabColor, paddingVertical: 10, fontSize: 12 }}>Sources and license</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({ header: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1 }, surah: { fontFamily: 'Amiri', textAlign: 'center', fontSize: 26, marginVertical: 14 }, ayah: { borderRadius: 16, padding: 16, marginBottom: 14 } });

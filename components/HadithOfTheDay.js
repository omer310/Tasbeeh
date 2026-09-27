import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Keyboard, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader, OptionSheet, IconButton, ui } from './ScreenUI';
import { loadHadithBook } from '../services/HadithService';
import { searchHadiths } from '../utils/hadithSearch';

const EDITIONS = [['bukhari', 'Sahih al-Bukhari', 'صحيح البخاري'], ['muslim', 'Sahih Muslim', 'صحيح مسلم'], ['abudawud', 'Abu Dawud', 'أبو داود'], ['tirmidhi', 'Al-Tirmidhi', 'الترمذي'], ['nasai', 'Al-Nasai', 'النسائي'], ['ibnmajah', 'Ibn Majah', 'ابن ماجه']];
export default function HadithOfTheDay({ themeColors: t, language }) {
  const [edition, setEdition] = useState('bukhari');
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  const list = useRef(null);
  const ar = language === 'ar';
  const title = EDITIONS.find(([id]) => id === edition)?.[ar ? 2 : 1];
  async function show(search = '') {
    const token = ++request.current;
    setLoading(true); setError(''); setSubmitted(search); Keyboard.dismiss();
    try {
      const book = await loadHadithBook(edition);
      if (token !== request.current) return;
      setHadiths(search.trim() ? searchHadiths(book, search) : [book[Math.floor(Math.random() * book.length)]]);
      list.current?.scrollToOffset({ offset: 0, animated: false });
    } catch { if (token === request.current) { setHadiths([]); setError(ar ? 'تعذر تحميل الأحاديث. حاول مجدداً.' : 'Could not load this collection. Check your connection and retry.'); } }
    finally { if (token === request.current) setLoading(false); }
  }
  useEffect(() => { setQuery(''); show(); return () => { request.current++; }; }, [edition]);
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.backgroundColor }}>
    <PageHeader title={ar ? 'الحديث' : 'Hadith'} subtitle={ar ? 'اقرأ وتأمل وابحث' : 'Read, reflect, and discover'} theme={t} />
    <View style={styles.controls}>
      <View style={[styles.search, { backgroundColor: t.inputBackground }]}><Ionicons name="search-outline" size={20} color={t.secondaryTextColor} /><TextInput accessibilityLabel="Search Hadith" placeholder={ar ? 'كلمة أو رقم الحديث' : 'A word, topic, or Hadith number'} placeholderTextColor={t.secondaryTextColor} value={query} onChangeText={setQuery} onSubmitEditing={() => show(query)} returnKeyType="search" style={{ flex: 1, color: t.textColor, paddingVertical: 14 }} /><IconButton name="arrow-forward" label="Search" theme={t} onPress={() => show(query)} /></View>
      <View style={styles.toolbar}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose Hadith collection" onPress={() => setPicker(true)} style={[styles.chip, { backgroundColor: t.cardColor }]}><Ionicons name="library-outline" size={17} color={t.activeTabColor} /><Text style={{ color: t.textColor, fontWeight: '600' }}>{title}</Text><Ionicons name="chevron-down" size={15} color={t.secondaryTextColor} /></TouchableOpacity><IconButton name="shuffle-outline" label="Another Hadith" theme={t} onPress={() => { setQuery(''); show(); }} /></View>
      <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{loading ? (ar ? 'جاري التحميل…' : 'Opening collection…') : submitted ? `${hadiths.length} ${ar ? 'نتيجة' : 'results'}` : (ar ? 'حديث للتأمل' : 'A moment of reflection')}</Text>
    </View>
    {loading ? <ActivityIndicator style={{ marginTop: 35 }} color={t.activeTabColor} /> : <FlatList ref={list} data={hadiths} keyExtractor={item => String(item.hadithnumber)} contentContainerStyle={styles.results} ItemSeparatorComponent={() => <View style={{ height: 14 }} />} ListEmptyComponent={<View style={{ padding: 25, gap: 18 }}><Text style={{ color: t.textColor, textAlign: 'center', lineHeight: 24 }}>{error || (ar ? 'لم نعثر على نتائج. جرب كلمة أخرى.' : 'No matches. Try a different word or Hadith number.')}</Text>{!!error && <TouchableOpacity onPress={() => show(submitted)} accessibilityRole="button"><Text style={{ color: t.activeTabColor, textAlign: 'center' }}>{ar ? 'حاول مجدداً' : 'Retry'}</Text></TouchableOpacity>}</View>} renderItem={({ item }) => <View style={[styles.card, { backgroundColor: t.cardColor, borderColor: t.separatorColor }]}>
      <View style={styles.reference}><Ionicons name="book-outline" size={17} color={t.activeTabColor} /><Text style={{ color: t.secondaryTextColor, fontSize: 12, flex: 1 }}>{title} · {item.hadithnumber}</Text></View>
      {ar && !!item.araText && <Text selectable={false} style={[styles.arabic, { color: t.textColor }]}>{item.araText}</Text>}
      <Text selectable={false} style={[styles.english, { color: t.textColor }]}>{item.engText}</Text>
      {!ar && !!item.araText && <Text selectable={false} style={[styles.arabic, { color: t.textColor, borderTopColor: t.separatorColor, borderTopWidth: 1, paddingTop: 14 }]}>{item.araText}</Text>}
    </View>} />}
    <OptionSheet visible={picker} title={ar ? 'اختر مجموعة' : 'Choose a collection'} theme={t} onClose={() => setPicker(false)}>{EDITIONS.map(([id, en, arabic]) => <TouchableOpacity key={id} accessibilityRole="radio" accessibilityState={{ checked: id === edition }} onPress={() => { setEdition(id); setPicker(false); }} style={[ui.row, { backgroundColor: t.inputBackground }]}><Text style={{ color: t.textColor, flex: 1, fontSize: 17 }}>{ar ? arabic : en}</Text>{id === edition && <Ionicons name="checkmark-circle" color={t.activeTabColor} size={23} />}</TouchableOpacity>)}</OptionSheet>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ controls: { paddingHorizontal: 20, gap: 12, paddingBottom: 15 }, search: { flexDirection: 'row', alignItems: 'center', paddingLeft: 15, paddingRight: 4, gap: 10, borderRadius: 18 }, toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, chip: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 20, padding: 12 }, results: { paddingHorizontal: 20, paddingBottom: 110 }, card: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 18 }, reference: { flexDirection: 'row', alignItems: 'center', gap: 9 }, english: { fontSize: 17, lineHeight: 29 }, arabic: { fontFamily: 'Amiri', fontSize: 24, lineHeight: 44, textAlign: 'right', writingDirection: 'rtl' } });

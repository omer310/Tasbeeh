import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initialDuaCategories } from '../data/duasData';
import { useDua } from '../contexts/DuaContext';
import MyDuas from './MyDuas';

const ESSENTIALS = ['7-2', '6-1', '6-2', '4-1', '1-2', '7-1'];
const ICONS = { 1: 'water-outline', 2: 'shirt-outline', 3: 'home-outline', 4: 'restaurant-outline', 5: 'airplane-outline', 6: 'sunny-outline', 7: 'moon-outline', 8: 'heart-outline' };
const normalize = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, '').trim();
const allDuas = initialDuaCategories.flatMap(category => category.subcategories.map(dua => ({ ...dua, parentCategory: category })));
export default function Duas({ navigation, themeColors: t, language = 'en' }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('discover');
  const { myDuas, storageError } = useDua();
  const ar = language === 'ar';
  const title = item => ar ? item.titleAr || item.title : item.title;
  const open = dua => navigation.navigate('DuaDetails', { dua, category: dua.parentCategory, index: dua.parentCategory.subcategories.findIndex(item => item.id === dua.id) });
  const matches = allDuas.filter(dua => normalize([dua.title, dua.titleAr, dua.arabic, dua.translation, dua.transliteration, dua.parentCategory.title].join(' ')).includes(normalize(query)));
  const searching = !!query.trim();
  return <View style={{ flex: 1, backgroundColor: t.backgroundColor }}>
    <View style={styles.header}>
      <View><Text style={[styles.title, { color: t.textColor }]}>{ar ? 'الأدعية' : 'Duas'}</Text><Text style={{ color: t.secondaryTextColor }}>{ar ? 'دعاء لكل وقت' : 'For the moments in your day'}</Text></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add a custom dua" onPress={() => navigation.navigate('AddCustomDua')} style={[styles.add, { backgroundColor: t.inputBackground }]}><Ionicons name="add" size={25} color={t.activeTabColor} /></TouchableOpacity>
    </View>
    <View style={styles.tabs}>{[['discover', ar ? 'اكتشف' : 'Discover'], ['saved', `${ar ? 'أدعيتي' : 'My Duas'} · ${myDuas.length}`]].map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="tab" accessibilityState={{ selected: tab === id }} onPress={() => setTab(id)} style={[styles.tab, { backgroundColor: tab === id ? t.activeTabColor : t.inputBackground }]}><Text style={{ color: tab === id ? '#fff' : t.textColor, fontWeight: '600' }}>{label}</Text></TouchableOpacity>)}</View>
    {!!storageError && <Text style={{ color: t.errorColor, padding: 12 }}>{storageError}</Text>}
    {tab === 'saved' ? <MyDuas navigation={navigation} themeColors={t} language={language} isDarkMode={t.isDark} /> : <>
      <View style={[styles.search, { backgroundColor: t.inputBackground }]}><Ionicons name="search" size={19} color={t.secondaryTextColor} /><TextInput accessibilityLabel="Search all duas" placeholder={ar ? 'ابحث في الأدعية' : 'Search duas, occasions, or words'} placeholderTextColor={t.secondaryTextColor} style={{ flex: 1, padding: 10, color: t.textColor }} value={query} onChangeText={setQuery} />{!!query && <TouchableOpacity accessibilityLabel="Clear dua search" onPress={() => setQuery('')}><Ionicons name="close" size={20} color={t.textColor} /></TouchableOpacity>}</View>
      <FlatList key={searching ? 'results' : 'categories'} data={searching ? matches : initialDuaCategories} numColumns={searching ? 1 : 2} keyExtractor={item => item.id} contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListHeaderComponent={searching ? <Text style={[styles.section, { color: t.textColor }]}>{matches.length} {ar ? 'نتائج' : 'results'}</Text> : <>
          <Text style={[styles.section, { color: t.textColor }]}>{ar ? 'أدعية يومية' : 'Daily essentials'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>{ESSENTIALS.map(id => allDuas.find(dua => dua.id === id)).map(dua => <TouchableOpacity key={dua.id} accessibilityRole="button" onPress={() => open(dua)} style={[styles.essential, { backgroundColor: t.isDark ? '#244237' : '#EAF3ED' }]}><Ionicons name={ICONS[dua.parentCategory.id]} size={24} color={t.activeTabColor} /><Text style={{ color: t.textColor, fontWeight: '600', lineHeight: 22 }}>{title(dua)}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{title(dua.parentCategory)}</Text></TouchableOpacity>)}</ScrollView>
          <Text style={[styles.section, { color: t.textColor }]}>{ar ? 'تصفح حسب الموضوع' : 'Browse by category'}</Text>
        </>}
        ListEmptyComponent={<Text style={{ color: t.secondaryTextColor, paddingVertical: 20 }}>{ar ? 'لا توجد نتائج. جرّب كلمة أخرى.' : 'No duas found. Try another word or occasion.'}</Text>}
        renderItem={({ item }) => searching ? <TouchableOpacity accessibilityRole="button" onPress={() => open(item)} style={[styles.result, { borderBottomColor: t.separatorColor }]}><Text style={{ color: t.textColor, fontSize: 16, fontWeight: '600' }}>{title(item)}</Text><Text style={{ color: t.secondaryTextColor, marginTop: 6 }}>{title(item.parentCategory)}</Text></TouchableOpacity> : <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('DuaList', { category: item })} style={[styles.category, { backgroundColor: t.inputBackground }]}><Ionicons name={ICONS[item.id]} size={24} color={t.activeTabColor} /><Text style={{ color: t.textColor, fontSize: 16, fontWeight: '600' }}>{title(item)}</Text><Text style={{ color: t.secondaryTextColor }}>{item.subcategories.length} {ar ? 'أدعية' : 'duas'}</Text></TouchableOpacity>} />
    </>}
  </View>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }, title: { fontSize: 30, fontWeight: '700', marginBottom: 4 }, add: { padding: 10, borderRadius: 15 },
  tabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 }, tab: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  search: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 12 }, section: { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 14 },
  essential: { width: 154, minHeight: 150, borderRadius: 18, padding: 16, gap: 10 }, category: { flex: 1, margin: 4, padding: 16, borderRadius: 16, minHeight: 130, gap: 10 }, result: { paddingVertical: 18, borderBottomWidth: 1 },
});

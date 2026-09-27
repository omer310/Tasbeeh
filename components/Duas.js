import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import initialDuaCategories from '../data/hisnDuas.json';
import { useDua } from '../contexts/DuaContext';
import MyDuas from './MyDuas';
import { DUA_TOPICS, DAILY_ATHKAR } from '../data/duaTopics';
import { EVERYDAY_DUAS, normalizeDuaSearch as normalize, duaCategoryDestination } from '../utils/duaDiscovery';
import DuaCategorySheet from './DuaCategorySheet';
import DuaIcon from './DuaIcon';

const allDuas = initialDuaCategories.flatMap(category => category.subcategories.map(dua => ({ ...dua, parentCategory: category })));
export default function Duas({ route, navigation, themeColors: t, language = 'en' }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('discover');
  const [showEveryday, setShowEveryday] = useState(false), [topic, setTopic] = useState(null), [topicOpen, setTopicOpen] = useState(false);
  const pendingDua = useRef(null);
  const { myDuas, storageError } = useDua();
  useEffect(() => { if (route?.params?.showSaved) { setTab('saved'); navigation.setParams({ showSaved: false }); } }, [route?.params?.showSaved, navigation]);
  const ar = language === 'ar';
  const title = item => ar ? item.titleAr || item.title : item.title;
  const open = dua => navigation.navigate('DuaDetails', { dua, category: dua.parentCategory, index: dua.parentCategory.subcategories.findIndex(item => item.id === dua.id) });
  const openCategory = (category, duaId) => {
    const destination = duaCategoryDestination(category, duaId);
    if (!destination) return;
    if (topicOpen) { pendingDua.current = destination; setTopicOpen(false); }
    else navigation.navigate('DuaList', destination);
  };
  const finishTopic = () => {
    const destination = pendingDua.current; pendingDua.current = null;
    if (destination) navigation.navigate('DuaList', destination);
  };
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
      <View style={[styles.search, { backgroundColor: t.inputBackground }]}><Ionicons name="search" size={19} color={t.secondaryTextColor} /><TextInput accessibilityLabel="Search all duas" placeholder={ar ? 'ابحث في الأدعية' : 'Search duas, occasions, or words'} placeholderTextColor={t.secondaryTextColor} style={{ flex: 1, minWidth: 0, paddingVertical: 12, paddingHorizontal: 10, color: t.textColor, fontSize: 15 }} value={query} onChangeText={setQuery} />{!!query && <TouchableOpacity accessibilityLabel="Clear dua search" onPress={() => setQuery('')}><Ionicons name="close" size={20} color={t.textColor} /></TouchableOpacity>}</View>
      <FlatList key={searching ? 'results' : 'categories'} data={searching ? matches : DUA_TOPICS} numColumns={searching ? 1 : 2} keyExtractor={item => item.id} style={{ flex: 1 }} keyboardShouldPersistTaps="handled" removeClippedSubviews={false} contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 24 }}
        ListHeaderComponent={searching ? <Text style={[styles.section, { color: t.textColor }]}>{matches.length} {ar ? 'نتائج' : 'results'}</Text> : <>
          <View style={styles.everydayHeading}><Text style={{ color: t.textColor, fontSize: 20, fontWeight: '600' }}>{ar ? 'أدعية يومية' : 'Everyday'}</Text><TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showEveryday }} onPress={() => setShowEveryday(value => !value)} style={styles.more}><Text style={{ color: t.activeTabColor, fontWeight: '600' }}>{showEveryday ? (ar ? 'أقل' : 'Show less') : (ar ? 'المزيد' : 'Show all')}</Text><Ionicons name={showEveryday ? 'chevron-up' : 'chevron-down'} size={16} color={t.activeTabColor} /></TouchableOpacity></View>
          <View style={styles.everydayGrid}>{EVERYDAY_DUAS.slice(0, showEveryday ? EVERYDAY_DUAS.length : 6).map(item => <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={title(item)} onPress={() => openCategory(item.category)} style={[styles.everyday, { backgroundColor: t.inputBackground }]}><DuaIcon name={item.icon} size={28} color={t.activeTabColor} background={t.inputBackground} /><Text style={{ flex: 1, color: t.textColor, fontSize: 14, fontWeight: '600', textAlign: ar ? 'right' : 'left' }}>{title(item)}</Text></TouchableOpacity>)}</View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>{DAILY_ATHKAR.map(category => <TouchableOpacity key={category.id} accessibilityRole="button" onPress={() => navigation.navigate('DuaList', { category })} style={[styles.daily, { backgroundColor: t.isDark ? '#244237' : '#EAF3ED' }]}><DuaIcon name={category.period === 'morning' ? 'morning' : 'evening'} size={30} color={t.activeTabColor} /><Text style={{ color: t.textColor, fontSize: 16, fontWeight: '600' }}>{ar ? (category.period === 'morning' ? 'أذكار الصباح' : 'أذكار المساء') : category.period === 'morning' ? 'Morning Athkar' : 'Evening Athkar'}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{ar ? 'عدّ وتابع' : 'Count & continue'}</Text></TouchableOpacity>)}</View>
          <Text style={[styles.section, { color: t.textColor }]}>{ar ? 'لكل لحظة' : 'For every moment'}</Text>
        </>}
        ListEmptyComponent={<Text style={{ color: t.secondaryTextColor, paddingVertical: 20 }}>{ar ? 'لا توجد نتائج. جرّب كلمة أخرى.' : 'No duas found. Try another word or occasion.'}</Text>}
        renderItem={({ item }) => searching ? <TouchableOpacity accessibilityRole="button" onPress={() => open(item)} style={[styles.result, { borderBottomColor: t.separatorColor }]}><Text style={{ color: t.textColor, fontSize: 16, fontWeight: '600' }}>{title(item)}</Text><Text style={{ color: t.secondaryTextColor, marginTop: 6 }}>{title(item.parentCategory)}</Text></TouchableOpacity> : <TouchableOpacity accessibilityRole="button" onPress={() => { setTopic(item); setTopicOpen(true); }} style={[styles.category, { backgroundColor: t.inputBackground }]}><DuaIcon name={item.icon} size={32} color={t.activeTabColor} background={t.inputBackground} /><Text style={{ color: t.textColor, fontSize: 16, fontWeight: '600' }}>{title(item)}</Text><Text style={{ color: t.secondaryTextColor }}>{item.occasions.length} {ar ? 'مناسبات' : 'occasions'} · {item.subcategories.length} {ar ? 'أدعية' : 'duas'}</Text></TouchableOpacity>} />
    </>}
    {!!topic && <DuaCategorySheet key={topic.id} visible={topicOpen} topic={topic} onClose={() => setTopicOpen(false)} onDismiss={finishTopic} onOpen={openCategory} theme={t} language={language} />}
  </View>;
}
const styles = StyleSheet.create({
  everydayHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }, more: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 48, paddingLeft: 12 }, everydayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }, everyday: { flexBasis: '47%', flexGrow: 1, minHeight: 60, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  daily: { flex: 1, padding: 16, borderRadius: 19, gap: 9 }, header: { flexShrink: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }, title: { fontSize: 30, fontWeight: '700', marginBottom: 4 }, add: { padding: 10, borderRadius: 15 },
  tabs: { flexShrink: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 }, tab: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  search: { flexShrink: 0, minHeight: 52, marginBottom: 10, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 12 }, section: { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 14 },
  essential: { width: 154, minHeight: 150, borderRadius: 18, padding: 16, gap: 10 }, category: { flex: 1, margin: 4, padding: 16, borderRadius: 16, minHeight: 116, gap: 8 }, result: { paddingVertical: 18, borderBottomWidth: 1 },
});

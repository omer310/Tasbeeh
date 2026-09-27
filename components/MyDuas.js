import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDua } from '../contexts/DuaContext';
import useDeleteCustomDua from '../hooks/useDeleteCustomDua';

const normalize = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[\u064b-\u065f\u0670]/g, '').trim();
export default function MyDuas({ navigation, themeColors: t, language }) {
  const { myDuas, favorites, notes, onToggleFavorite, hydrated, storageError } = useDua();
  const deleteCustomDua = useDeleteCustomDua(language);
  const [query, setQuery] = useState('');
  const ar = language === 'ar';
  const results = useMemo(() => myDuas.filter(dua => normalize([dua.title, dua.titleAr, dua.arabic, dua.translation, dua.transliteration, notes[dua.id]].join(' ')).includes(normalize(query))), [myDuas, notes, query]);
  const title = item => ar ? item.titleAr || item.title : item.title;
  return <View style={{ flex: 1, backgroundColor: t.backgroundColor }}>
    <View style={[styles.search, { backgroundColor: t.inputBackground }]}>
      <Ionicons name="search" size={19} color={t.secondaryTextColor} />
      <TextInput accessibilityLabel="Search saved duas" placeholder={ar ? 'ابحث في أدعيتي' : 'Search My Duas'} placeholderTextColor={t.secondaryTextColor} value={query} onChangeText={setQuery} style={{ flex: 1, minWidth: 0, paddingHorizontal: 10, paddingVertical: 12, color: t.textColor, fontSize: 15 }} />
      {!!query && <TouchableOpacity accessibilityLabel="Clear saved dua search" onPress={() => setQuery('')} style={{ padding: 8 }}><Ionicons name="close" size={19} color={t.textColor} /></TouchableOpacity>}
    </View>
    {!!storageError && <Text accessibilityRole="alert" style={{ color: t.errorColor, marginHorizontal: 16, marginBottom: 10 }}>{storageError}</Text>}
    <FlatList style={{ flex: 1 }} data={results} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled" removeClippedSubviews={false} contentContainerStyle={{ padding: 16, paddingTop: 6, paddingBottom: 28 }}
      ListEmptyComponent={<View style={styles.empty}><Ionicons name="bookmark-outline" size={36} color={t.activeTabColor} /><Text style={{ color: t.textColor, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>{!hydrated ? (ar ? 'جاري التحميل…' : 'Loading saved Duas…') : query ? (ar ? 'لا توجد نتائج' : 'No matching Duas') : (ar ? 'أدعيتك قريبة منك' : 'Keep your Duas close')}</Text><Text style={{ color: t.secondaryTextColor, textAlign: 'center', lineHeight: 23 }}>{query ? (ar ? 'جرّب كلمة أخرى.' : 'Try another word.') : (ar ? 'احفظ دعاء أثناء القراءة، أو أضف دعاءك من علامة +.' : 'Save any Dua while reading, or add your own using +.')}</Text></View>}
      renderItem={({ item }) => <View style={[styles.card, { backgroundColor: t.inputBackground }]}>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('DuaDetails', { dua: item, category: null, initialFilteredSubcategories: results })} style={{ flex: 1, gap: 8, padding: 17 }}>
          <Text style={{ color: t.textColor, fontSize: 17, fontWeight: '600', lineHeight: 25 }}>{title(item)}</Text>
          {!!item.arabic && <Text numberOfLines={2} style={{ color: t.secondaryTextColor, fontFamily: 'Amiri', fontSize: 21, lineHeight: 34, textAlign: 'right' }}>{item.arabic}</Text>}
          {!!(notes[item.id] || item.note) && <Text numberOfLines={2} style={{ color: t.secondaryTextColor, fontSize: 13, lineHeight: 21 }}>{notes[item.id] || item.note}</Text>}
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={item.isCustom ? (ar ? 'حذف الدعاء' : 'Delete custom Dua') : favorites[item.id] ? 'Unsave Dua' : 'Save Dua'} disabled={!hydrated} onPress={() => item.isCustom ? deleteCustomDua(item) : onToggleFavorite(item)} style={{ minWidth: 44, minHeight: 44, paddingTop: 18, alignItems: 'center' }}><Ionicons name={item.isCustom ? 'trash-outline' : favorites[item.id] ? 'bookmark' : 'bookmark-outline'} size={23} color={item.isCustom ? t.errorColor : t.activeTabColor} /></TouchableOpacity>
      </View>} />
  </View>;
}
const styles = StyleSheet.create({ search: { flexShrink: 0, minHeight: 52, flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, borderRadius: 12 }, card: { borderRadius: 18, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', paddingRight: 7 }, empty: { alignItems: 'center', gap: 15, paddingHorizontal: 20, paddingVertical: 35 } });

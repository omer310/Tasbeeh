import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import { occasionsForTopic, duaCategoryDestination } from '../utils/duaDiscovery';

export default function DuaCategorySheet({ topic, visible, onClose, onDismiss, onOpen, theme: t, language }) {
  const ar = language === 'ar', { height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const occasions = useMemo(() => occasionsForTopic(topic, query), [topic, query]);
  const title = item => ar ? item.titleAr || item.title : item.title;
  return <BottomSheet visible={visible} title={title(topic)} theme={t} language={language} onClose={onClose} onDismiss={onDismiss} height={Math.min(640, height * 0.82)} scrollable={false}>
    <View style={[styles.search, { backgroundColor: t.inputBackground }]}>
      <Ionicons name="search" color={t.secondaryTextColor} size={19} />
      <TextInput accessibilityLabel={ar ? 'ابحث عن مناسبة أو دعاء' : 'Find an occasion or dua'} value={query} onChangeText={setQuery} placeholder={ar ? 'ابحث عن مناسبة أو كلمات الدعاء…' : 'Find an occasion or words in a dua…'} placeholderTextColor={t.secondaryTextColor} style={{ flex: 1, minWidth: 0, color: t.textColor, paddingVertical: 14, fontSize: 15 }} />
    </View>
    <FlatList data={occasions} keyExtractor={item => item.id} style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}
      ListEmptyComponent={<Text style={{ color: t.secondaryTextColor, paddingVertical: 20 }}>{ar ? 'لا توجد نتائج. جرّب كلمة أخرى.' : 'No matches. Try another occasion or word.'}</Text>}
      renderItem={({ item }) => {
        const { dua } = duaCategoryDestination(item, null, query);
        return <Pressable accessibilityRole="button" onPress={() => onOpen(item, dua.id)} style={({ pressed }) => [styles.row, { borderBottomColor: t.separatorColor, opacity: pressed ? 0.65 : 1 }]}>
        <View style={{ flex: 1, gap: 7 }}><Text style={{ color: t.textColor, fontSize: 16, fontWeight: '600', textAlign: ar ? 'right' : 'left' }}>{title(item)}</Text>
          <Text numberOfLines={1} style={{ color: t.secondaryTextColor, fontFamily: 'Amiri', fontSize: 19, textAlign: 'right' }}>{dua.arabic}</Text>
        </View><Ionicons name={ar ? 'chevron-back' : 'chevron-forward'} color={t.activeTabColor} size={20} />
      </Pressable>; }} />
    <Pressable accessibilityRole="button" onPress={() => onOpen(topic)} style={[styles.readAll, { backgroundColor: t.inputBackground }]}><Ionicons name="book-outline" color={t.activeTabColor} size={20} /><Text style={{ color: t.textColor, fontWeight: '600' }}>{ar ? 'اقرأ القسم كاملاً' : 'Read the whole category'}</Text></Pressable>
  </BottomSheet>;
}
const styles = StyleSheet.create({ search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 12 }, row: { minHeight: 76, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth }, readAll: { minHeight: 48, padding: 12, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 } });

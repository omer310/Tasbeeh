import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuranVerseText from './QuranVerseText';

export const verseMarker = verse => verse.marker || `۝${String(verse.id).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)])}`;
export const groupText = group => group.map(v => `${v.text} ${verseMarker(v)} `).join('');

function QuranTextRow({ group, index, mode, fontSize, translation, riwayah, theme: t, language, onHold, playingKey, word, selection, measure, recordLayout }) {
  const ar = language === 'ar', verse = group[0];
  const arabic = useMemo(() => ({ color: t.textColor, fontFamily: riwayah === 'duri' ? 'QuranDuri' : 'Amiri', fontSize, lineHeight: fontSize * 2, textAlign: 'right', writingDirection: 'rtl' }), [t.textColor, riwayah, fontSize]);
  const onLayout = useCallback(e => recordLayout(index, { y: e.nativeEvent.layout.y }), [index, recordLayout]);
  const onLines = useCallback(e => recordLayout(index, { lines: e.nativeEvent.lines }), [index, recordLayout]);
  const text = <Text selectable={false} onLayout={measure ? onLayout : undefined} onTextLayout={measure ? onLines : undefined} style={[arabic, mode === 'flow' && { marginBottom: 10 }]}>
    {group.map(item => <Text key={item.key} selectable={false}><QuranVerseText verse={item} playingKey={playingKey} word={word} selection={selection} onHold={onHold} theme={t} language={language} /> {verseMarker(item)} </Text>)}
  </Text>;
  if (mode === 'flow') return <View>{text}</View>;
  return <View style={[styles.ayah, { backgroundColor: t.inputBackground }]}>
    <Pressable accessibilityRole="button" disabled={!onHold} pressRetentionOffset={0} accessibilityLabel={`${ar ? 'التفسير والاستماع للآية' : 'Tafsir and listening options for ayah'} ${verse.key}`} onPress={() => onHold?.(verse.key)} style={styles.actions}>
      <Text style={{ color: t.activeTabColor, fontSize: 12 }}>{verse.key}</Text><Ionicons name="ellipsis-horizontal" size={22} color={t.activeTabColor} />
    </Pressable>
    {text}
    {translation && !!verse.translation && <Text selectable={false} style={{ color: t.textColor, lineHeight: 27, fontSize: 17, marginTop: 12 }}>{verse.translation}</Text>}
  </View>;
}
export default memo(QuranTextRow);
const styles = StyleSheet.create({ ayah: { padding: 16, borderRadius: 16, marginBottom: 14 }, actions: { alignSelf: 'flex-start', minHeight: 48, minWidth: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 } });

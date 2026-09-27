import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import BottomSheet from './BottomSheet';
import SelectionWheel from './SelectionWheel';
import chapters from '../data/quran/chapters.json';
import { ayahCount, pickerSelection, choosePickerValue } from '../utils/quranPicker';
import { validQuranPage, verseDestination, pageDestination } from '../utils/quranNavigation';
import { printedReference } from '../utils/printedMushaf';

export default function QuranJumpSheet({ visible, onClose, onJump, theme: t, language, reader, mode, nativeKey, page, initialTab = 'surahs' }) {
  const ar = language === 'ar', { height, fontScale } = useWindowDimensions();
  const pageOnly = initialTab === 'page';
  const localize = value => ar ? String(value).replace(/[0-9]/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]) : String(value);
  const [draftSelection, setSelection] = useState(() => pickerSelection(nativeKey, reader));
  const selection = useMemo(() => pickerSelection(draftSelection.key, reader), [draftSelection.key, reader]);
  const [revision, setRevision] = useState(0), [moving, setMoving] = useState(false), [pageInput, setPageInput] = useState(String(page));
  const movingColumns = useRef(new Set()), committed = useRef(false), latest = useRef({ nativeKey, page });
  useLayoutEffect(() => { latest.current = { nativeKey, page }; }, [nativeKey, page]);
  useLayoutEffect(() => {
    if (!visible) return;
    setSelection(pickerSelection(latest.current.nativeKey, reader)); setPageInput(String(latest.current.page));
    setRevision(value => value + 1); movingColumns.current.clear(); setMoving(false); committed.current = false;
  }, [visible, reader, initialTab]);
  const juzItems = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: (i + 1).toLocaleString(ar ? 'ar' : 'en') })), [ar]);
  const surahItems = useMemo(() => chapters.map(chapter => ({ value: chapter.id, label: `${chapter.id.toLocaleString(ar ? 'ar' : 'en')}. ${ar ? chapter.name_arabic : chapter.name_simple}` })), [ar]);
  const ayahItems = useMemo(() => Array.from({ length: ayahCount(selection.chapter, reader) }, (_, i) => {
    const value = i + 1;
    const label = mode === 'mushaf' ? printedReference(`${selection.chapter}:${value}`, reader).split(':')[1] : String(value);
    return { value, label: ar ? label.replace(/[0-9]/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]) : label };
  }), [selection.chapter, reader, mode, ar]);
  const choose = useCallback((column, value) => { setSelection(previous => choosePickerValue(previous, column, value, reader)); setRevision(previous => previous + 1); }, [reader]);
  const markMoving = useCallback((column, value) => { if (value) movingColumns.current.add(column); else movingColumns.current.delete(column); setMoving(movingColumns.current.size > 0); }, []);
  const done = () => {
    if (committed.current || (!pageOnly && movingColumns.current.size)) return;
    const destination = pageOnly ? pageDestination(pageInput, reader, mode) : verseDestination(selection.key, reader, mode);
    if (destination) { committed.current = true; onJump(destination); }
  };
  const rowHeight = Math.ceil(52 * Math.min(Math.max(fontScale, 1), 1.5));
  return <BottomSheet visible={visible} title={pageOnly ? (ar ? 'انتقل إلى صفحة' : 'Go to a page') : (ar ? 'انتقل إلى آية' : 'Go to an ayah')} theme={t} language={language} onClose={onClose}
    height={pageOnly ? Math.min(340, height * 0.8) : Math.min(560, height * 0.82)} scrollable={false}>
    {pageOnly ? <View style={{ flex: 1, gap: 12 }}>
      <Text style={{ color: t.secondaryTextColor }}>{ar ? 'أدخل رقم الصفحة من ١ إلى ٦٠٤.' : 'Enter a page number from 1 to 604.'}</Text>
      <TextInput accessibilityLabel={ar ? 'رقم الصفحة' : 'Page number'} value={pageInput} onChangeText={setPageInput} keyboardType="number-pad" selectTextOnFocus onSubmitEditing={done} style={[styles.input, { backgroundColor: t.inputBackground, color: t.textColor }]} />
    </View> : <>
      <View style={styles.headings}>{[[ar ? 'الجزء' : 'Juz', 1], [ar ? 'السورة' : 'Surah', 2.6], [ar ? 'الآية' : 'Ayah', 1]].map(([label, flex]) => <Text key={label} style={{ flex, textAlign: 'center', color: t.secondaryTextColor, fontSize: 16, fontWeight: '600' }}>{label}</Text>)}</View>
      <View style={styles.wheels}>
        {[
          { id: 'juz', label: ar ? 'الجزء' : 'Juz', items: juzItems, index: selection.juz - 1, flex: 1 },
          { id: 'surah', label: ar ? 'السورة' : 'Surah', items: surahItems, index: selection.chapter - 1, flex: 2.6 },
          { id: 'ayah', label: ar ? 'الآية' : 'Ayah', items: ayahItems, index: selection.ayah - 1, flex: 1 },
        ].map(column => <View key={column.id} style={{ flex: column.flex, minWidth: 0 }}><SelectionWheel column={column.id} items={column.items} index={column.index} label={column.label} theme={t} rowHeight={rowHeight} wide={column.id === 'surah'} revision={revision}
          onSelect={choose} onMoving={markMoving} /></View>)}
      </View>
    </>}
    <View style={styles.footer}>
      {!pageOnly && <Text numberOfLines={2} style={{ flex: 1, color: t.secondaryTextColor, fontSize: 13, lineHeight: 20 }}>{ar ? chapters[selection.chapter - 1].name_arabic : chapters[selection.chapter - 1].name_simple} · {ar ? 'آية' : 'Ayah'} {localize(ayahItems[selection.ayah - 1].label)}</Text>}
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: pageOnly ? !validQuranPage(pageInput) : moving }} disabled={pageOnly ? !validQuranPage(pageInput) : moving} onPress={done} style={[styles.done, { backgroundColor: t.activeTabColor, opacity: (pageOnly ? !validQuranPage(pageInput) : moving) ? 0.5 : 1 }]}><Text style={{ color: t.isDark ? t.backgroundColor : '#fff', fontWeight: '700', fontSize: 16 }}>{ar ? 'تم' : 'Done'}</Text></TouchableOpacity>
    </View>
  </BottomSheet>;
}
const styles = StyleSheet.create({ headings: { flexDirection: 'row', gap: 8, paddingTop: 2 }, wheels: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 8 }, footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16, paddingTop: 4 }, done: { minHeight: 48, minWidth: 96, paddingHorizontal: 24, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, input: { minHeight: 54, borderRadius: 14, padding: 12, fontSize: 24, textAlign: 'center' } });

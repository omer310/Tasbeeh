import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Share, Animated, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useDua } from '../contexts/DuaContext';
import useHisnTranslation from '../hooks/useHisnTranslation';
import useAthkarProgress from '../hooks/useAthkarProgress';
import useDeleteCustomDua from '../hooks/useDeleteCustomDua';
import { PageHeader, IconButton, OptionSheet, ui } from './ScreenUI';

export default function DuaReadingScreen({ route, navigation }) {
  const { category, dua: initialDua, initialFilteredSubcategories, themeColors: t, language = 'en' } = route.params;
  const { myDuas, favorites, notes, hydrated, storageError, onToggleFavorite, onAddNote } = useDua();
  const deleteCustomDua = useDeleteCustomDua(language);
  const [items] = useState(() => initialFilteredSubcategories || category?.subcategories || myDuas);
  const [index, setIndex] = useState(() => Math.max(0, initialDua ? items.findIndex(item => item.id === initialDua.id) : 0));
  const [options, setOptions] = useState(false);
  const [occasionOpen, setOccasionOpen] = useState(false);
  const [occasionQuery, setOccasionQuery] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(true);
  const [message, setMessage] = useState('');
  const scroll = useRef(null), moving = useRef(false);
  const chips = useRef(null);
  const [movement] = useState(() => new Animated.Value(0));
  const progress = useAthkarProgress(category, items);
  const dua = items[index] || initialDua;
  const meaning = useHisnTranslation(dua, language);
  const ar = language === 'ar';
  const title = value => ar ? value?.titleAr || value?.title : value?.title;
  const completed = progress.enabled && progress.ready && items.every(item => (progress.counts[item.id] || 0) >= (item.repetitions || 1));
  const finishedCount = items.filter(item => (progress.counts[item.id] || 0) >= (item.repetitions || 1)).length;
  // Resume the first unfinished dhikr when opening a timed collection.
  useEffect(() => {
    if (!progress.enabled || !progress.ready || initialDua) return;
    setIndex(Math.max(0, items.findIndex(item => (progress.counts[item.id] || 0) < (item.repetitions || 1))));
    // Counts change on every tap; resuming is only for hydration/day changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.ready, progress.day]);
  useEffect(() => () => movement.stopAnimation(), [movement]);
  useEffect(() => { if (progress.enabled) chips.current?.scrollTo({ x: Math.max(0, index * 54 - 110), animated: true }); }, [index, progress.enabled]);
  const choose = next => {
    if (next < 0 || next >= items.length || moving.current) return;
    moving.current = true;
    Animated.timing(movement, { toValue: next > index ? -28 : 28, duration: 130, useNativeDriver: true }).start(({ finished }) => {
      if (!finished) { moving.current = false; return; }
      setIndex(next); setMessage(''); scroll.current?.scrollTo({ y: 0, animated: false });
      movement.setValue(next > index ? 28 : -28);
      Animated.timing(movement, { toValue: 0, duration: 170, useNativeDriver: true }).start(() => { moving.current = false; });
    });
  };
  const count = () => {
    if (!dua || moving.current) return;
    if (progress.increment(dua)) {
      const remaining = items.findIndex((item, i) => i > index && (progress.counts[item.id] || 0) < (item.repetitions || 1));
      const earlier = items.findIndex((item, i) => i !== index && (progress.counts[item.id] || 0) < (item.repetitions || 1));
      if (remaining >= 0 || earlier >= 0) choose(remaining >= 0 ? remaining : earlier);
    }
  };
  if (!dua) return <View style={{ flex: 1, backgroundColor: t.backgroundColor }}><PageHeader title={ar ? 'الأدعية' : 'Duas'} theme={t} onBack={() => navigation.goBack()} /></View>;
  const saved = !!favorites[dua.id];
  const save = () => { onToggleFavorite({ ...dua, ...(!ar ? { translation: meaning.translation, transliteration: meaning.transliteration } : {}), parentCategory: compactCategory(category || dua.parentCategory) }); setMessage(saved ? '' : (ar ? 'حُفظ في أدعيتي' : 'Saved to My Duas')); };
  const compactCategory = value => value ? { id: value.id, title: value.title, titleAr: value.titleAr } : undefined;
  const note = notes[dua.id] ?? dua.note ?? '';
  const currentCount = progress.counts[dua.id] || 0, target = dua.repetitions || 1;
  return <View style={{ flex: 1, backgroundColor: t.backgroundColor }}>
    <View style={styles.heading}>
      <IconButton name="arrow-back" label="Go back" color={t.textColor} onPress={() => navigation.goBack()} />
      <View style={{ flex: 1, gap: 4 }}><Text numberOfLines={2} style={{ color: t.textColor, fontSize: 18, fontWeight: '700' }}>{title(category) || (ar ? 'أدعيتي' : 'My Duas')}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{progress.enabled ? `${finishedCount} / ${items.length} · ${ar ? 'أذكار اليوم' : 'today’s Athkar'}` : `${index + 1} / ${items.length}`}</Text></View>
      <IconButton name={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? 'Unsave Dua' : 'Save Dua'} color={t.activeTabColor} onPress={save} disabled={!hydrated} />
      <IconButton name="ellipsis-horizontal" label="Dua options" color={t.textColor} onPress={() => setOptions(true)} />
    </View>
    {progress.enabled && <View style={{ height: 3, backgroundColor: t.inputBackground }}><View style={{ width: `${items.length ? finishedCount / items.length * 100 : 0}%`, height: 3, backgroundColor: t.activeTabColor }} /></View>}
    {completed ? <View style={styles.complete}>
      <Ionicons name="checkmark-circle-outline" size={76} color={t.activeTabColor} />
      <Text style={{ color: t.textColor, fontSize: 25, fontWeight: '700', textAlign: 'center' }}>{ar ? 'أتممت أذكارك' : 'Your Athkar are complete'}</Text>
      <Text style={{ color: t.secondaryTextColor, fontSize: 16, lineHeight: 25, textAlign: 'center' }}>{ar ? 'تقبّل الله منك. حُفظ تقدمك لهذا اليوم.' : 'May Allah accept your remembrance. Your progress is saved for today.'}</Text>
      {!!progress.error && <Text style={{ color: t.errorColor }}>{progress.error}</Text>}
      <TouchableOpacity onPress={() => navigation.goBack()} style={[ui.primary, { alignSelf: 'stretch' }]}><Text style={{ color: '#fff', fontWeight: '600' }}>{ar ? 'العودة للأدعية' : 'Back to Duas'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => { progress.reset(); setIndex(0); }} style={{ padding: 14 }}><Text style={{ color: t.activeTabColor }}>{ar ? 'ابدأ مرة أخرى' : 'Start again'}</Text></TouchableOpacity>
    </View> : <>
      {!!category?.occasions && <TouchableOpacity accessibilityRole="button" onPress={() => { setOccasionQuery(''); setOccasionOpen(true); }} style={{ marginHorizontal: 18, marginTop: 8, padding: 12, borderRadius: 13, backgroundColor: t.inputBackground, flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text numberOfLines={1} style={{ flex: 1, color: t.textColor, fontSize: 14 }}>{ar ? dua.occasionTitleAr : dua.occasionTitle}</Text><Ionicons name="chevron-down" size={17} color={t.activeTabColor} /></TouchableOpacity>}
      {items.length > 1 && <ScrollView ref={chips} horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={styles.chips}>{items.map((item, i) => <TouchableOpacity key={item.id} accessibilityRole="tab" accessibilityState={{ selected: index === i }} accessibilityLabel={`${i + 1}. ${title(item)}`} onPress={() => choose(i)} style={[styles.chip, { backgroundColor: i === index ? '#287457' : t.inputBackground }]}>
        <Text numberOfLines={1} style={{ color: i === index ? '#fff' : t.secondaryTextColor, fontSize: 13 }}>{progress.enabled ? `${(progress.counts[item.id] || 0) >= (item.repetitions || 1) ? '✓ ' : ''}${i + 1}` : item.hisnChapter ? `${i + 1} · ${item.arabic.split(' ').slice(0, 3).join(' ')}` : title(item)}</Text>
      </TouchableOpacity>)}</ScrollView>}
      <PanGestureHandler activeOffsetX={[-35, 35]} failOffsetY={[-18, 18]} onHandlerStateChange={({ nativeEvent: e }) => { if (e.state === State.END && Math.abs(e.translationX) > 65) choose(index + (e.translationX < 0 ? 1 : -1)); }}>
        <Animated.View style={{ flex: 1, transform: [{ translateX: movement }], opacity: movement.interpolate({ inputRange: [-28, 0, 28], outputRange: [0.15, 1, 0.15] }) }}>
          <ScrollView ref={scroll} key={dua.id} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.reading} showsVerticalScrollIndicator={false}>
            {!dua.hisnChapter && <Text style={{ color: t.textColor, fontSize: 23, fontWeight: '700', lineHeight: 31 }}>{title(dua)}</Text>}
            {!!dua.arabic && <View style={[styles.arabicCard, { backgroundColor: t.isDark ? '#243A2F' : '#F1F6EF', borderColor: t.isDark ? '#3C5345' : '#E0EADA' }]}><Text selectable={false} style={{ color: t.textColor, fontFamily: 'Amiri', fontSize: 29, lineHeight: 54, textAlign: 'right', writingDirection: 'rtl' }}>{dua.arabic}</Text></View>}
            {!progress.enabled && target > 1 && <Text style={{ color: t.activeTabColor, fontSize: 13 }}>{ar ? `التكرار: ${target}` : `Repeat ${target} times`}</Text>}
            {showPronunciation && !!meaning.transliteration && !ar && <View style={styles.textSection}><Text style={[styles.eyebrow, { color: t.activeTabColor }]}>PRONUNCIATION</Text><Text selectable={false} style={{ color: t.secondaryTextColor, fontSize: 16, lineHeight: 27, fontStyle: 'italic' }}>{meaning.transliteration}</Text></View>}
            {!!(ar ? dua.translationAr || (!dua.hisnChapter && meaning.translation) : meaning.translation) && <View style={styles.textSection}><Text style={[styles.eyebrow, { color: t.activeTabColor }]}>{ar ? 'المعنى' : 'MEANING'}</Text><Text selectable={false} style={{ color: t.textColor, fontSize: 17, lineHeight: 29 }}>{ar ? dua.translationAr || meaning.translation : meaning.translation}</Text></View>}
            {meaning.loading && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><ActivityIndicator color={t.activeTabColor} /><Text style={{ color: t.secondaryTextColor }}>Loading the English meaning…</Text></View>}
            {meaning.unavailable && <TouchableOpacity accessibilityRole="button" onPress={meaning.retry} style={{ paddingVertical: 12 }}><Text style={{ color: t.activeTabColor, lineHeight: 23 }}>Connect to load the English meaning. Tap to retry.</Text></TouchableOpacity>}
            {!!(dua.reference || dua.referenceAr) && <View style={[styles.reference, { borderTopColor: t.separatorColor }]}><Ionicons name="book-outline" color={t.activeTabColor} size={17} /><Text selectable={false} style={{ color: t.secondaryTextColor, fontSize: 12, lineHeight: 20, flex: 1 }}>{ar ? dua.referenceAr || dua.reference : dua.reference}</Text></View>}
            {!!dua.sourceUrl && <TouchableOpacity accessibilityRole="link" onPress={() => Linking.openURL(dua.sourceUrl).catch(() => setMessage('Could not open the source.'))}><Text style={{ color: t.activeTabColor, fontSize: 12 }}>{ar ? 'حصن المسلم · المصدر' : 'Hisn al-Muslim · View source'}</Text></TouchableOpacity>}
            {!!message && <Text style={{ color: t.activeTabColor, fontSize: 12 }}>{message}</Text>}
            {!!(storageError || progress.error) && <Text style={{ color: t.errorColor }}>{storageError || progress.error}</Text>}
          </ScrollView>
        </Animated.View>
      </PanGestureHandler>
      {progress.enabled && <View style={[styles.counterDock, { borderTopColor: t.separatorColor, backgroundColor: t.backgroundColor }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${ar ? 'عد الذكر' : 'Count dhikr'}: ${currentCount} / ${target}`} disabled={!progress.ready} onPress={count} style={[styles.counter, { backgroundColor: '#287457', opacity: progress.ready ? 1 : 0.5 }]}>
          <View><Text style={{ color: '#D6EBDD', fontSize: 12 }}>{ar ? 'اضغط مع كل تكرار' : 'Tap with each repetition'}</Text><Text style={{ color: '#fff', fontSize: 29, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{currentCount} <Text style={{ fontSize: 18, fontWeight: '400', color: '#CDE5D6' }}>/ {target}</Text></Text></View>
          <Ionicons name={currentCount >= target ? 'checkmark-circle-outline' : 'add-circle-outline'} size={36} color="#fff" />
        </TouchableOpacity>
      </View>}
    </>}
    <OptionSheet visible={occasionOpen} title={ar ? 'اختر المناسبة' : 'Choose an occasion'} theme={t} onClose={() => setOccasionOpen(false)}>
      <TextInput accessibilityLabel="Find a Dua occasion" value={occasionQuery} onChangeText={setOccasionQuery} placeholder={ar ? 'ابحث…' : 'Search occasions…'} placeholderTextColor={t.secondaryTextColor} style={{ color: t.textColor, backgroundColor: t.inputBackground, padding: 14, borderRadius: 12 }} />
      {category?.occasions?.filter(item => `${item.title} ${item.titleAr}`.toLowerCase().includes(occasionQuery.trim().toLowerCase())).map(item => <TouchableOpacity key={item.id} onPress={() => { choose(item.index); setOccasionOpen(false); }} style={[ui.row, { backgroundColor: t.inputBackground }]}><Text style={{ color: t.textColor, flex: 1, lineHeight: 23 }}>{title(item)}</Text><Text style={{ color: t.secondaryTextColor }}>{item.count}</Text></TouchableOpacity>)}
    </OptionSheet>
    <OptionSheet visible={options} title={ar ? 'خيارات الدعاء' : 'Dua options'} theme={t} onClose={() => setOptions(false)}>
      {!!dua.isCustom && <TouchableOpacity accessibilityRole="button" accessibilityLabel={ar ? 'حذف الدعاء' : 'Delete custom Dua'} disabled={!hydrated} onPress={() => deleteCustomDua(dua, () => { setOptions(false); navigation.goBack(); })} style={[ui.row, { backgroundColor: t.inputBackground }]}><Ionicons name="trash-outline" size={23} color={t.errorColor} /><Text style={{ color: t.errorColor }}>{ar ? 'حذف الدعاء' : 'Delete Dua'}</Text></TouchableOpacity>}
      <TouchableOpacity onPress={() => { setOptions(false); setNoteOpen(true); }} style={[ui.row, { backgroundColor: t.inputBackground }]}><Ionicons name="create-outline" size={23} color={t.activeTabColor} /><Text style={{ color: t.textColor }}>{ar ? 'ملاحظة شخصية' : note ? 'Edit personal note' : 'Add a personal note'}</Text></TouchableOpacity>
      {!ar && <TouchableOpacity onPress={() => { setShowPronunciation(value => !value); setOptions(false); }} style={[ui.row, { backgroundColor: t.inputBackground }]}><Ionicons name="text-outline" size={23} color={t.activeTabColor} /><Text style={{ color: t.textColor }}>{showPronunciation ? 'Hide pronunciation' : 'Show pronunciation'}</Text></TouchableOpacity>}
      <TouchableOpacity onPress={async () => { setOptions(false); try { await Share.share({ message: [title(dua), dua.arabic, meaning.translation, dua.reference].filter(Boolean).join('\n\n') }); } catch { setMessage(ar ? 'تعذرت المشاركة.' : 'Could not open sharing.'); } }} style={[ui.row, { backgroundColor: t.inputBackground }]}><Ionicons name="share-outline" size={23} color={t.activeTabColor} /><Text style={{ color: t.textColor }}>{ar ? 'مشاركة الدعاء' : 'Share Dua'}</Text></TouchableOpacity>
    </OptionSheet>
    <OptionSheet visible={noteOpen} title={ar ? 'ملاحظة شخصية' : 'Personal note'} theme={t} onClose={() => setNoteOpen(false)}>
      <TextInput accessibilityLabel="Personal Dua note" multiline editable={hydrated} value={note} onChangeText={value => onAddNote(dua.id, value, { ...dua, parentCategory: compactCategory(category || dua.parentCategory) })} placeholder={ar ? 'اكتب ما تريد تذكره…' : 'Something you want to remember…'} placeholderTextColor={t.secondaryTextColor} style={{ minHeight: 150, textAlignVertical: 'top', padding: 16, borderRadius: 16, color: t.textColor, backgroundColor: t.inputBackground, fontSize: 16, lineHeight: 25 }} />
      <Text style={{ color: storageError ? t.errorColor : t.secondaryTextColor, fontSize: 12 }}>{storageError || (ar ? 'تُحفظ الملاحظات تلقائياً.' : 'Your note saves automatically.')}</Text>
    </OptionSheet>
  </View>;
}
const styles = StyleSheet.create({ heading: { flexDirection: 'row', alignItems: 'center', gap: 3, padding: 8, flexShrink: 0 }, chips: { gap: 8, paddingHorizontal: 18, paddingVertical: 12 }, chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 18, maxWidth: 190, minWidth: 42, alignItems: 'center' }, reading: { padding: 20, paddingTop: 6, paddingBottom: 28, gap: 22 }, arabicCard: { padding: 20, borderRadius: 23, borderWidth: 1 }, textSection: { gap: 9 }, eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 }, reference: { flexDirection: 'row', gap: 9, borderTopWidth: 1, paddingTop: 15 }, counterDock: { paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: 1, flexShrink: 0 }, counter: { borderRadius: 21, paddingVertical: 13, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, complete: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 } });

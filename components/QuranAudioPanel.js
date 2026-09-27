import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import SheetHandle from './SheetHandle';
import QuranWordChoices from './QuranWordChoices';
import QuranTafsirContent from './QuranTafsirContent';
import { QURAN_RECITERS } from '../data/quranReciters';
import { getReaderChapter, riwayahFor } from '../utils/quranReaderText';
import { loadAyahAudio } from '../services/QuranAudioService';
import { wordClip } from '../utils/quranWordClip';
import { printedReference } from '../utils/printedMushaf';
import { SHEET_SPRING, sheetRevealForDrag, sheetDismissDirection } from '../utils/sheetMotion';

export default function QuranAudioPanel({ audio, mushaf = false, chapterId, selectedKey, selection, sheet, onClose, onSelectWord, onTafsir, onAyahOptions, availableHeight, availableWidth, theme: t, language }) {
  const ar = language === 'ar';
  const [open, setOpen] = useState(false);
  const expanded = open && !sheet;
  const reducedMotion = useReducedMotion();
  const reveal = useSharedValue(0);
  const dragOrigin = useRef(0), handleClosing = useRef(false);
  const window = useWindowDimensions();
  const width = availableWidth || window.width;
  const compactWidth = Math.min(340, Math.max(0, width - (mushaf ? 116 : 24)));
  const expandedWidth = Math.min(400, Math.max(0, width - 24));
  const extraHeight = Math.max(0, Math.min(380, availableHeight - 56));
  useEffect(() => {
    handleClosing.current = !expanded;
    reveal.set(reducedMotion ? Number(expanded) : withSpring(Number(expanded), { ...SHEET_SPRING, overshootClamping: true }));
    return () => cancelAnimation(reveal);
  }, [expanded, reveal, reducedMotion]);
  const cardMotion = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(1, reveal.get()));
    return { width: compactWidth + (expandedWidth - compactWidth) * progress, height: 56 + extraHeight * progress };
  });
  const optionsMotion = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, reveal.get())) }));
  const settleHandle = () => { if (!handleClosing.current) reveal.set(reducedMotion ? Number(expanded) : withSpring(Number(expanded), { ...SHEET_SPRING, overshootClamping: true })); };
  useEffect(() => {
    if (!expanded) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => { setOpen(false); return true; });
    return () => back.remove();
  }, [expanded]);
  const reader = QURAN_RECITERS.find(item => item.id === audio.reciter);
  const target = audio.playingKey || selectedKey || `${chapterId}:1`;
  const targetChapter = Number(target.split(':')[0]);
  const verses = useMemo(() => getReaderChapter(targetChapter, audio.reciter), [targetChapter, audio.reciter]);
  const selected = getReaderChapter(Number((selectedKey || target).split(':')[0]), audio.reciter).find(v => v.key === (selectedKey || target)) || verses[0];
  const shownTarget = mushaf ? printedReference(target, audio.reciter) : target;
  const shownSelection = mushaf ? printedReference(selected.key, audio.reciter) : selected.key;
  const groupedPassage = mushaf && shownSelection.includes('–');
  const range = selection?.key === selected.key && selection.from !== undefined ? selection : null;
  const clipId = `${audio.reciter}/${selected.key}/${range?.from}/${range?.to}`;
  const [clipResult, setClipResult] = useState(null);
  const clipState = clipResult?.id === clipId ? clipResult.status : 'loading';
  useEffect(() => {
    let current = true;
    if (sheet !== 'ayahAudio' || !range) return;
    const task = requestIdleCallback(() => {
      loadAyahAudio(audio.reciter, selected.key).then(plan => { if (current) setClipResult({ id: clipId, status: wordClip(plan, range) ? 'ready' : 'unavailable' }); }).catch(() => { if (current) setClipResult({ id: clipId, status: 'unavailable' }); });
    }, { timeout: 150 });
    return () => { current = false; cancelIdleCallback(task); };
  }, [sheet, range, selected.key, audio.reciter, clipId]);
  const index = Number(target.split(':')[1]) - 1;
  const active = !!audio.playingKey, loading = audio.status === 'loading', playing = audio.status === 'playing';
  const action = loading ? (ar ? 'جارٍ التحميل' : 'Loading') : playing ? (ar ? 'إيقاف مؤقت' : 'Pause') : (ar ? 'تشغيل' : 'Play');
  const scope = active && audio.wordOnly ? (ar ? 'كلمة واحدة' : 'One word') : active && audio.single ? (mushaf && shownTarget.includes('–') ? (ar ? 'آيتان' : 'Two ayahs') : (ar ? 'آية واحدة' : 'One ayah')) : (ar ? 'إلى نهاية السورة' : 'To end of Surah');
  const iconButton = (icon, label, onPress, disabled) => <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} pressRetentionOffset={0} onPress={onPress} style={[styles.icon, { opacity: disabled ? 0.3 : 1 }]}><Ionicons name={icon} size={22} color={t.activeTabColor} /></Pressable>;
  const playSelected = (single, word = null) => { audio.playFrom(selected.key, single, word); onClose(); };
  const script = { fontFamily: riwayahFor(audio.reciter) === 'duri' ? 'QuranDuri' : 'Amiri', color: t.textColor };
  const readerName = ar ? reader.ar : reader.name;
  const playbackLabel = ar ? 'خيارات الاستماع' : 'Listening controls';
  const errorLabel = ar ? 'تعذر تشغيل الصوت. افتح خيارات الاستماع للمحاولة مجدداً.' : 'Audio unavailable. Open listening controls to try again.';
  const playButton = () => <Pressable accessibilityRole="button" accessibilityLabel={`${action} ${shownTarget}`} accessibilityState={{ busy: loading, disabled: loading }} disabled={loading} pressRetentionOffset={0} onPress={() => audio.play(target)} style={({ pressed }) => [styles.play, { backgroundColor: t.activeTabColor, opacity: pressed ? 0.75 : 1 }]}>
    {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name={playing ? 'pause' : 'play'} size={21} color="#fff" />}
  </Pressable>;
  return <>
    {expanded && <Pressable accessibilityRole="button" accessibilityLabel={ar ? 'إغلاق خيارات الاستماع' : 'Close listening options'} onPress={() => setOpen(false)} style={StyleSheet.absoluteFill} />}
    <View pointerEvents="box-none" style={styles.floating}>
      <Animated.View style={[styles.shadow, cardMotion]}>
      <View style={[styles.card, { borderColor: t.separatorColor, backgroundColor: t.cardColor }]}>
        <Animated.View pointerEvents={expanded ? 'auto' : 'none'} accessibilityElementsHidden={!expanded} importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'} style={[styles.expansion, { height: extraHeight }, optionsMotion]}>
          <SheetHandle color={t.secondaryTextColor} ar={ar} onPress={() => setOpen(false)}
            onGrab={() => { cancelAnimation(reveal); dragOrigin.current = reveal.get(); }} onDrag={dy => { if (expanded && !reducedMotion) reveal.set(sheetRevealForDrag(dragOrigin.current, dy, extraHeight)); }}
            onRelease={gesture => { if (sheetDismissDirection(gesture, extraHeight + 56)) { handleClosing.current = true; setOpen(false); } else settleHandle(); }} onCancel={settleHandle} />
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator style={{ flex: 1 }} contentContainerStyle={styles.options}>
            <View style={styles.transport}>
              {iconButton('play-skip-back', ar ? 'الآية السابقة' : 'Previous ayah', () => audio.skip(-1), !active || index === 0 || loading)}
              {iconButton('play-skip-forward', ar ? 'الآية التالية' : 'Next ayah', () => audio.skip(1), !active || index === verses.length - 1 || loading)}
              {iconButton('stop', ar ? 'إيقاف التلاوة' : 'Stop recitation', audio.stop, !active && !loading)}
              {active && <Pressable accessibilityRole="button" accessibilityState={{ selected: audio.follow }} accessibilityLabel={audio.follow ? (ar ? 'إيقاف المتابعة التلقائية' : 'Pause automatic following') : (ar ? 'العودة للتلاوة' : 'Back to recitation')} onPress={() => { audio.setFollow(!audio.follow); setOpen(false); }} style={styles.icon}><Ionicons name={audio.follow ? 'locate' : 'locate-outline'} size={22} color={t.activeTabColor} /></Pressable>}
            </View>
            <Text style={[styles.note, { color: t.secondaryTextColor, textAlign: 'center' }]}>{scope}</Text>
            {!!audio.error && <Text accessibilityRole="alert" style={{ color: t.errorColor }}>{ar ? 'تعذر تشغيل الصوت أو حفظ القارئ. حاول مجدداً أو استمع للآية كاملة.' : audio.error}</Text>}
            {audio.partial && !mushaf && <Text style={[styles.note, { color: t.secondaryTextColor }]}>{ar ? 'تظليل الكلمات غير مكتمل لهذه الآية.' : 'Some word highlights are unavailable for this ayah.'}</Text>}
            <Text accessibilityRole="header" style={{ color: t.textColor, fontSize: 14, fontWeight: '700', marginTop: 6 }}>{ar ? 'اختر القارئ' : 'Choose a reader'}</Text>
            {QURAN_RECITERS.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: item.id === audio.reciter }} pressRetentionOffset={0} onPress={() => audio.chooseReciter(item.id)} style={({ pressed }) => [styles.reader, { borderColor: t.separatorColor, backgroundColor: pressed || item.id === audio.reciter ? t.inputBackground : 'transparent' }]}>
              <View style={{ flex: 1 }}><Text style={{ color: t.textColor, fontSize: 15 }}>{ar ? item.ar : item.name}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 11, marginTop: 3 }}>{ar ? item.countryAr : item.country} · {item.riwayah === 'duri' ? (ar ? 'الدوري عن أبي عمرو' : 'Duri an Abu Amr') : (ar ? 'حفص' : 'Hafs')}</Text></View>
              {item.id === audio.reciter && <Ionicons name="checkmark-circle" color={t.activeTabColor} size={21} />}
            </Pressable>)}
            <Text style={[styles.note, { color: t.secondaryTextColor }]}>{ar ? 'الصوت يحتاج إلى الإنترنت · ' : 'Audio needs internet · '}<Text accessibilityRole="link" style={{ color: t.activeTabColor }} onPress={() => Linking.openURL(reader.everyAyah ? 'https://github.com/cpfair/quran-align' : 'https://huggingface.co/datasets/zaibihassan/Quranic-Recitation-Data').catch(() => {})}>{reader.everyAyah ? 'quran-align · EveryAyah' : 'Mualim'}</Text></Text>
          </ScrollView>
        </Animated.View>
        <View style={[styles.pill, { backgroundColor: t.cardColor }]}>
          {playButton()}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={`${playbackLabel}. ${readerName}. ${shownTarget}${audio.error ? `. ${errorLabel}` : ''}`} accessibilityHint={ar ? 'القارئ والمتابعة والإيقاف' : 'Reader, follow and stop options'} onPress={() => setOpen(value => !value)} pressRetentionOffset={0} style={({ pressed }) => [styles.summary, { opacity: pressed ? 0.65 : 1 }]}>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={{ color: audio.error ? t.errorColor : t.textColor, fontSize: 13, fontWeight: '600' }}>{audio.error ? (ar ? 'حاول مجدداً' : 'Try again') : `${ar ? 'آية' : 'Ayah'} ${shownTarget}`}</Text>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={{ color: t.secondaryTextColor, fontSize: 11 }}>{readerName}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={expanded ? (ar ? 'إغلاق خيارات الاستماع' : 'Close listening options') : (ar ? 'اختيار القارئ وخيارات الاستماع' : 'Choose reader and listening options')} pressRetentionOffset={0} onPress={() => setOpen(value => !value)} style={styles.icon}><Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={19} color={t.secondaryTextColor} /></Pressable>
        </View>
      </View>
      </Animated.View>
    </View>
    <BottomSheet scrollKey={sheet === 'tafsir' ? 'tafsir' : 'actions'} visible={sheet === 'ayahAudio' || sheet === 'tafsir'} height={sheet === 'tafsir' ? '85%' : undefined} title={`${sheet === 'tafsir' ? (ar ? 'التفسير' : 'Tafsir') : (ar ? 'الآية' : 'Ayah')} ${shownSelection}`} subtitle={sheet === 'tafsir' ? undefined : `${ar ? reader.ar : reader.name} · ${shownSelection}`} theme={t} onClose={onClose} language={language}>
      {sheet === 'tafsir' ? <QuranTafsirContent key={`${audio.reciter}/${selected.key}`} verseKey={selected.key} reader={audio.reciter} onBack={onAyahOptions} theme={t} language={language} /> : <>
      <Pressable accessibilityRole="button" onPress={onTafsir} style={[styles.choice, { backgroundColor: t.inputBackground }]}><Ionicons name="book-outline" color={t.activeTabColor} size={24} /><View style={{ flex: 1, gap: 4 }}><Text style={{ color: t.textColor, fontSize: 17, fontWeight: '600' }}>{ar ? 'تفسير الآية' : 'Read Tafsir'}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{ar ? 'شرح الآية · اختر كتاب التفسير' : 'Understand this ayah · Choose a Tafsir source'}</Text></View><Ionicons name={ar ? 'chevron-back' : 'chevron-forward'} color={t.activeTabColor} size={20} /></Pressable>
      {mushaf ? <>
        <Text style={{ color: t.secondaryTextColor }}>{ar ? 'اختر كلمة للاستماع إليها' : 'Choose a word to listen to'}</Text>
        <QuranWordChoices verse={selected} reciter={audio.reciter} range={range} onSelectWord={onSelectWord} theme={t} />
      </> : range ? <Text selectable={false} style={[script, { fontSize: 36, lineHeight: 66, textAlign: 'center' }]}>{selected.text.slice(range.from, range.to)}</Text> : <Text selectable={false} numberOfLines={3} style={[script, { fontSize: 24, lineHeight: 44, textAlign: 'right' }]}>{selected.text}</Text>}
      {range && <Pressable accessibilityRole="button" accessibilityState={{ disabled: clipState !== 'ready' }} disabled={clipState !== 'ready'} onPress={() => playSelected(true, range)} style={[styles.choice, { backgroundColor: t.inputBackground, opacity: clipState === 'ready' ? 1 : 0.6 }]}>{clipState === 'loading' ? <ActivityIndicator color={t.activeTabColor} /> : <Ionicons name="volume-medium-outline" size={24} color={t.activeTabColor} />}<Text style={{ color: t.textColor, flex: 1 }}>{clipState === 'unavailable' ? (ar ? 'لا يتوفر توقيت منفصل لهذه الكلمة' : 'Separate timing is unavailable for this word') : (ar ? 'استمع لهذه الكلمة' : 'Play this word')}</Text></Pressable>}
      <Pressable accessibilityRole="button" onPress={() => playSelected(false)} pressRetentionOffset={0} style={[styles.choice, { backgroundColor: t.activeTabColor }]}><Ionicons name="play" color="#fff" size={24} /><View style={{ flex: 1 }}><Text style={styles.primary}>{groupedPassage ? (ar ? 'استمع من هذا المقطع' : 'Play from this passage') : (ar ? 'استمع من هذه الآية' : 'Play from this ayah')}</Text><Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>{ar ? 'تستمر التلاوة إلى نهاية السورة' : 'Continues to the end of this Surah'}</Text></View></Pressable>
      <Pressable accessibilityRole="button" onPress={() => playSelected(true)} pressRetentionOffset={0} style={[styles.choice, { backgroundColor: t.inputBackground }]}><Ionicons name="play-circle-outline" color={t.activeTabColor} size={24} /><Text style={{ color: t.textColor, fontSize: 16, flex: 1 }}>{groupedPassage ? (ar ? 'استمع لهاتين الآيتين' : 'Play these two ayahs') : (ar ? 'استمع لهذه الآية فقط' : 'Play this ayah only')}</Text></Pressable>
      </>}
    </BottomSheet>
  </>;
}
const styles = StyleSheet.create({
  floating: { position: 'absolute', bottom: 2, left: 0, right: 0, alignItems: 'center' },
  card: { flex: 1, borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  expansion: { position: 'absolute', top: 0, left: 0, right: 0 },
  pill: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 54, padding: 3, flexDirection: 'row', alignItems: 'center' },
  options: { paddingHorizontal: 12, paddingBottom: 12, gap: 4 },
  shadow: { borderRadius: 28, boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.14)' },
  summary: { flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 8, justifyContent: 'center', gap: 2 },
  transport: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  play: { width: 48, height: 48, flexShrink: 0, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  choice: { minHeight: 60, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  primary: { color: '#fff', fontSize: 17, fontWeight: '700' },
  reader: { minHeight: 56, padding: 10, borderBottomWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  note: { fontSize: 11, lineHeight: 16 },
});

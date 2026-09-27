import React, { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator, TextInput, Switch } from 'react-native';
import BottomSheet from './BottomSheet';
import { Ionicons } from '@expo/vector-icons';
import InteractiveMushaf from './InteractiveMushaf';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QuranTextPager from './QuranTextPager';
import BookmarkManager from './BookmarkManager';
import chapters from '../data/quran/chapters.json';
import { getQuranPage, getQuranChapter } from '../utils/quranData';
import { canonicalReference, readerReference, riwayahFor, getReaderChapter } from '../utils/quranReaderText';
import { printedPageForAyah, firstPrintedReference } from '../utils/printedMushaf';
import duriCounts from '../data/quran/duri-counts.json';
import useAyahAudio from '../hooks/useAyahAudio';
import QuranAudioPanel from './QuranAudioPanel';
import QuranJumpSheet from './QuranJumpSheet';
import { juzForNativeVerse, resolveReaderPosition, verseDestination } from '../utils/quranNavigation';

const MODES = [
  { id: 'mushaf', label: 'Mushaf', ar: 'المصحف', icon: 'book-outline', description: 'Printed Mushaf pages. Hold an ayah for Tafsir or listening.', descriptionAr: 'صفحات المصحف المطبوع. اضغط مطولاً على آية للتفسير أو الاستماع.' },
  { id: 'flow', label: 'Flowing text', ar: 'نص متصل', icon: 'reader-outline', description: 'Continuous Arabic with adjustable text size and room to read.' },
  { id: 'verses', label: 'Ayah by ayah', ar: 'آية بآية', icon: 'list-outline', description: 'Individual verses with an optional English translation.' },
];
const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/[\s'’-]/g, '');
const pageNumber = value => Math.max(1, Math.min(604, Math.round(Number(value) || 1)));
const bookmarkColor = value => typeof value === 'string' ? value : value?.color;

function Sheet(props) { return <BottomSheet {...props} />; }

export default function QuranReader({ themeColors: t, language = 'en' }) {
  const ar = language === 'ar';
  const [screen, setScreen] = useState('library');
  const [libraryTab, setLibraryTab] = useState('surahs');
  const [mode, setMode] = useState('mushaf');
  const [draftMode, setDraftMode] = useState('mushaf');
  const readingMode = useDeferredValue(mode);
  const [fontSize, setFontSize] = useState(30);
  const [translation, setTranslation] = useState(true);
  const [page, setPage] = useState(1);
  const [chapterId, setChapterId] = useState(1);
  const [verseKey, setVerseKey] = useState('1:1');
  const [nativePosition, setNativePosition] = useState(null);
  const [readingSession, setReadingSession] = useState(0);
  const [audioKey, setAudioKey] = useState(null);
  const [jumpKey, setJumpKey] = useState(null);
  const audio = useAyahAudio({ enabled: screen === 'reading', chapterId, layout: mode });
  const riwayah = riwayahFor(audio.reciter);
  const nativeVerseKey = useMemo(() => resolveReaderPosition(verseKey, riwayah, nativePosition), [verseKey, riwayah, nativePosition]);
  const rememberNativeVerse = useCallback(key => setNativePosition(previous => previous?.key === key && previous.reader === riwayah ? previous : { key, reader: riwayah }), [riwayah]);
  const [selection, setSelection] = useState(null);
  useEffect(() => { setAudioKey(null); setSelection(null); setJumpKey(null); }, [riwayah]);
  useEffect(() => { if (audio.playingKey) setJumpKey(null); }, [audio.playingKey]);
  const [bookmarks, setBookmarks] = useState({});
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState(null);
  const setAudioFollow = audio.setFollow;
  const holdAyah = useCallback((key, range) => { setAudioFollow(false); setAudioKey(key); setJumpKey(null); setSelection({ key, ...(range || {}) }); setSheet('ayahAudio'); }, [setAudioFollow]);
  const manualAudioScroll = useCallback(() => { setAudioFollow(false); setAudioKey(null); setSelection(null); setJumpKey(null); }, [setAudioFollow]);
  const [error, setError] = useState('');
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const preferenceWrite = useRef(Promise.resolve());
  useEffect(() => {
    if (readingMode !== 'mushaf' || !audio.playingKey || !audio.follow) return;
    setPage(current => printedPageForAyah(audio.playingKey, riwayah, current) || current);
    setChapterId(Number(audio.playingKey.split(':')[0])); setVerseKey(canonicalReference(audio.playingKey, riwayah));
    rememberNativeVerse(audio.playingKey);
  }, [readingMode, audio.playingKey, audio.follow, riwayah, rememberNativeVerse]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const values = await AsyncStorage.multiGet(['quranReaderPreferences', 'quranBookmarks']);
        const parse = text => { try { return JSON.parse(text || '{}') || {}; } catch { return {}; } };
        const prefs = parse(values[0][1]);
        const saved = parse(values[1][1]);
        if (!active) return;
        if (MODES.some(item => item.id === prefs.mode)) setMode(prefs.mode);
        if (Number.isFinite(prefs.fontSize)) setFontSize(Math.max(24, Math.min(44, prefs.fontSize)));
        setTranslation(prefs.translation !== false); setPage(pageNumber(prefs.page));
        const savedChapter = chapters.some(item => item.id === prefs.chapterId) ? prefs.chapterId : getQuranPage(pageNumber(prefs.page))[0].chapter;
        const chapterVerses = getQuranChapter(savedChapter);
        setChapterId(savedChapter);
        setVerseKey(chapterVerses.find(verse => verse.key === prefs.verseKey)?.key || chapterVerses.find(verse => verse.page >= pageNumber(prefs.page))?.key || chapterVerses[0].key);
        setNativePosition(prefs.nativePosition || null);
        setBookmarks(Object.fromEntries(Object.entries(saved).filter(([key, value]) => /^\d+$/.test(key) && Number(key) >= 1 && Number(key) <= 604 && typeof bookmarkColor(value) === 'string')));
      } catch { if (active) setError('Reading preferences could not be loaded. Your Quran is still available.'); }
      finally { if (active) setReady(true); }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const value = JSON.stringify({ mode, fontSize, translation, page, chapterId, verseKey, nativePosition: { key: nativeVerseKey, reader: riwayah } });
    preferenceWrite.current = preferenceWrite.current.catch(() => {}).then(() => AsyncStorage.setItem('quranReaderPreferences', value))
      .catch(() => setError('Your reading position could not be saved.'));
  }, [ready, mode, fontSize, translation, page, chapterId, verseKey, nativeVerseKey, riwayah]);
  const juz = useMemo(() => juzForNativeVerse(nativeVerseKey, riwayah), [nativeVerseKey, riwayah]);
  const chapter = chapters.find(item => item.id === chapterId) || chapters[0];
  const chapterTitle = item => ar ? item.name_arabic : item.name_simple;
  const currentMode = MODES.find(item => item.id === mode);
  const results = useMemo(() => chapters.filter(item => normalize(`${item.id} ${item.name_simple} ${item.name_arabic} ${item.translated_name.name}`).includes(normalize(query))), [query]);
  const openPage = (next, selectedChapter, anchor, nativeAnchor) => {
    audio.stop(); setAudioKey(null); setSelection(null);
    setJumpKey(nativeAnchor || null);
    const target = pageNumber(next);
    const reference = mode === 'mushaf' ? firstPrintedReference(target, riwayah) : null;
    const id = selectedChapter || (reference ? Number(reference.split(':')[0]) : getQuranPage(target)[0].chapter);
    const entries = getQuranChapter(id);
    const canonicalKey = anchor || (reference && !selectedChapter ? canonicalReference(reference, riwayah) : (entries.find(verse => verse.page >= target) || entries[0]).key);
    setPage(target); setChapterId(id); setVerseKey(canonicalKey);
    rememberNativeVerse(nativeAnchor || (reference && !selectedChapter ? reference : readerReference(canonicalKey, riwayah)));
    setReadingSession(value => value + 1); setScreen('reading'); setSheet(null);
  };
  const changePage = next => {
    manualAudioScroll();
    const target = pageNumber(next), key = firstPrintedReference(target, riwayah);
    setPage(target);
    if (key) { setChapterId(Number(key.split(':')[0])); setVerseKey(canonicalReference(key, riwayah)); rememberNativeVerse(key); }
  };
  const jumpTo = destination => { if (destination) openPage(destination.page, destination.chapter, destination.canonicalKey, destination.nativeKey); };
  const nextSurah = id => jumpTo(verseDestination(`${id}:1`, riwayah, mode));
  const previousSurah = id => jumpTo(verseDestination(getReaderChapter(id, riwayah).at(-1).key, riwayah, mode));
  const changeTextChapter = (id, verse) => {
    // A gesture hands off to an already mounted list; only explicit jumps start a new session.
    audio.stop(); setChapterId(id); setPage(verse.page); setVerseKey(canonicalReference(verse.key, riwayah)); setAudioKey(null); setSelection(null);
    rememberNativeVerse(verse.key);
  };
  const visibleVerse = useCallback(verse => { setPage(verse.page); setVerseKey(canonicalReference(verse.key, riwayah)); rememberNativeVerse(verse.key); }, [riwayah, rememberNativeVerse]);
  const openReadingOptions = () => { setDraftMode(mode); setSheet('options'); };
  const openSurahPicker = () => setSheet('surahs');
  const saveBookmark = async (target, color) => {
    if (savingBookmark) return;
    setSavingBookmark(true); setError('');
    try {
      const saved = color ? await BookmarkManager.saveBookmark(target, color, bookmarks[target]?.label || '') : await BookmarkManager.removeBookmark(target);
      setBookmarks(saved);
    } catch { setError('Could not save the bookmark. Please try again.'); }
    finally { setSavingBookmark(false); }
  };
  const icon = (name, label, action, color = t.textColor) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={action} style={styles.iconButton}><Ionicons name={name} size={23} color={color} /></TouchableOpacity>;
  if (!ready) return <View style={styles.center}><ActivityIndicator color={t.activeTabColor} /></View>;
  return <View style={[styles.screen, { backgroundColor: t.backgroundColor }]}>
    {screen === 'library' ? <>
      <View style={styles.libraryHeader}><View><Text style={[styles.title, { color: t.textColor }]}>{ar ? 'القرآن الكريم' : 'Quran'}</Text><Text style={{ color: t.secondaryTextColor, marginTop: 4 }}>{ar ? 'مساحة للتلاوة والتدبر' : 'A little time to read and reflect'}</Text></View>{icon('list-outline', ar ? 'الجزء والسورة والآية' : 'Choose Juz, Surah and ayah', openSurahPicker, t.activeTabColor)}</View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Continue reading page ${page}`} onPress={() => setScreen('reading')} style={styles.resumeWrap}>
        <LinearGradient colors={t.isDark ? ['#244C3D', '#17392D'] : ['#2C7757', '#15523A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resume}>
          <View style={{ flex: 1, gap: 7 }}><Text style={styles.eyebrow}>{ar ? 'متابعة القراءة' : 'CONTINUE READING'}</Text><Text style={styles.resumeTitle}>{chapterTitle(chapter)}</Text><Text style={styles.resumeDetail}>{ar ? 'صفحة' : 'Page'} {page} · {ar ? 'الجزء' : 'Juz'} {juz} · {ar ? currentMode.ar : currentMode.label}</Text></View><Ionicons name="arrow-forward" color="#fff" size={25} />
        </LinearGradient>
      </TouchableOpacity>
      <View style={[styles.libraryTabs, { borderBottomColor: t.separatorColor }]}>{[['surahs', ar ? 'السور' : 'Surahs'], ['saved', ar ? 'العلامات' : 'Bookmarks']].map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="tab" accessibilityState={{ selected: libraryTab === id }} onPress={() => setLibraryTab(id)} style={[styles.libraryTab, libraryTab === id && { borderBottomColor: t.activeTabColor, borderBottomWidth: 3 }]}><Text style={{ color: libraryTab === id ? t.activeTabColor : t.secondaryTextColor, fontSize: 16, fontWeight: '600' }}>{label}{id === 'saved' ? ` · ${Object.keys(bookmarks).length}` : ''}</Text></TouchableOpacity>)}</View>
      {libraryTab === 'surahs' ? <>
        <View style={[styles.search, { backgroundColor: t.inputBackground }]}><Ionicons name="search" color={t.secondaryTextColor} size={20} /><TextInput accessibilityLabel="Search Quran surahs" placeholder={ar ? 'ابحث بالاسم أو رقم السورة' : 'Search by name or surah number'} placeholderTextColor={t.secondaryTextColor} value={query} onChangeText={setQuery} style={[styles.searchInput, { color: t.textColor }]} />{!!query && icon('close', 'Clear surah search', () => setQuery(''))}</View>
        <FlatList data={results} keyboardShouldPersistTaps="handled" keyExtractor={item => String(item.id)} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          ListEmptyComponent={<Text style={[styles.empty, { color: t.secondaryTextColor }]}>No matching surahs. Try another name or number.</Text>}
          renderItem={({ item }) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Read ${item.name_simple}`} onPress={() => nextSurah(item.id)} style={[styles.surahRow, { borderBottomColor: t.separatorColor }]}>
            <View style={[styles.number, { backgroundColor: t.inputBackground }]}><Text style={{ color: t.activeTabColor, fontWeight: '700' }}>{item.id}</Text></View>
            <View style={{ flex: 1, gap: 5 }}><Text style={{ color: t.textColor, fontWeight: '600', fontSize: 16 }}>{item.name_simple}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{riwayah === 'duri' ? duriCounts[item.id - 1] : item.verses_count} ayahs · Page {item.pages[0]}</Text></View>
            <Text style={{ color: t.activeTabColor, fontFamily: 'Amiri', fontSize: 24, maxWidth: '37%' }}>{item.name_arabic}</Text>
          </TouchableOpacity>} />
      </> : <FlatList data={Object.entries(bookmarks).sort(([a], [b]) => Number(a) - Number(b))} keyExtractor={([key]) => key} contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="bookmark-outline" size={32} color={t.activeTabColor} /><Text style={{ color: t.textColor, fontSize: 18, marginTop: 14 }}>Keep a page close</Text><Text style={{ color: t.secondaryTextColor, textAlign: 'center', lineHeight: 23, marginTop: 8 }}>Tap the bookmark while reading to save your place here.</Text></View>}
        renderItem={({ item: [key, value] }) => <View style={[styles.surahRow, { borderBottomColor: t.separatorColor }]}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open bookmarked page ${key}`} onPress={() => { openPage(key); BookmarkManager.updateLastVisited(key); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 }}><Ionicons name="bookmark" size={25} color={bookmarkColor(value)} /><View><Text style={{ color: t.textColor, fontSize: 17 }}>{chapterTitle(chapters[getQuranPage(Number(key))[0].chapter - 1])}</Text><Text style={{ color: t.secondaryTextColor, marginTop: 6 }}>Page {key}{value.label ? ` · ${value.label}` : ''}</Text></View></TouchableOpacity>{icon('close', `Remove bookmark on page ${key}`, () => saveBookmark(key, null))}</View>} />}
    </> : <>
      <View style={[styles.readerHeader, { borderBottomColor: t.separatorColor }]}>
        {icon('arrow-back', 'Back to Quran library', () => setScreen('library'))}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={ar ? 'اختر الجزء والسورة والآية' : 'Choose Juz, Surah and ayah'} onPress={openSurahPicker} style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: t.textColor, fontSize: 18, fontWeight: '700' }}>{chapterTitle(chapter)} ▾</Text><Text style={{ color: t.secondaryTextColor, fontSize: 12, marginTop: 3 }}>{ar ? 'الجزء' : 'Juz'} {juz} · {page} / 604</Text></TouchableOpacity>
        {icon(bookmarks[page] ? 'bookmark' : 'bookmark-outline', bookmarks[page] ? 'Remove page bookmark' : 'Bookmark this page', () => saveBookmark(page, bookmarks[page] ? null : '#D69E36'), bookmarkColor(bookmarks[page]) || t.activeTabColor)}
        {icon('options-outline', 'Reading options', openReadingOptions)}
      </View>
      <View style={styles.readerModeRow}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Reading layout: ${currentMode.label}. Change layout`} onPress={openReadingOptions} style={[styles.modePill, { backgroundColor: t.inputBackground }]}><Ionicons name={currentMode.icon} size={16} color={t.activeTabColor} /><Text style={{ color: t.textColor, fontSize: 13 }}>{ar ? currentMode.ar : currentMode.label}</Text><Ionicons name="chevron-down" size={13} color={t.secondaryTextColor} /></TouchableOpacity>
        {mode !== 'mushaf' && <View style={[styles.zoomControls, { backgroundColor: t.inputBackground }]}>
          {[-1, 0, 1].map(direction => {
            const disabled = direction < 0 ? fontSize <= 24 : direction > 0 ? fontSize >= 44 : false;
            const label = direction === 0 ? (ar ? 'حجم النص الافتراضي' : 'Default text size') : direction < 0 ? (ar ? 'تصغير النص' : 'Smaller text') : (ar ? 'تكبير النص' : 'Larger text');
            return <Pressable key={direction} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} accessibilityValue={{ text: `${fontSize}` }} disabled={disabled} pressRetentionOffset={0}
              onPress={() => setFontSize(value => direction ? Math.max(24, Math.min(44, value + direction * 2)) : 30)}
              style={({ pressed }) => [styles.zoom, { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 }]}>
              {direction ? <Ionicons name={direction < 0 ? 'remove' : 'add'} size={21} color={t.activeTabColor} /> : <Text maxFontSizeMultiplier={1.3} style={{ color: t.secondaryTextColor, fontSize: 11, fontWeight: '600' }}>{fontSize}</Text>}
            </Pressable>;
          })}
        </View>}
      </View>
      <View style={styles.readingArea} onLayout={e => { setPageWidth(e.nativeEvent.layout.width); setPageHeight(e.nativeEvent.layout.height); }}>
        {readingMode === 'mushaf' ? pageWidth > 0 && <InteractiveMushaf key={`${readingSession}-${riwayah}`} page={page} width={pageWidth} height={pageHeight} follow={audio.follow} onManualScroll={manualAudioScroll} riwayah={riwayah} theme={t} language={language} playingKey={audio.playingKey} selection={(sheet === 'ayahAudio' || sheet === 'tafsir') ? selection : jumpKey ? { key: jumpKey } : null} onHold={holdAyah} onPageChange={changePage} previous={page <= chapter.pages[0] ? chapters[chapterId - 2] : null} next={page >= chapter.pages.at(-1) ? chapters[chapterId] : null} onPrevious={previousSurah} onNext={nextSurah} /> : <QuranTextPager key={`${readingSession}-${readingMode}-${riwayah}`} chapterId={chapterId} anchorVerse={nativeVerseKey} riwayah={riwayah} height={pageHeight} width={pageWidth} bottomInset={64} mode={readingMode} fontSize={fontSize} translation={translation} themeColors={t} language={language} playingKey={audio.playingKey} activeWord={audio.word} followWord={audio.lastWord} selection={(sheet === 'ayahAudio' || sheet === 'tafsir') ? selection : jumpKey ? { key: jumpKey } : null} followAudio={audio.follow} onManualScroll={manualAudioScroll} onHoldAyah={holdAyah} onVerseVisible={visibleVerse} onChapterChange={changeTextChapter} />}
        <QuranAudioPanel availableHeight={pageHeight} availableWidth={pageWidth} mushaf={readingMode === 'mushaf'} audio={audio} chapterId={chapterId} selectedKey={audioKey || nativeVerseKey} selection={selection} sheet={sheet} onClose={() => setSheet(null)} onSelectWord={holdAyah} onTafsir={() => setSheet('tafsir')} onAyahOptions={() => setSheet('ayahAudio')} theme={t} language={language} />
      </View>
    </>}
    {!!error && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Dismiss reading message" onPress={() => setError('')} style={{ padding: 10 }}><Text style={{ color: t.errorColor }}>{error}</Text></TouchableOpacity>}
    <QuranJumpSheet visible={sheet === 'surahs' || sheet === 'jump'} initialTab={sheet === 'jump' ? 'page' : 'surahs'} onClose={() => setSheet(null)} onJump={jumpTo} theme={t} language={language} reader={riwayah} mode={mode} nativeKey={nativeVerseKey} page={page} />
    <Sheet visible={sheet === 'options'} title={ar ? 'خيارات القراءة' : 'Make it yours'} onClose={() => setSheet(null)} theme={t}>
      <Text style={{ color: t.secondaryTextColor, lineHeight: 22, marginBottom: 6 }}>Swipe right for the next Mushaf page, left for the previous. Tap the Surah name to jump directly. Pull down at the beginning for the previous Surah, or up at the end for the next.</Text>
      {MODES.map(item => <TouchableOpacity key={item.id} accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{ checked: draftMode === item.id }} onPress={() => { setDraftMode(item.id); }} style={[styles.modeCard, { borderColor: draftMode === item.id ? t.activeTabColor : t.separatorColor, backgroundColor: draftMode === item.id ? t.inputBackground : 'transparent' }]}>
        <Ionicons name={item.icon} color={t.activeTabColor} size={25} /><View style={{ flex: 1, gap: 5 }}><Text style={{ color: t.textColor, fontSize: 17, fontWeight: '600' }}>{ar ? item.ar : item.label}</Text><Text style={{ color: t.secondaryTextColor, fontSize: 13, lineHeight: 20 }}>{ar && item.descriptionAr ? item.descriptionAr : item.description}</Text></View>{draftMode === item.id && <Ionicons name="checkmark-circle" size={22} color={t.activeTabColor} />}
      </TouchableOpacity>)}
      {draftMode !== 'mushaf' && <View style={styles.sizeRow}><Text style={{ color: t.textColor, flex: 1 }}>Arabic text size</Text>{icon('remove', 'Decrease Quran text size', () => setFontSize(value => Math.max(24, value - 2)))}<Text style={{ color: t.textColor }}>{fontSize}</Text>{icon('add', 'Increase Quran text size', () => setFontSize(value => Math.min(44, value + 2)))}</View>}
      {draftMode === 'verses' && riwayah !== 'duri' && <View style={styles.sizeRow}><Text style={{ color: t.textColor, flex: 1 }}>English translation</Text><Switch accessibilityLabel="Show English translation" value={translation} onValueChange={setTranslation} /></View>}
      {draftMode === 'verses' && riwayah === 'duri' && <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{ar ? 'الترجمة الإنجليزية غير مرتبطة بعد بترقيم آيات الدوري.' : 'English translation is not yet mapped to Duri ayah boundaries.'}</Text>}
      {!!bookmarks[page] && <View style={styles.sizeRow}><Text style={{ color: t.textColor, flex: 1 }}>Bookmark color</Text>{['#D69E36', '#509272', '#6E78B5', '#CC7184'].map(color => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Bookmark color ${color}`} key={color} onPress={() => saveBookmark(page, color)} style={{ backgroundColor: color, width: 32, height: 32, borderRadius: 16, marginLeft: 8, borderWidth: bookmarkColor(bookmarks[page]) === color ? 3 : 0, borderColor: t.textColor }} />)}</View>}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go to Quran page" onPress={() => setSheet('jump')} style={styles.iconButton}><Text style={{ color: t.activeTabColor }}>Go to page · {page} / 604</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => { setSheet(null); startTransition(() => { if (draftMode === 'mushaf' && mode !== 'mushaf') setPage(printedPageForAyah(nativeVerseKey, riwayah, page) || page); setMode(draftMode); }); }} style={[styles.done, { backgroundColor: t.activeTabColor }]}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{ar ? 'متابعة القراءة' : 'Continue reading'}</Text></TouchableOpacity>
    </Sheet>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  libraryHeader: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 30, fontWeight: '700' },
  resumeWrap: { marginHorizontal: 20, borderRadius: 22, overflow: 'hidden', marginBottom: 20 }, resume: { padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16 }, eyebrow: { color: '#C8E4D6', fontSize: 10, letterSpacing: 1.6, fontWeight: '700' }, resumeTitle: { color: '#fff', fontSize: 25, fontWeight: '600' }, resumeDetail: { color: '#D5E9DF', fontSize: 12 },
  libraryTabs: { flexDirection: 'row', marginHorizontal: 20, borderBottomWidth: 1, gap: 24 }, libraryTab: { paddingVertical: 13, paddingHorizontal: 4 },
  search: { marginHorizontal: 20, marginVertical: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 14 }, searchInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, minWidth: 0, fontSize: 14 },
  surahRow: { minHeight: 86, paddingVertical: 14, flexDirection: 'row', gap: 16, alignItems: 'center', borderBottomWidth: 1 }, number: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 32 }, readerHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 5, paddingHorizontal: 4 }, iconButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', padding: 10 },
  readerModeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4 }, modePill: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 7, paddingHorizontal: 12, borderRadius: 24 }, zoomControls: { flexDirection: 'row', borderRadius: 24 }, zoom: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }, readingArea: { flex: 1, overflow: 'hidden' },
  pageNavigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingHorizontal: 10, paddingVertical: 5 }, pageButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6 },
  scrim: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }, sheet: { maxHeight: '88%', borderTopLeftRadius: 26, borderTopRightRadius: 26 }, sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 18 }, sectionTitle: { fontSize: 24, fontWeight: '700' }, sheetContent: { padding: 22, paddingTop: 8, gap: 12 }, modeCard: { flexDirection: 'row', gap: 16, alignItems: 'center', borderWidth: 1.5, borderRadius: 17, padding: 16 }, sizeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 }, done: { alignItems: 'center', padding: 17, borderRadius: 15, marginTop: 10 }, jumpInput: { fontSize: 26, textAlign: 'center', padding: 18, borderRadius: 14 },
});

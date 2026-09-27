import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import QuranTextRow, { verseMarker as marker, groupText } from './QuranTextRow';
import { createSeekBudget, pullBoundary, groupReaderVerses, visibleReaderVerse } from '../utils/quranReaderScroll';
import { NativeViewGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import { getReaderChapter } from '../utils/quranReaderText';
import { locateTextLine, followOffset } from '../utils/quranFollow';
import chapters from '../data/quran/chapters.json';

const PULL_THRESHOLD = 64;
const MAX_PULL_OFFSET = 72;
const PULL_RESISTANCE = 110;
const rubberBandOffset = distance => MAX_PULL_OFFSET * distance / (PULL_RESISTANCE + distance);
export default function QuranTextPage({ chapterId, anchorVerse, mode, fontSize, translation, themeColors: t, language, active, blocked, onPull, onCancelPull, onNavigate, onReady, onVerseVisible, onHoldAyah, playingKey, activeWord, followWord, selection, followAudio, onManualScroll, riwayah, bottomInset = 0 }) {
  const list = useRef(null);
  const panHandler = useRef(null), scrollHandler = useRef(null);
  const restore = useRef({ timer: null, ready: false, interacted: false, manual: false, started: false });
  const initialSeek = useRef(createSeekBudget(8)), audioSeek = useRef(createSeekBudget(6));
  const [prepared, setPrepared] = useState(false);
  const visibleRows = useRef(new Set());
  const callback = useRef({ onVerseVisible, onReady });
  const metrics = useRef({ height: 0, content: 0, offset: 0 });
  const [edge, setEdge] = useState(null);
  const gesture = useRef({ direction: null, origin: 0, distance: 0, last: 0 });
  const transitioning = useRef(false);
  const ar = language === 'ar';
  const chapter = chapters[chapterId - 1], next = chapters[chapterId], previous = chapters[chapterId - 2];
  const verses = useMemo(() => getReaderChapter(chapterId, riwayah), [chapterId, riwayah]);
  const [initialAnchor] = useState(anchorVerse);
  const groups = useMemo(() => groupReaderVerses(verses, mode, initialAnchor), [verses, mode, initialAnchor]);
  const [initialIndex] = useState(() => Math.max(0, groups.findIndex(group => group.some(verse => verse.key === initialAnchor))));
  const awaitingIndex = useRef(initialIndex);
  const audioScroll = useRef({ timer: null });
  const cells = useRef(new Map()), textLayouts = useRef(new Map());
  const [layoutVersion, setLayoutVersion] = useState(0);
  const followIndex = active && playingKey && followAudio ? groups.findIndex(group => group.some(verse => verse.key === playingKey)) : -1;
  const following = useRef(-1), layoutFrame = useRef(null);
  useLayoutEffect(() => { following.current = followIndex; }, [followIndex]);
  const lastFollow = useRef({ key: null, target: null });
  const changedLayout = useCallback(index => {
    // Ordinary list measurement must not re-render the entire Surah. Only the
    // currently followed row can ask the audio effect to recheck its geometry.
    if (following.current !== index || layoutFrame.current !== null) return;
    layoutFrame.current = requestAnimationFrame(() => { layoutFrame.current = null; setLayoutVersion(v => v + 1); });
  }, []);
  const recordTextLayout = useCallback((index, value) => {
    const previous = textLayouts.current.get(index), nextValue = { ...previous, ...value };
    if (JSON.stringify(previous) === JSON.stringify(nextValue)) return;
    textLayouts.current.set(index, nextValue); changedLayout(index);
  }, [changedLayout]);
  const [Cell] = useState(() => function ReaderCell({ index, onLayout, style, children, onFocusCapture }) {
    return <View style={style} onFocusCapture={onFocusCapture} onLayout={event => {
      const { y, height } = event.nativeEvent.layout, old = cells.current.get(index);
      cells.current.set(index, { y, height }); onLayout?.(event);
      if (!old || old.y !== y || old.height !== height) changedLayout(index);
    }}>{children}</View>;
  });
  const markReady = useCallback(() => {
    if (restore.current.ready) return;
    restore.current.ready = true; clearTimeout(restore.current.timer); initialSeek.current.cancel();
    setPrepared(true); callback.current.onReady();
  }, []);
  useEffect(() => { const pending = restore.current, listening = audioScroll.current; return () => {
    clearTimeout(pending.timer); clearTimeout(listening.timer);
    if (layoutFrame.current !== null) cancelAnimationFrame(layoutFrame.current);
  }; }, []);
  useEffect(() => {
    const pending = audioScroll.current;
    if (!active || !playingKey || !followAudio) { clearTimeout(pending.timer); audioSeek.current.cancel(); lastFollow.current = { key: null, target: null }; return; }
    const index = groups.findIndex(group => group.some(verse => verse.key === playingKey));
    if (index < 0) return;
    if (!restore.current.ready) awaitingIndex.current = index;
    clearTimeout(restore.current.timer); restore.current.interacted = true;
    const group = groups[index], cell = cells.current.get(index), measured = textLayouts.current.get(index);
    let offset = 0;
    for (const verse of group) { if (verse.key === playingKey) break; offset += verse.text.length + marker(verse).length + 2; }
    const line = measured && locateTextLine(measured.lines, groupText(group), offset + (followWord?.from || 0));
    if (cell && measured && line) {
      clearTimeout(pending.timer); audioSeek.current.cancel();
      const top = cell.y + measured.y + line.y;
      const target = followOffset({ ...metrics.current, height: Math.max(1, metrics.current.height - bottomInset), top, bottom: top + line.height });
      if (target !== null && (lastFollow.current.target === null || Math.abs(lastFollow.current.target - target) > 2)) {
        list.current?.scrollToOffset({ offset: target, animated: true }); lastFollow.current.target = target;
      }
      lastFollow.current.key = playingKey;
    } else if (audioSeek.current.target() !== index) {
      audioSeek.current.begin(index);
      list.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 });
    }
  }, [playingKey, followWord, active, groups, followAudio, layoutVersion, bottomInset]);
  const restorePosition = ({ index, averageItemLength }) => {
    const pending = audioScroll.current;
    if (audioSeek.current.target() === index) {
      if (!audioSeek.current.retry(index)) return;
      list.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
      clearTimeout(pending.timer);
      pending.timer = setTimeout(() => {
        if (audioSeek.current.target() === index && following.current === index) list.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 });
      }, 160);
      return;
    }
    if (restore.current.ready || restore.current.interacted || index !== initialIndex) return;
    initialSeek.current.begin(index);
    if (!initialSeek.current.retry(index)) { markReady(); return; }
    list.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
    clearTimeout(restore.current.timer);
    restore.current.timer = setTimeout(() => {
      if (!restore.current.ready && !restore.current.interacted) list.current?.scrollToIndex({ index, animated: false });
    }, 160);
  };
  const prepareInitialPosition = () => {
    // Measure cell zero first: native viewability needs it even when seeking the previous Surah's end.
    const pending = restore.current;
    if (!initialIndex || pending.started || pending.ready || pending.interacted || !metrics.current.height || !metrics.current.content) return;
    pending.started = true;
    list.current?.scrollToIndex({ index: initialIndex, animated: false });
  };
  useLayoutEffect(() => { callback.current = { onVerseVisible, onReady }; }, [onVerseVisible, onReady]);
  useEffect(() => {
    if (!blocked) transitioning.current = false;
  }, [blocked]);
  const [onViewableItemsChanged] = useState(() => ({ viewableItems }) => {
    const visible = viewableItems.filter(item => item.isViewable);
    visibleRows.current = new Set(visible.map(item => item.index));
    if (!restore.current.ready) {
      if (!restore.current.manual && !visible.some(item => item.index === awaitingIndex.current)) return;
      markReady();
    }
    const verse = visibleReaderVerse(visible.map(item => item.item), initialAnchor, !restore.current.interacted);
    if (verse) callback.current.onVerseVisible(verse);
  });
  const beginReadingGesture = () => {
    clearTimeout(audioScroll.current.timer); audioSeek.current.cancel();
    // A late restoration retry must never move a list the reader is already scrolling.
    restore.current.interacted = true; restore.current.manual = true; clearTimeout(restore.current.timer);
    if (!restore.current.ready) markReady();
  };
  const advance = direction => {
    const target = direction === 'previous' ? previous : next;
    if (!target || transitioning.current) return;
    transitioning.current = true; setEdge(null);
    onNavigate(direction);
  };
  const trackPull = ({ nativeEvent: e }) => {
    if (!active || blocked || transitioning.current) return;
    const g = gesture.current, m = metrics.current, delta = e.translationY - g.last;
    g.last = e.translationY;
    if (!g.direction) {
      if (Math.abs(delta) < 0.5) return;
      const last = cells.current.get(groups.length - 1);
      const direction = pullBoundary({ ...m, delta, firstVisible: visibleRows.current.has(0), lastVisible: visibleRows.current.has(groups.length - 1), lastBottom: last ? last.y + last.height : null, previous, next });
      if (!direction) return;
      // Start measuring at the boundary, excluding the distance spent scrolling.
      g.direction = direction; g.origin = e.translationY; g.distance = 0;
      onPull(0, 0, direction); setEdge(direction);
    }
    g.distance = Math.max(0, (e.translationY - g.origin) * (g.direction === 'previous' ? 1 : -1));
    onPull(rubberBandOffset(g.distance) * (g.direction === 'previous' ? 1 : -1), g.distance, g.direction);
  };
  const pullStateChanged = ({ nativeEvent: e }) => {
    if (!active || transitioning.current) return;
    if (e.state === State.BEGAN) { beginReadingGesture(); gesture.current = { direction: null, origin: 0, distance: 0, last: 0 }; return; }
    if (![State.END, State.CANCELLED, State.FAILED].includes(e.state)) return;
    if (e.state === State.END && gesture.current.direction && gesture.current.distance >= PULL_THRESHOLD) advance(gesture.current.direction);
    else {
      setEdge(null);
      onCancelPull();
    }
  };
  const arabic = { color: t.textColor, fontFamily: riwayah === 'duri' ? 'QuranDuri' : 'Amiri', fontSize, lineHeight: fontSize * 2, textAlign: 'right', writingDirection: 'rtl' };
  const renderRow = useCallback(({ item: group, index }) => {
    const playing = group.some(verse => verse.key === playingKey);
    const picked = group.some(verse => verse.key === selection?.key) ? selection : null;
    return <QuranTextRow group={group} index={index} mode={mode} fontSize={fontSize} translation={translation} riwayah={riwayah} theme={t} language={language}
      onHold={active && !blocked ? onHoldAyah : undefined} playingKey={playing ? playingKey : null} word={playing ? activeWord : null} selection={picked}
      measure={index === followIndex} recordLayout={recordTextLayout} />;
  }, [mode, fontSize, translation, riwayah, t, language, active, blocked, onHoldAyah, playingKey, activeWord, selection, followIndex, recordTextLayout]);
  const footer = <View style={styles.footer}>
    <Text style={{ color: t.secondaryTextColor, fontSize: 10, lineHeight: 17, textAlign: 'center' }}>{riwayah === 'duri' ? 'Duri · King Fahd Complex · Quran Center' : 'Quran JSON · Risan Bagja Pradana · CC BY-SA 4.0'}{mode === 'verses' && translation && riwayah !== 'duri' ? ' · Saheeh International' : ''}{' · '}<Text accessibilityRole="link" onPress={() => Linking.openURL(riwayah === 'duri' ? 'https://github.com/quran-center/quran-meta' : 'https://github.com/risan/quran-json').catch(() => {})} style={{ color: t.activeTabColor }}>{ar ? 'المصدر' : 'Source'}</Text></Text>
    {!next && <Text style={{ color: t.activeTabColor, padding: 16 }}>{ar ? 'نهاية القرآن الكريم' : 'End of the Quran'}</Text>}
  </View>;
  return <PanGestureHandler ref={panHandler} enabled={active && !blocked} simultaneousHandlers={scrollHandler} activeOffsetY={[-7, 7]} failOffsetX={[-28, 28]} onGestureEvent={trackPull} onHandlerStateChange={pullStateChanged}><View style={{ flex: 1, overflow: 'hidden', backgroundColor: t.backgroundColor }}>
      <NativeViewGestureHandler ref={scrollHandler} simultaneousHandlers={panHandler} disallowInterruption={false}><FlatList ref={list} data={groups} keyExtractor={group => group[0].key} CellRendererComponent={Cell} initialNumToRender={active ? 6 : 2} maxToRenderPerBatch={active ? 6 : 2} windowSize={active ? 7 : 1} updateCellsBatchingPeriod={32} style={{ opacity: prepared ? 1 : 0 }} removeClippedSubviews={false} bounces={false} overScrollMode="never" scrollEnabled={active && !blocked && !edge}
        accessibilityActions={[
          ...(previous ? [{ name: 'decrement', label: ar ? 'السورة السابقة' : 'Previous Surah' }] : []),
          ...(next ? [{ name: 'increment', label: ar ? 'السورة التالية' : 'Next Surah' }] : []),
        ]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (!active || blocked) return;
          if (nativeEvent.actionName === 'decrement') advance('previous');
          if (nativeEvent.actionName === 'increment') advance('next');
        }}
        onScrollBeginDrag={() => { beginReadingGesture(); following.current = -1; if (active) onManualScroll?.(); }}
        onScrollToIndexFailed={restorePosition}
        onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={{ viewAreaCoveragePercentThreshold: 15 }}
        onLayout={e => { if (metrics.current.height !== e.nativeEvent.layout.height) { metrics.current.height = e.nativeEvent.layout.height; if (following.current >= 0) setLayoutVersion(v => v + 1); } prepareInitialPosition(); }} onContentSizeChange={(_, height) => { metrics.current.content = height; prepareInitialPosition(); }} onScroll={e => { metrics.current.offset = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: mode === 'flow' ? 23 : 16, paddingBottom: 10 + bottomInset }}
        ListHeaderComponent={<View style={{ paddingTop: 8, paddingBottom: 18 }}><Text style={{ color: t.activeTabColor, fontFamily: 'Amiri', textAlign: 'center', fontSize: 30 }}>{chapter.name_arabic}</Text>{chapter.bismillah_pre && chapterId !== 1 && <Text style={[arabic, { textAlign: 'center', fontSize: 25, marginTop: 10 }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>}</View>}
        ListFooterComponent={footer}
        renderItem={renderRow} /></NativeViewGestureHandler>
    {!prepared && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator accessibilityLabel={ar ? 'تجهيز موضع القراءة' : 'Preparing reading position'} color={t.activeTabColor} /></View>}
  </View></PanGestureHandler>;
}
const styles = StyleSheet.create({ footer: { alignItems: 'center', paddingTop: 4 } });

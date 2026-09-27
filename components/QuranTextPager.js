import React, { startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import QuranTextPage from './QuranTextPage';
import SurahPullIndicator from './SurahPullIndicator';
import { getReaderChapter } from '../utils/quranReaderText';
import { textLayoutKey } from '../utils/quranReaderScroll';

function SurahScene({ id, origin, height, position, active, moving, children }) {
  // These coordinates never depend on the active chapter or change at handoff.
  const translateY = useMemo(() => Animated.multiply(Animated.add(position, id - origin), height), [position, id, origin, height]);
  return <Animated.View pointerEvents={active && !moving ? 'auto' : 'none'}
    accessibilityElementsHidden={!active} importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
    style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}

// Keep the destination list mounted while both Surahs slide through one viewport.
export default function QuranTextPager({ chapterId, anchorVerse, height, width, onChapterChange, onVerseVisible, ...pageProps }) {
  const { fontScale } = useWindowDimensions();
  const layoutKey = textLayoutKey({ ...pageProps, width, fontScale });
  const [origin] = useState(chapterId);
  const [position] = useState(() => new Animated.Value(0));
  const [cue] = useState(() => new Animated.Value(0));
  const [cueEdge, setCueEdge] = useState(null);
  const [moving, setMoving] = useState(false);
  const [neighborsReady, setNeighborsReady] = useState(false);
  const pending = useRef(null);
  const currentChapter = useRef(chapterId);
  const prepared = useRef(new Map());
  const positions = useRef(new Map());
  const lastPull = useRef(null);
  const chapters = useMemo(() => [chapterId - 1, chapterId, chapterId + 1].filter(id => id >= 1 && id <= 114), [chapterId]);
  useEffect(() => {
    const task = requestIdleCallback(() => startTransition(() => setNeighborsReady(true)));
    return () => cancelIdleCallback(task);
  }, []);

  useLayoutEffect(() => {
    // The slide has already arrived. Only transfer ownership; never reset its position.
    currentChapter.current = chapterId;
    pending.current = null;
    lastPull.current = null;
    for (const id of prepared.current.keys()) if (!chapters.includes(id)) prepared.current.delete(id);
    for (const id of positions.current.keys()) if (!chapters.includes(id)) positions.current.delete(id);
  }, [chapterId, chapters]);
  useEffect(() => () => { pending.current = null; position.stopAnimation(); cue.stopAnimation(); }, [position, cue]);

  const startPreparedTransition = () => {
    const request = pending.current;
    if (!request || request.started || prepared.current.get(request.target) !== layoutKey || height <= 0) return;
    request.started = true;
    Animated.timing(position, {
      toValue: origin - request.target,
      duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || pending.current !== request) return;
      const verses = getReaderChapter(request.target, pageProps.riwayah);
      const verse = positions.current.get(request.target) || (request.direction === 'next' ? verses[0] : verses.at(-1));
      // Ignore any late cancellation from the outgoing gesture before React commits.
      currentChapter.current = request.target;
      setMoving(false);
      onChapterChange(request.target, verse);
    });
  };
  const markPrepared = id => {
    prepared.current.set(id, layoutKey);
    if (pending.current) startPreparedTransition();
    else {
      const drag = lastPull.current;
      if (height > 0 && drag && drag.sourceId === currentChapter.current && id === drag.sourceId + (drag.direction === 'next' ? 1 : -1)) position.setValue(origin - drag.sourceId + drag.offset / height);
    }
  };
  const pull = (sourceId, offset, distance, direction) => {
    if (sourceId !== currentChapter.current || pending.current || height <= 0) return;
    lastPull.current = { sourceId, offset, direction };
    setCueEdge(direction); cue.setValue(Math.min(64, distance));
    const target = sourceId + (direction === 'next' ? 1 : -1);
    // Never expose a destination before its starting verse has been laid out.
    position.setValue(origin - sourceId + (prepared.current.get(target) === layoutKey ? offset / height : 0));
  };
  const hideCue = () => {
    Animated.timing(cue, { toValue: 0, duration: 120, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setCueEdge(null);
    });
  };
  const cancelPull = sourceId => {
    if (sourceId !== currentChapter.current || pending.current) return;
    if (!lastPull.current) return;
    lastPull.current = null; hideCue();
    Animated.spring(position, { toValue: origin - sourceId, stiffness: 180, damping: 13, mass: 0.8, restDisplacementThreshold: 0.0001, restSpeedThreshold: 0.0001, useNativeDriver: true }).start();
  };
  const navigate = (sourceId, direction) => {
    if (sourceId !== currentChapter.current || pending.current) return;
    const target = sourceId + (direction === 'next' ? 1 : -1);
    if (target < 1 || target > 114) { cancelPull(sourceId); return; }
    pending.current = { target, direction, started: false };
    setNeighborsReady(true);
    setMoving(true); lastPull.current = null; hideCue();
    startPreparedTransition();
  };
  const recordVerse = (id, verse) => {
    positions.current.set(id, verse);
    if (id === currentChapter.current && !pending.current) onVerseVisible(verse);
  };

  return <View style={[styles.viewport, { backgroundColor: pageProps.themeColors.backgroundColor }]}>
    {height > 0 && chapters.filter(id => id === chapterId || neighborsReady).map(id => {
      const verses = getReaderChapter(id, pageProps.riwayah);
      const anchor = id === chapterId ? anchorVerse : (id < chapterId ? verses.at(-1).key : verses[0].key);
      const active = id === chapterId;
      return <SurahScene key={id} id={id} origin={origin} height={height} position={position} active={active} moving={moving}>
        <QuranTextPage key={layoutKey} {...pageProps} chapterId={id} anchorVerse={anchor} active={active} blocked={moving}
          onPull={(offset, distance, direction) => pull(id, offset, distance, direction)} onCancelPull={() => cancelPull(id)}
          onNavigate={direction => navigate(id, direction)} onReady={() => markPrepared(id)}
          onVerseVisible={verse => recordVerse(id, verse)} />
      </SurahScene>;
    })}
    {!!cueEdge && <SurahPullIndicator direction={cueEdge} distance={cue} armed={moving} theme={pageProps.themeColors} />}
  </View>;
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden' },
});

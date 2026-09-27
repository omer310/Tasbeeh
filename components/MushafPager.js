import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, View } from 'react-native';
import SurahPullIndicator from './SurahPullIndicator';
import { pageSlot, createMushafTurn } from '../utils/mushafPager';

function MushafScene({ page, origin, width, position, active, theme, children }) {
  const translateX = useMemo(() => Animated.multiply(Animated.add(position, pageSlot(origin, page)), width), [position, origin, page, width]);
  // Keep each scene's layout box in the viewport for native hit testing. Its
  // fixed slot and the shared motion are composed entirely in the native graph.
  return <Animated.View pointerEvents={active ? 'auto' : 'none'} accessibilityElementsHidden={!active} importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
    style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: theme.backgroundColor, alignItems: 'center', justifyContent: 'center', transform: [{ translateX }] }]}>{children}</Animated.View>;
}

export default function MushafPager({ page, width, height, theme: t, language, onPageChange, previous, next, onPrevious, onNext, renderPage, onManualScroll }) {
  const [origin] = useState(page);
  const [position] = useState(() => new Animated.Value(0)), [pull] = useState(() => new Animated.Value(0));
  const [edge, setEdge] = useState(null), [armed, setArmed] = useState(false);
  const axis = useRef(null), direction = useRef(1);
  const live = useRef({ page, width, previous, next, onPageChange, onPrevious, onNext, onManualScroll });
  useLayoutEffect(() => { live.current = { page, width, previous, next, onPageChange, onPrevious, onNext, onManualScroll }; }, [page, width, previous, next, onPageChange, onPrevious, onNext, onManualScroll]);
  const [turn] = useState(() => createMushafTurn({ origin, page, width,
    stop: () => position.stopAnimation(), place: value => position.setValue(value),
    animate: (toValue, spring, done) => (spring
      ? Animated.spring(position, { toValue, damping: 24, stiffness: 260, useNativeDriver: true })
      : Animated.timing(position, { toValue, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ).start(({ finished }) => done(finished)),
    commit: target => live.current.onPageChange(target),
  }));
  useLayoutEffect(() => { turn.sync(page, width); }, [page, width, turn]);
  const pages = useMemo(() => [page - 1, page, page + 1].filter(p => p > 0 && p <= 604), [page]);
  useEffect(() => () => { turn.dispose(); pull.stopAnimation(); }, [turn, pull]);
  const reset = () => { setArmed(false); turn.reset(); Animated.spring(pull, { toValue: 0, useNativeDriver: true }).start(({ finished }) => { if (finished) setEdge(null); }); };
  const [pan] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => {
      if (turn.moving) return false;
      const horizontal = Math.abs(g.dx) > Math.abs(g.dy);
      if (horizontal && Math.abs(g.dx) > 7) { axis.current = 'page'; return true; }
      if (!horizontal && Math.abs(g.dy) > 7 && (g.dy > 0 ? live.current.previous : live.current.next)) {
        axis.current = 'surah'; direction.current = g.dy > 0 ? 1 : -1; return true;
      }
      return false;
    },
    // React Native resets dx/dy before Grant; preserve the axis chosen above.
    onPanResponderGrant: () => { live.current.onManualScroll?.(); turn.begin(); pull.stopAnimation(); if (axis.current === 'surah') setEdge(direction.current > 0 ? 'previous' : 'next'); },
    onPanResponderMove: (_, g) => {
      const { previous, next } = live.current;
      if (axis.current === 'page') turn.drag(g.dx);
      else { const allowed = direction.current > 0 ? previous : next; if (!allowed) return; const distance = Math.max(0, g.dy * direction.current); pull.setValue(Math.min(120, distance)); setArmed(distance >= 64); }
    },
    onPanResponderRelease: (_, g) => {
      const { previous, next, onPrevious, onNext } = live.current;
      if (axis.current === 'surah') { const target = direction.current > 0 ? previous : next; if (target && g.dy * direction.current >= 64) { (direction.current > 0 ? onPrevious : onNext)(target.id); pull.setValue(0); setEdge(null); setArmed(false); } else reset(); return; }
      turn.release(g.dx, g.vx);
    },
    onPanResponderTerminate: reset,
  }));
  return <View {...pan.panHandlers} style={{ flex: 1, overflow: 'hidden', backgroundColor: t.backgroundColor }}>
    {pages.map(p => <MushafScene key={p} page={p} origin={origin} width={width} position={position} active={p === page} theme={t}>
      {renderPage(p, width, height)}
    </MushafScene>)}
    {!!edge && <SurahPullIndicator floating direction={edge} chapter={edge === 'previous' ? previous : next} distance={pull} armed={armed} theme={t} language={language} />}
  </View>;
}

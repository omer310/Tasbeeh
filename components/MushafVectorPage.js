import React, { memo, startTransition, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { cachedMushafPage, loadMushafPage } from '../services/MushafPageService';
import { printedPage, printedReference, vectorGeometry } from '../utils/printedMushaf';

// Playback updates only the small overlay, never parse/redraw the calligraphy.
const Artwork = memo(function Artwork({ xml, width, height, color }) {
  return <SvgXml xml={xml} width={width} height={height} color={color} pointerEvents="none" accessible={false} />;
});

export default memo(function MushafVectorPage({ page, riwayah, width, height, active = true, theme: t, language, playingKey, selection, onHold }) {
  const identity = `${riwayah}:${page}`, ar = language === 'ar';
  const [loaded, setLoaded] = useState(() => ({ identity, xml: cachedMushafPage(page, riwayah) }));
  const [error, setError] = useState(null), [attempt, setAttempt] = useState(0);
  const touch = useRef(null);
  const data = printedPage(page, riwayah), geometry = vectorGeometry(data.viewBox, width, height);
  const xml = loaded.identity === identity ? loaded.xml : cachedMushafPage(page, riwayah);
  useEffect(() => {
    let current = true; setError(null);
    const load = () => loadMushafPage(page, riwayah).then(value => {
      if (current) {
        const commit = () => setLoaded({ identity, xml: value });
        if (active) commit(); else startTransition(commit);
      }
    }).catch(() => { if (current) setError(identity); });
    const idle = active ? null : requestIdleCallback(load);
    if (active) void load();
    return () => { current = false; if (idle !== null) cancelIdleCallback(idle); };
  }, [page, riwayah, identity, attempt, active]);
  return <View style={{ width: geometry.width, height: geometry.height }}>
    {xml ? <>
      <Artwork xml={xml} width={geometry.width} height={geometry.height} color={t.isDark ? '#EFF5EF' : '#171B17'} />
      <Svg width={geometry.width} height={geometry.height} viewBox={data.viewBox.join(' ')} style={StyleSheet.absoluteFill}>
        {data.regions.map(([printedKey, key, path], i) => {
          const selected = selection?.key === key, playing = playingKey === key;
          const open = () => onHold?.(key, { printedKey: printedReference(key, riwayah) });
          return <Path key={`${printedKey}-${i}`} d={path} fill={selected ? '#77B67A' : playing ? '#E4B84F' : '#000'} fillOpacity={selected ? 0.25 : playing ? 0.23 : 0}
            onPressIn={e => { touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, cancelled: false }; }}
            onResponderMove={e => { const start = touch.current; if (start && Math.hypot(e.nativeEvent.pageX - start.x, e.nativeEvent.pageY - start.y) > 8) start.cancelled = true; }}
            onPressOut={() => { touch.current = null; }}
            onLongPress={onHold ? () => { if (touch.current && !touch.current.cancelled) open(); } : undefined} delayLongPress={450}
            pressRetentionOffset={{ top: 0, left: 0, right: 0, bottom: 0 }}
            accessible={!!onHold} accessibilityRole="button" accessibilityLabel={`${ar ? 'الآية' : 'Ayah'} ${printedKey}`}
            accessibilityHint={ar ? 'اضغط مطولاً للتفسير أو الاستماع' : 'Hold for Tafsir or listening options'}
            accessibilityActions={[{ name: 'activate', label: ar ? 'التفسير والاستماع' : 'Tafsir and listening options' }]}
            onAccessibilityAction={e => { if (e.nativeEvent.actionName === 'activate') open(); }} />;
        })}
      </Svg>
    </> : <View style={styles.loading}>
      {error === identity ? <><Text style={{ color: t.textColor }}>{ar ? 'تعذر فتح الصفحة' : 'Could not open this page'}</Text><Pressable accessibilityRole="button" onPress={() => setAttempt(n => n + 1)} style={styles.retry}><Text style={{ color: t.activeTabColor }}>{ar ? 'إعادة المحاولة' : 'Try again'}</Text></Pressable></> : <ActivityIndicator color={t.activeTabColor} />}
    </View>}
  </View>;
});
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, retry: { padding: 16, minHeight: 48 } });

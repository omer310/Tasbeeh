import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { isHandleDrag } from '../utils/sheetMotion';

export default function SheetHandle({ color, ar = false, onPress, onGrab, onDrag, onRelease, onCancel }) {
  const callbacks = useRef({ onGrab, onDrag, onRelease, onCancel });
  useLayoutEffect(() => { callbacks.current = { onGrab, onDrag, onRelease, onCancel }; }, [onGrab, onDrag, onRelease, onCancel]);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => isHandleDrag(gesture),
    onPanResponderGrant: () => callbacks.current.onGrab?.(),
    onPanResponderMove: (_, gesture) => callbacks.current.onDrag?.(gesture.dy),
    onPanResponderRelease: (_, gesture) => callbacks.current.onRelease?.(gesture),
    onPanResponderTerminate: () => callbacks.current.onCancel?.(),
  }), []);
  return <View {...pan.panHandlers} style={styles.area}>
    <Pressable onPress={onPress} accessibilityRole="button"
      accessibilityLabel={ar ? 'طي اللوحة' : 'Dismiss panel'}
      accessibilityHint={ar ? 'اضغط أو اسحب لأعلى أو لأسفل للإغلاق' : 'Tap, or drag up or down to dismiss'}
      style={({ pressed }) => [styles.touch, { opacity: pressed ? 0.8 : 0.5 }]}>
      <View style={[styles.line, { backgroundColor: color }]} />
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  area: { height: 44, flexShrink: 0 },
  touch: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  line: { width: 40, height: 4, borderRadius: 2 },
});

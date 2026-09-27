import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import SheetHandle from './SheetHandle';
import { SHEET_SPRING, sheetRevealForDrag, sheetHeight, sheetDismissDirection } from '../utils/sheetMotion';

export default function BottomSheet({ visible, title, subtitle, onClose, onDismiss, theme: t, children, height, scrollable = true, scrollKey, contentStyle, language }) {
  const window = useWindowDimensions(), insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const ar = language === 'ar' || (language == null && /[\u0600-\u06ff]/.test(title || ''));
  const [present, setPresent] = useState(false), [closing, setClosing] = useState(false);
  const [viewport, setViewport] = useState(window.height), [showVersion, setShowVersion] = useState(0);
  const [header, setHeader] = useState(null), [content, setContent] = useState(null);
  const bottom = Math.max(12, insets.bottom);
  const maximum = Math.max(1, Math.min(viewport, window.height) - insets.top - 24);
  const resolvedHeight = sheetHeight({ height, viewport, maximum, header, content, bottom, scrollable });
  const sizeReady = height != null || !scrollable || header !== null && content !== null;
  const reveal = useSharedValue(0), fullHeight = useSharedValue(resolvedHeight);
  const close = useRef(onClose), dismissed = useRef(onDismiss), dragOrigin = useRef(0);
  const generation = useRef(0), closingRef = useRef(false), presentRef = useRef(false);
  const nativeShown = useRef(false), entered = useRef(false);
  useLayoutEffect(() => { close.current = onClose; dismissed.current = onDismiss; }, [onClose, onDismiss]);
  useLayoutEffect(() => { fullHeight.set(resolvedHeight); }, [fullHeight, resolvedHeight]);
  const frameMotion = useAnimatedStyle(() => ({ height: Math.max(0, Math.min(1, reveal.get())) * fullHeight.get() }));
  const springOpen = useCallback(() => {
    // Late responder cancellation must not replace a dismissal with a rebound.
    if (closingRef.current) return;
    reveal.set(reducedMotion ? 1 : withSpring(1, { ...SHEET_SPRING, overshootClamping: true }));
  }, [reducedMotion, reveal]);
  const finishClose = useCallback((ticket, notify) => {
    if (ticket !== generation.current || !closingRef.current) return;
    presentRef.current = false; entered.current = false; setPresent(false);
    if (notify) close.current?.();
    dismissed.current?.();
  }, []);
  const dismiss = useCallback((notify = true) => {
    if (closingRef.current || !presentRef.current) return;
    closingRef.current = true; setClosing(true); Keyboard.dismiss();
    const ticket = ++generation.current;
    cancelAnimation(reveal);
    if (reducedMotion) { reveal.set(0); finishClose(ticket, notify); }
    else reveal.set(withSpring(0, { ...SHEET_SPRING, overshootClamping: true }, finished => {
      if (finished) scheduleOnRN(finishClose, ticket, notify);
    }));
  }, [finishClose, reducedMotion, reveal]);
  useLayoutEffect(() => {
    if (!visible) { dismiss(false); return; }
    ++generation.current;
    closingRef.current = false; setClosing(false);
    const wasPresent = presentRef.current;
    presentRef.current = true; setPresent(true); entered.current = false;
    cancelAnimation(reveal);
    if (!wasPresent) {
      nativeShown.current = false; setHeader(null); setContent(null); reveal.set(0);
    }
    // Reopening during exit preserves the current reveal; there is no reset/dip.
  }, [visible, dismiss, reveal]);
  useEffect(() => {
    if (!visible || !nativeShown.current || !sizeReady || entered.current || closingRef.current) return;
    entered.current = true; springOpen();
  }, [visible, sizeReady, showVersion, springOpen]);
  useEffect(() => () => { ++generation.current; cancelAnimation(reveal); }, [reveal]);
  if (!present) return null;
  return <Modal visible transparent hardwareAccelerated animationType="none" statusBarTranslucent onShow={() => { nativeShown.current = true; setShowVersion(value => value + 1); }} onRequestClose={() => dismiss()}>
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container} onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        <Pressable accessibilityRole="button" accessibilityLabel={ar ? 'إغلاق اللوحة' : 'Dismiss panel'} onPress={() => dismiss()} style={StyleSheet.absoluteFill} />
        <Animated.View pointerEvents={closing ? 'none' : 'auto'} style={[styles.frame, { backgroundColor: t.cardColor }, frameMotion]}>
          {/* Keep content at its measured height. Only the outer reveal changes,
              so lists, text and inputs do not resize on every animation frame. */}
          <View style={[styles.body, { height: resolvedHeight, borderColor: t.separatorColor, paddingBottom: bottom }]}>
            <View onLayout={e => setHeader(e.nativeEvent.layout.height)} style={styles.heading}>
              <SheetHandle color={t.secondaryTextColor} ar={ar} onPress={() => dismiss()}
                onGrab={() => { if (closingRef.current) return; Keyboard.dismiss(); cancelAnimation(reveal); dragOrigin.current = reveal.get(); }}
                onDrag={dy => { if (!closingRef.current && !reducedMotion) reveal.set(sheetRevealForDrag(dragOrigin.current, dy, resolvedHeight)); }}
                onRelease={gesture => { if (sheetDismissDirection(gesture, resolvedHeight)) dismiss(); else springOpen(); }} onCancel={springOpen} />
              <View style={styles.header}><Text style={{ color: t.textColor, fontSize: 22, fontWeight: '700' }}>{title}</Text>{!!subtitle && <Text style={{ color: t.secondaryTextColor, fontSize: 12 }}>{subtitle}</Text>}</View>
            </View>
            {scrollable ? <ScrollView key={scrollKey} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onContentSizeChange={(_, h) => setContent(h)} contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView> : <View style={[styles.content, styles.list, contentStyle]}>{children}</View>}
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1, justifyContent: 'flex-end' },
  frame: { width: '100%', maxWidth: 640, alignSelf: 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  body: { position: 'absolute', top: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1 },
  heading: { flexShrink: 0 },
  header: { paddingHorizontal: 22, paddingBottom: 15, gap: 4 },
  content: { paddingHorizontal: 22, paddingBottom: 14, gap: 12 },
  list: { flex: 1, minHeight: 0 },
});

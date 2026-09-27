import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createWheelInteraction } from '../utils/wheelPicker';
import useReducedMotion from '../hooks/useReducedMotion';

export default memo(function SelectionWheel({ column, items, index, onSelect, onMoving, revision, label, theme: t, rowHeight, wide = false, fontSize = 21 }) {
  const reducedMotion = useReducedMotion();
  const list = useRef(null), callbacks = useRef({ onSelect, onMoving, items, column, reducedMotion });
  const alignedSize = useRef('');
  const [viewport, setViewport] = useState(0);
  const [scroll] = useState(() => new Animated.Value(index * rowHeight));
  useLayoutEffect(() => { callbacks.current = { onSelect, onMoving, items, column, reducedMotion }; }, [onSelect, onMoving, items, column, reducedMotion]);
  const interaction = useMemo(() => createWheelInteraction({ count: items.length, rowHeight, initialIndex: index,
    onSelect: index => { const c = callbacks.current; c.onSelect(c.column, c.items[index].value); },
    onMoving: value => { const c = callbacks.current; c.onMoving(c.column, value); },
    onTick: () => { void Haptics.selectionAsync().catch(() => {}); },
    onAlign: (value, animate) => {
      const animated = animate && !callbacks.current.reducedMotion;
      list.current?.scrollToOffset({ offset: value * rowHeight, animated });
      if (!animated) scroll.setValue(value * rowHeight);
    },
    // index is synchronized below; changing the value must not replace a live gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [rowHeight, scroll]);
  useLayoutEffect(() => { interaction.sync(index, false, items.length); }, [interaction, index, revision, items.length]);
  useEffect(() => () => interaction.dispose(), [interaction]);
  const padding = Math.max(0, (viewport - rowHeight) / 2);
  return <View style={styles.column} onLayout={event => { const height = event.nativeEvent.layout.height; setViewport(height); }}
    accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min: 1, max: items.length, now: index + 1, text: items[index]?.label }}
    accessibilityActions={[{ name: 'increment', label: 'Next' }, { name: 'decrement', label: 'Previous' }]}
    onAccessibilityAction={event => interaction.tap(index + (event.nativeEvent.actionName === 'increment' ? 1 : -1))}>
    {viewport > 0 && <>
      <View pointerEvents="none" style={[styles.band, { top: padding, height: rowHeight, backgroundColor: t.inputBackground }]} />
      <Animated.FlatList ref={list} data={items} extraData={index} keyExtractor={item => String(item.value)} style={styles.list}
        initialScrollIndex={index} getItemLayout={(_, itemIndex) => ({ length: rowHeight, offset: rowHeight * itemIndex, index: itemIndex })}
        contentContainerStyle={{ paddingVertical: padding }} onContentSizeChange={() => {
          const size = `${viewport}:${rowHeight}`;
          if (alignedSize.current !== size) { alignedSize.current = size; interaction.sync(index, true); }
        }}
        initialNumToRender={9} maxToRenderPerBatch={9} windowSize={5} showsVerticalScrollIndicator={false} bounces={false}
        snapToInterval={rowHeight} decelerationRate="fast" scrollEventThrottle={16} nestedScrollEnabled
        onScrollBeginDrag={event => interaction.begin(event.nativeEvent.contentOffset.y)}
        onScrollEndDrag={event => interaction.endDrag(event.nativeEvent.contentOffset.y)}
        onMomentumScrollBegin={() => interaction.momentumBegin()} onMomentumScrollEnd={event => interaction.momentumEnd(event.nativeEvent.contentOffset.y)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scroll } } }], { useNativeDriver: true, listener: event => interaction.scroll(event.nativeEvent.contentOffset.y) })}
        renderItem={({ item, index: itemIndex }) => <Pressable accessible={false} onPress={() => interaction.tap(itemIndex)} style={[styles.row, { height: rowHeight }]}>
          <Animated.Text numberOfLines={wide ? 2 : 1} maxFontSizeMultiplier={1.5} style={{ color: t.textColor, textAlign: 'center', fontSize: wide ? Math.min(18, fontSize) : fontSize, fontWeight: '600',
            opacity: scroll.interpolate({ inputRange: [(itemIndex - 2) * rowHeight, itemIndex * rowHeight, (itemIndex + 2) * rowHeight], outputRange: [0.28, 1, 0.28], extrapolate: 'clamp' }),
            transform: reducedMotion ? [] : [
              { perspective: 600 },
              { rotateX: scroll.interpolate({ inputRange: [(itemIndex - 2) * rowHeight, itemIndex * rowHeight, (itemIndex + 2) * rowHeight], outputRange: ['-38deg', '0deg', '38deg'], extrapolate: 'clamp' }) },
              { scale: scroll.interpolate({ inputRange: [(itemIndex - 2) * rowHeight, itemIndex * rowHeight, (itemIndex + 2) * rowHeight], outputRange: [0.86, 1, 0.86], extrapolate: 'clamp' }) },
            ] }}>{item.label}</Animated.Text>
        </Pressable>} />
    </>}
  </View>;
});
const styles = StyleSheet.create({ column: { flex: 1, minHeight: 0, overflow: 'hidden' }, list: { flex: 1 }, row: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 }, band: { position: 'absolute', left: 0, right: 0, borderRadius: 12 } });

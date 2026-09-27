import React, { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// A decorative cue drawn by the pull itself; it occupies no reading space at rest.
export default function SurahPullIndicator({ direction, distance, armed, theme: t }) {
  const previous = direction === 'previous';
  const animation = useMemo(() => ({
    opacity: distance.interpolate({ inputRange: [0, 8, 36, 64], outputRange: [0, 0, 0.8, 1], extrapolate: 'clamp' }),
    scale: distance.interpolate({ inputRange: [0, 64], outputRange: [0.72, 1], extrapolate: 'clamp' }),
    shaft: distance.interpolate({ inputRange: [8, 42], outputRange: [0.01, 1], extrapolate: 'clamp' }),
    wings: distance.interpolate({ inputRange: [24, 60], outputRange: [0.01, 1], extrapolate: 'clamp' }),
    lift: distance.interpolate({ inputRange: [0, 64], outputRange: [previous ? -8 : 8, 0], extrapolate: 'clamp' }),
  }), [distance, previous]);
  return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.position, { [previous ? 'top' : 'bottom']: 10, opacity: animation.opacity, transform: [{ translateY: animation.lift }, { scale: animation.scale }] }]}>
    <View style={[styles.halo, { backgroundColor: t.cardColor, borderColor: armed ? t.activeTabColor : t.separatorColor }]}>
      <View style={[styles.arrow, { transform: [{ rotate: previous ? '0deg' : '180deg' }] }]}>
        <Animated.View style={[styles.shaft, { backgroundColor: t.activeTabColor, transform: [{ scaleY: animation.shaft }] }]} />
        <Animated.View style={[styles.wing, styles.leftWing, { backgroundColor: t.activeTabColor, transform: [{ rotate: '-45deg' }, { scaleX: animation.wings }] }]} />
        <Animated.View style={[styles.wing, styles.rightWing, { backgroundColor: t.activeTabColor, transform: [{ rotate: '45deg' }, { scaleX: animation.wings }] }]} />
      </View>
    </View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  position: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 5 },
  halo: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  arrow: { width: 24, height: 26 },
  shaft: { position: 'absolute', width: 2.5, height: 19, borderRadius: 2, left: 10.75, top: 5 },
  wing: { position: 'absolute', width: 12, height: 2.5, borderRadius: 2, top: 7 },
  leftWing: { left: 1.5 },
  rightWing: { right: 1.5 },
});

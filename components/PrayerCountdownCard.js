import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Mask, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const ART = {
  Fajr: {
    light: { background: ['#F8FAFD', '#DDE6F5'], wave: '#A9BAD7', near: '#869EC1', mosque: '#7892B6', glow: '#FFD8AF' },
    dark: { background: ['#102C3C', '#183B54'], wave: '#527293', near: '#3B5F7D', mosque: '#0B2535', glow: '#F6AE74' },
    sun: { x: 42, y: 140, radius: 0, glowRadius: 72 },
  },
  Dhuhr: {
    light: { background: ['#FFFCF4', '#E5EEE5'], wave: '#BBCDBB', near: '#9FB6A5', mosque: '#829E8A', glow: '#F5CE72' },
    dark: { background: ['#183D31', '#214D3A'], wave: '#537B5D', near: '#3C684D', mosque: '#123529', glow: '#F8D17A' },
    sun: { x: 190, y: 9, radius: 14, glowRadius: 59 },
  },
  Asr: {
    light: { background: ['#FAF9F1', '#EADBAC'], wave: '#B7C5A6', near: '#A6AF8D', mosque: '#819578', glow: '#F0C46C' },
    dark: { background: ['#193B30', '#45472C'], wave: '#74815A', near: '#5C704D', mosque: '#143328', glow: '#F5C76C' },
    sun: { x: 316, y: 57, radius: 17, glowRadius: 66 },
  },
  Maghrib: {
    light: { background: ['#F8F9F1', '#E7BE94'], wave: '#A9B9A1', near: '#909F88', mosque: '#708B78', glow: '#F8BA70' },
    dark: { background: ['#16382E', '#704B32'], wave: '#6F7755', near: '#596B4D', mosque: '#123126', glow: '#F3A964' },
    sun: { x: 318, y: 126, radius: 22, glowRadius: 83 },
  },
  Isha: {
    light: { background: ['#F3F8FB', '#D8E6F1'], wave: '#AABFD0', near: '#8FAAC1', mosque: '#7494AA', glow: '#E8F4F1' },
    dark: { background: ['#102B3A', '#183D53'], wave: '#466987', near: '#315875', mosque: '#0B2635', glow: '#DDEDEB' },
  },
};

const PrayerArtwork = memo(function PrayerArtwork({ prayer, dark, palette, compact }) {
  const sun = ART[prayer]?.sun;

  return <><Svg width="100%" height="100%" viewBox="0 0 360 128" preserveAspectRatio="none" pointerEvents="none" accessible={false}>
    <Defs>
      <RadialGradient id="prayerGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor={palette.glow} stopOpacity={dark ? 0.68 : 0.48} />
        <Stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
      </RadialGradient>
      <Mask id="prayerCrescentCut" x="0" y="0" width="360" height="128">
        <Rect width="360" height="128" fill="white" />
        <Circle cx="328" cy="19" r="12" fill="black" />
      </Mask>
    </Defs>

    {sun && <>
      <Circle cx={sun.x} cy={sun.y} r={sun.glowRadius} fill="url(#prayerGlow)" />
      {sun.radius > 0 && <Circle cx={sun.x} cy={sun.y} r={sun.radius} fill={palette.glow} opacity={dark ? 0.92 : 0.7} />}
    </>}
    {prayer === 'Isha' && <>
      <Circle cx="317" cy="26" r="14" fill={dark ? '#F8EFD4' : '#FFFEF3'} mask="url(#prayerCrescentCut)" />
      <Circle cx="343" cy="18" r="1.4" fill={dark ? '#F8EFD4' : '#91AFC1'} opacity="0.8" />
    </>}

    <Path d="M0 58 C65 70 109 116 177 111 C244 107 297 62 360 68 L360 128 L0 128 Z" fill={palette.wave} opacity={dark ? 0.3 : 0.22} />
    <Path d="M0 88 C83 100 119 125 183 121 C257 118 304 87 360 80 L360 128 L0 128 Z" fill={palette.near} opacity={dark ? 0.28 : 0.2} />

  </Svg>
    {/* Architecture keeps its own proportions as the surrounding sky stretches. */}
    <Svg width={compact ? 76 : 86} height={compact ? 44 : 50} viewBox="0 0 96 56" preserveAspectRatio="xMidYMax meet" style={styles.mosque} pointerEvents="none" accessible={false}>
      <Path d="M10 56 V40 Q10 35 16 35 H22 V31 C22 24 29 21 36 14 C43 21 50 24 50 31 V35 H56 Q62 35 62 40 V56 Z" fill={palette.mosque} opacity={dark ? 0.75 : 0.58} />
      <Path d="M36 14 V10 M38 3 A4 4 0 1 0 40 9 A4 4 0 0 1 38 3" stroke={palette.mosque} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity={dark ? 0.75 : 0.58} />
      <Path d="M75 56 V22 H72 V18 H75 V12 L79 4 L83 12 V18 H86 V22 H83 V56 Z" fill={palette.mosque} opacity={dark ? 0.75 : 0.58} />
    </Svg>
  </>;
});

export default function PrayerCountdownCard({ prayer = 'Fajr', label, countdown = '00:00:00', dark, height }) {
  const art = ART[prayer] || ART.Fajr;
  const palette = dark ? art.dark : art.light;
  const foreground = dark ? '#FFF9EA' : '#143D32';
  const compact = height < 120;

  return <LinearGradient
    colors={palette.background}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    accessible accessibilityRole="text" accessibilityLabel={`${label}. ${countdown}`}
    style={[styles.card, { height, borderColor: dark ? '#31584B' : '#DEE8DF' }]}
  >
    {/* Keep the art out of layout flow; only the foreground gets text padding. */}
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <PrayerArtwork prayer={prayer} dark={dark} palette={palette} compact={compact} />
    </View>
    <View style={styles.content}>
      <Text style={[styles.label, { color: foreground }]}>{label}</Text>
      <View style={styles.timeRow}>{countdown.split(':').map((part, index) => <React.Fragment key={index}>
        {index > 0 && <Text style={[styles.countdown, { color: foreground, fontSize: compact ? 32 : 38, lineHeight: compact ? 39 : 46 }]}>:</Text>}
        <Text style={[styles.countdown, { color: foreground, fontSize: compact ? 32 : 38, lineHeight: compact ? 39 : 46 }]}>{part}</Text>
      </React.Fragment>)}</View>
    </View>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  card: { flexShrink: 0, overflow: 'hidden', borderRadius: 22, borderWidth: 1, marginBottom: 12 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 12 },
  mosque: { position: 'absolute', bottom: 0, alignSelf: 'center' },
  label: { fontSize: 13, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  countdown: { fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: 0.5, textAlign: 'center' },
});

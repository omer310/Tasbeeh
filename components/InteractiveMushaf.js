import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MushafPager from './MushafPager';
import MushafVectorPage from './MushafVectorPage';
import { MUSHAF_CONTROLS_HEIGHT } from '../utils/printedMushaf';

export default function InteractiveMushaf({ page, width, height, riwayah, theme: t, language, playingKey, selection, onManualScroll, onHold, onPageChange, previous, next, onPrevious, onNext }) {
  const ar = language === 'ar', availableHeight = Math.max(1, height - MUSHAF_CONTROLS_HEIGHT);
  const renderPage = (target, w, h) => <MushafVectorPage page={target} active={target === page} riwayah={riwayah} width={w} height={h} theme={t} language={language}
    playingKey={target === page ? playingKey : null} selection={target === page ? selection : null} onHold={target === page ? onHold : undefined} />;
  const button = (delta, icon, label) => {
    const disabled = page + delta < 1 || page + delta > 604;
    return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} pressRetentionOffset={0} onPress={() => onPageChange(page + delta)} style={styles.button}><Ionicons name={icon} color={disabled ? t.separatorColor : t.activeTabColor} size={24} /></Pressable>;
  };
  return <View style={{ flex: 1 }}>
    <MushafPager page={page} width={width} height={availableHeight} theme={t} language={language} onPageChange={onPageChange}
      previous={previous} next={next} onPrevious={onPrevious} onNext={onNext} onManualScroll={onManualScroll} renderPage={renderPage} />
    <View style={styles.navigation}>
      {button(1, 'chevron-back', ar ? 'الصفحة التالية' : 'Next page')}
      {button(-1, 'chevron-forward', ar ? 'الصفحة السابقة' : 'Previous page')}
    </View>
  </View>;
}
const styles = StyleSheet.create({ navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: MUSHAF_CONTROLS_HEIGHT }, button: { width: 52, height: 48, alignItems: 'center', justifyContent: 'center' } });

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { Ionicons } from '@expo/vector-icons';

export function IconButton({ name, label, onPress, color, theme, selected, disabled }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={ui.icon}>
    <Ionicons name={name} size={23} color={color || theme?.textColor} />
  </TouchableOpacity>;
}
export function PageHeader({ title, subtitle, theme: t, onBack, children }) {
  return <View style={ui.header}>
    {onBack && <IconButton name="arrow-back" label="Go back" onPress={onBack} color={t.textColor} />}
    <View style={{ flex: 1, gap: 3 }}><Text style={[ui.title, { color: t.textColor }]}>{title}</Text>{!!subtitle && <Text style={{ color: t.secondaryTextColor, fontSize: 13 }}>{subtitle}</Text>}</View>
    {children}
  </View>;
}
export function OptionSheet(props) { return <BottomSheet {...props} />; }
export const ui = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, gap: 8 },
  title: { fontSize: 25, fontWeight: '700', letterSpacing: -0.5 },
  icon: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#94A49B66', alignSelf: 'center', marginTop: 12 },
  sheetContent: { paddingHorizontal: 22, paddingBottom: 24, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16 },
  primary: { padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#287457' },
});

import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Easing, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { OptionSheet } from './ScreenUI';

const positions = Array.from({ length: 33 }, (_, i) => i / 32);
export default function CompassCalibrationSheet({ visible, ready, accuracy, onClose, theme: t, language }) {
  const [motion] = useState(() => new Animated.Value(0));
  const ar = language === 'ar';
  useEffect(() => {
    if (!visible || ready) return;
    const animation = Animated.loop(Animated.timing(motion, { toValue: 1, duration: 3300, easing: Easing.linear, useNativeDriver: true }));
    animation.start(); return () => { animation.stop(); motion.setValue(0); };
  }, [visible, ready, motion]);
  return <OptionSheet visible={visible} title={ready ? (ar ? 'البوصلة جاهزة' : 'Compass ready') : (ar ? 'معايرة البوصلة' : 'Calibrate compass')} theme={t} onClose={onClose}>
    <View style={{ alignItems: 'center', padding: 18, borderRadius: 22, backgroundColor: t.inputBackground }}>
      {ready ? <Ionicons name="checkmark-circle-outline" size={72} color={t.activeTabColor} /> : <View style={{ width: 260, height: 150, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={260} height={150}><Path d="M130 75 C70 10 20 15 35 75 C50 135 100 130 130 75 C160 20 210 15 225 75 C240 135 190 140 130 75" fill="none" stroke={t.activeTabColor} strokeWidth={2} strokeDasharray="5 6" opacity={0.45} /></Svg>
        <Animated.View style={{ position: 'absolute', transform: [{ translateX: motion.interpolate({ inputRange: positions, outputRange: positions.map(p => Math.sin(p * Math.PI * 2) * 84) }) }, { translateY: motion.interpolate({ inputRange: positions, outputRange: positions.map(p => Math.sin(p * Math.PI * 4) * 36) }) }, { rotate: motion.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '18deg', '0deg', '-18deg', '0deg'] }) }] }}><Ionicons name="phone-portrait-outline" size={46} color={t.textColor} /></Animated.View>
      </View>}
      <Text style={{ color: t.textColor, textAlign: 'center', fontSize: 17, fontWeight: '600', marginTop: 12 }}>{ready ? (ar ? 'تحسنت دقة مستشعر الاتجاه' : 'The heading sensor reports good accuracy') : (ar ? 'ارفع هاتفك وحركه على شكل ٨' : 'Raise your phone and move it in a figure eight')}</Text>
      <Text style={{ color: t.secondaryTextColor, textAlign: 'center', fontSize: 13, lineHeight: 22, marginTop: 9 }}>{ready ? (ar ? 'يمكنك الآن العودة إلى اتجاه القبلة.' : 'You can return to the Qibla compass.') : (ar ? 'ابتعد عن المعادن والمغناطيس. حرك الهاتف برفق في الاتجاهات الموضحة؛ ستتغير هذه الشاشة عندما تتحسن الدقة.' : 'Keep away from metal and magnets. Move gently as shown; this screen updates when the sensor’s accuracy improves.')}</Text>
    </View>
    <Text style={{ color: t.secondaryTextColor, fontSize: 12, textAlign: 'center' }}>{ready ? (ar ? 'تمت المعايرة' : 'Calibration complete') : accuracy == null ? (ar ? 'بانتظار مستشعر الاتجاه…' : 'Waiting for the heading sensor…') : (ar ? 'جاري متابعة الدقة…' : 'Checking heading accuracy…')}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={onClose} style={{ padding: 16, borderRadius: 16, backgroundColor: ready ? '#287457' : t.inputBackground, alignItems: 'center' }}><Text style={{ color: ready ? '#fff' : t.textColor, fontWeight: '600' }}>{ready ? (ar ? 'تم' : 'Done') : (ar ? 'لاحقاً' : 'Do this later')}</Text></TouchableOpacity>
  </OptionSheet>;
}

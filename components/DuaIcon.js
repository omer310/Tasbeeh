import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';
import icons from '../data/duaIcons.json';

export default function DuaIcon({ name, color, background = 'transparent', size = 28 }) {
  const [base, direction] = name.split('-');
  return <View pointerEvents="none" accessible={false} style={{ width: size, height: size, flexShrink: 0 }}>
    <SvgXml xml={icons[base] || icons.comfort} width={size} height={size} color={color} />
    {!!direction && <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', top: 0, left: 0 }}>
      <Circle cx="19" cy="19" r="5.5" fill={background} />
      <Path d={direction === 'in' ? 'M22 19 H16 M18.5 16.5 L16 19 L18.5 21.5' : 'M16 19 H22 M19.5 16.5 L22 19 L19.5 21.5'} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>}
  </View>;
}

import React from 'react';
import { SvgXml } from 'react-native-svg';
import icons from '../data/navigationIcons';

export default function TabIcon({ name, color, size = 25 }) {
  return <SvgXml xml={icons[name]} width={size} height={size} color={color} />;
}

import React from 'react';
import { Image, View } from 'react-native';
import Svg, { Defs, Filter, FeColorMatrix, Image as SvgImage } from 'react-native-svg';

// Dark ink becomes light ink and paper becomes dark green without editing the source.
export default function ThemedPageImage({ source, width, height, dark, label, onLoad, onError }) {
  if (!dark) return <Image source={source} accessibilityLabel={label} resizeMode="contain" fadeDuration={0} onLoad={onLoad} onError={onError} style={{ width, height }} />;
  return <View accessibilityLabel={label} accessible style={{ width, height }}>
    <Image source={source} onLoad={onLoad} onError={onError} accessible={false} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs><Filter id="nightInk" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB"><FeColorMatrix type="matrix" values="-0.847 0 0 0 0.937 0 -0.824 0 0 0.961 0 0 -0.823 0 0.937 0 0 0 1 0" /></Filter></Defs>
      <SvgImage onLoad={onLoad} href={source} width={width} height={height} preserveAspectRatio="xMidYMid meet" filter="url(#nightInk)" />
    </Svg>
  </View>;
}

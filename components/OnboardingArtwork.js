import React from 'react';
import { Image } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Image as SvgImage, Path } from 'react-native-svg';

// The generator returned opaque PNGs. Clip their outer backplates in the UI;
// keep the remaining original transparent illustrations and artwork colors intact.
const silhouettes = {
  notifications: 'M624 12 C652 90 722 104 791 150 C854 188 884 246 875 310 C978 311 1058 424 1061 534 L1061 1206 L185 1206 L185 539 C184 430 269 309 372 311 C355 207 443 139 523 103 C576 76 607 44 624 12 Z',
  language: 'M29 700 C17 603 73 525 109 433 C136 364 156 318 166 290 C174 238 228 182 300 144 C366 107 455 100 520 76 C641 34 756 67 861 104 C986 133 1070 180 1090 290 C1104 367 1119 434 1160 510 C1190 567 1220 630 1227 711 C1226 843 1198 980 1137 1108 C1116 1156 1080 1180 1018 1180 L264 1180 C164 1187 147 1135 127 1100 C74 1000 60 913 40 825 C32 780 25 744 29 700 Z',
};
export default function OnboardingArtwork({ slide, width, height }) {
  if (!slide.generated) return <Image source={slide.image} accessible={false} resizeMode="contain" resizeMethod="resize" style={{ width, height }} />;
  const id = `onboarding-${slide.generated}`;
  return <Svg width={width} height={height} viewBox="0 0 1254 1254" accessible={false}>
    <Defs><ClipPath id={id}>{slide.generated === 'hadith' || slide.generated === 'charity' ? <Circle cx={627} cy={slide.generated === 'hadith' ? 620 : 625} r={slide.generated === 'hadith' ? 580 : 598} /> : <Path d={silhouettes[slide.generated]} transform={slide.generated === 'language' ? 'translate(14 16) scale(0.975)' : undefined} />}</ClipPath></Defs>
    <SvgImage href={slide.image} width={1254} height={1254} clipPath={`url(#${id})`} />
  </Svg>;
}

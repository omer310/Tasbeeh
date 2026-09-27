import React from 'react';
import Svg, { Defs, Filter, FeColorMatrix, Image, Mask, Rect, Polygon } from 'react-native-svg';

const source = require('../assets/qibla-compass3.png');
// Preserve the original artwork, but let north and the Kaaba follow their own
// bearings. The artwork's Kaaba sits about 62.5 degrees clockwise from north.
export const KAABA_ARTWORK_ANGLE = 62.5;
export default function CompassArtwork({ size, dark, markerOnly = false }) {
  // Match the existing marker silhouette; its black cloth and gold band are
  // fixed colors and must never pass through the compass's night filter.
  if (markerOnly) return <Svg width={size} height={size} viewBox="0 0 512 491">
    <Polygon points="414,131 467,103 494,153 440,180" fill="#171713" stroke="#34332C" strokeWidth={1} />
    <Polygon points="446,114 456,109 483,159 473,164" fill="#D7AE59" />
    <Polygon points="428,150 436,146 440,154 432,158" fill="#B58B3F" />
  </Svg>;
  return <Svg width={size} height={size} viewBox="0 0 512 491">
    <Defs>
      <Filter id="compassNight" x="0%" y="0%" width="100%" height="100%"><FeColorMatrix type="matrix" values="-0.847 0 0 0 0.937 0 -0.824 0 0 0.961 0 0 -0.823 0 0.937 0 0 0 1 0" /></Filter>
      <Mask id="cardinals" x={0} y={0} width={512} height={491} maskUnits="userSpaceOnUse"><Rect width={512} height={491} fill="white" /><Rect x={405} y={87} width={101} height={107} fill="black" /></Mask>
    </Defs>
    <Image href={source} width={512} height={491} mask="url(#cardinals)" filter={dark ? 'url(#compassNight)' : undefined} />
  </Svg>;
}

import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface ConnectIconProps {
  size?: number;
  color?: string;
}

export default function ConnectIcon({ size = 24, color = 'currentColor' }: ConnectIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <Path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

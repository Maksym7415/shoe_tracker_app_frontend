import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface ShoesActivityIconProps {
  size?: number;
  color?: string;
}

export default function ShoesActivityIcon({ size = 24, color = 'currentColor' }: ShoesActivityIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width="20" height="6" x="2" y="4" rx="2" />
      <Rect width="20" height="6" x="2" y="14" rx="2" />
    </Svg>
  );
}

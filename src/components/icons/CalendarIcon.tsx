import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface CalendarIconProps {
  size?: number;
  color?: string;
}

export default function CalendarIcon({ size = 24, color = 'currentColor' }: CalendarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <Path d="M16 2v4" />
      <Path d="M8 2v4" />
      <Path d="M3 10h18" />
    </Svg>
  );
}

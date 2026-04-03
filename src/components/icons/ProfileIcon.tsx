import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface ProfileIconProps {
  size?: number;
  color?: string;
}

export default function ProfileIcon({ size = 24, color = 'currentColor' }: ProfileIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

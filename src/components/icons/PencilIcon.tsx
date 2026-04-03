import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PencilIconProps {
  size?: number;
  color?: string;
}

export default function PencilIcon({ size = 24, color = 'currentColor' }: PencilIconProps) {
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
      <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <Path d="m15 5 4 4" />
    </Svg>
  );
}

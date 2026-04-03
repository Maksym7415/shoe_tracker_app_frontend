import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ChevronLeftIconProps {
  size?: number;
  color?: string;
}

export default function ChevronLeftIcon({
  size = 24,
  color = 'currentColor',
}: ChevronLeftIconProps) {
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
      <Path d="m15 18-6-6 6-6" />
    </Svg>
  );
}

import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ChevronRightIconProps {
  size?: number;
  color?: string;
}

export default function ChevronRightIcon({
  size = 24,
  color = 'currentColor',
}: ChevronRightIconProps) {
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
      <Path d="m9 6 6 6-6 6" />
    </Svg>
  );
}

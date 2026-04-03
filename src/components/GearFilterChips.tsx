import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { ActivityFilterType } from '../utils/activityType';

export type GearFilterOption = { value: ActivityFilterType; label: string };

type Props = {
  value: ActivityFilterType;
  options: GearFilterOption[];
  onChange: (value: ActivityFilterType) => void;
};

export function GearFilterChips({ value, options, onChange }: Props) {
  const { tokens } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterRow}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.filterChip,
              {
                backgroundColor: isActive ? tokens.filterActiveBg : tokens.filterInactiveBg,
              },
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: isActive ? tokens.filterActiveColor : tokens.filterInactiveColor,
                  fontSize: tokens.filterFontSize,
                  fontWeight: tokens.filterFontWeight,
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    maxHeight: 44,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 100,
    height: 28,
  },
  filterChipText: {},
});

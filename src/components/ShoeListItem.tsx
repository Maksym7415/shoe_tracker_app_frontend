import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDistance } from '../utils/formatDistance';
import { StarIcon } from './icons';
import type { Gear } from '../types';

type FilterType = 'all' | 'run' | 'ride' | 'swim' | 'other';

function normalizeActivityType(type: string): FilterType {
  const t = type.toLowerCase();
  if (t.includes('run') || t === 'running' || t === 'walking' || t === 'trail' || t === 'track') return 'run';
  if (t.includes('ride') || t.includes('cycl') || t === 'bike') return 'ride';
  if (t.includes('swim')) return 'swim';
  return 'other';
}

function getBadgeStyle(filterType: FilterType, t: ReturnType<typeof useTheme>['tokens']) {
  switch (filterType) {
    case 'run':
      return { color: t.badgeRunColor, backgroundColor: t.badgeRunBg };
    case 'ride':
      return { color: t.badgeRideColor, backgroundColor: t.badgeRideBg };
    case 'swim':
      return { color: t.badgeSwimColor, backgroundColor: t.badgeSwimBg };
    default:
      return { color: t.badgeOtherColor, backgroundColor: t.badgeOtherBg };
  }
}

function filterTypeLabel(filterType: FilterType): string {
  switch (filterType) {
    case 'run': return 'Run';
    case 'ride': return 'Ride';
    case 'swim': return 'Swim';
    case 'other': return 'Other';
    default: return filterType;
  }
}

interface ShoeListItemProps {
  gear: Gear;
  showActivityTypeBadge: boolean;
  onPress: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onRetire?: () => void;
}

export default function ShoeListItem({
  gear,
  showActivityTypeBadge,
  onPress,
  onSetDefault,
  onDelete,
  onRetire,
}: ShoeListItemProps) {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const unit = user?.preferred_distance_unit ?? 'km';
  const filterType = normalizeActivityType(gear.activity_type);
  const badgeStyle = getBadgeStyle(filterType, tokens);

  const gearName = gear.nick?.trim() ? gear.nick : `${gear.brand} ${gear.model}`;
  const subtitle = gear.nick?.trim() ? `${gear.brand} ${gear.model}` : null;
  const mileage = formatDistance(gear.value_covered ?? 0, unit);

  const isRetired = gear.status === 'retired';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: tokens.cardBackground,
          borderColor: tokens.cardBorder,
          borderRadius: tokens.cardBorderRadius,
          opacity: isRetired ? 0.7 : 1,
        },
      ]}
      onPress={onPress}
      onLongPress={() => {
        const options: Array<{ text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }> = [];
        if (!gear.is_default && !isRetired) {
          options.push({ text: 'Set as default', onPress: onSetDefault });
        }
        if (!isRetired && onRetire) {
          options.push({ text: 'Retire', onPress: onRetire });
        }
        options.push({ text: 'Delete', style: 'destructive', onPress: onDelete });
        options.push({ text: 'Cancel', style: 'cancel' });
        Alert.alert(gear.nick || `${gear.brand} ${gear.model}`, undefined, options);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.main}>
          <View style={styles.header}>
            <Text
              style={[
                styles.headerText,
                {
                  color: tokens.gearItemHeaderColor,
                  fontSize: tokens.gearItemHeaderFontSize,
                  fontWeight: tokens.gearItemHeaderFontWeight,
                  fontFamily: tokens.gearItemHeaderFontFamily,
                },
              ]}
              numberOfLines={1}
            >
              {gearName}
            </Text>
            {gear.is_default && (
              <View style={[styles.defaultBadge, { backgroundColor: tokens.accent + '26' }]}>
                <StarIcon size={12} color={tokens.gearItemDefaultBadgeColor} />
                <Text style={[styles.defaultText, { color: tokens.gearItemDefaultBadgeColor, fontSize: tokens.gearItemDefaultBadgeFontSize }]}>DEFAULT</Text>
              </View>
            )}
            {isRetired && (
              <View style={[styles.retiredBadge, { backgroundColor: tokens.cardBorder }]}>
                <Text style={[styles.retiredText, { color: tokens.textSecondary }]}>RETIRED</Text>
              </View>
            )}
          </View>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: tokens.gearItemSubtitleColor, fontSize: tokens.gearItemSubtitleFontSize },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
          <Text style={[styles.mileage, { color: tokens.gearItemMileageColor }]}>{mileage}</Text>
        </View>
        {showActivityTypeBadge && (
          <View style={[styles.typeBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
            <Text style={[styles.typeBadgeText, { color: badgeStyle.color, fontSize: tokens.badgeFontSize, fontWeight: tokens.badgeFontWeight }]}>
              {filterTypeLabel(filterType)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  main: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  headerText: {
    flex: 0,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  defaultText: {
    fontWeight: '600',
  },
  retiredBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  retiredText: {
    fontSize: 10,
    fontWeight: '600',
  },
  subtitle: {
    marginBottom: 4,
  },
  mileage: {
    fontSize: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  typeBadgeText: {},
});

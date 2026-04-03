import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDistance } from '../utils/formatDistance';
import { getActivityBadge } from '../utils/activityBadge';
import { StarIcon, ChevronRightIcon } from './icons';
import type { Gear } from '../types';

interface ShoeListItemProps {
  gear: Gear;
  showActivityTypeBadge: boolean;
  componentsCount?: number;
  onPress: () => void;
  onPressComponents?: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onRetire?: () => void;
}

export default function ShoeListItem({
  gear,
  showActivityTypeBadge,
  componentsCount = 0,
  onPress,
  onPressComponents,
  onSetDefault,
  onDelete,
  onRetire,
}: ShoeListItemProps) {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const unit = user?.preferred_distance_unit ?? 'km';
  const badge = getActivityBadge(tokens, gear.activity_type);

  const gearName = gear.nick?.trim() ? gear.nick : `${gear.brand} ${gear.model}`;
  const subtitle = gear.nick?.trim() ? `${gear.brand} ${gear.model}` : null;
  const mileage = formatDistance(gear.value_covered ?? 0, unit);

  const isRetired = gear.status === 'retired';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.cardBackground,
          borderColor: tokens.cardBorder,
          borderRadius: tokens.cardBorderRadius,
          opacity: isRetired ? 0.7 : 1,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={() => {
          const options: Array<{
            text: string;
            style?: 'cancel' | 'destructive';
            onPress?: () => void;
          }> = [];
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
                  <Text
                    style={[
                      styles.defaultText,
                      {
                        color: tokens.gearItemDefaultBadgeColor,
                        fontSize: tokens.gearItemDefaultBadgeFontSize,
                      },
                    ]}
                  >
                    DEFAULT
                  </Text>
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
                  {
                    color: tokens.gearItemSubtitleColor,
                    fontSize: tokens.gearItemSubtitleFontSize,
                  },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
            <Text style={[styles.mileage, { color: tokens.gearItemMileageColor }]}>{mileage}</Text>
          </View>
          {showActivityTypeBadge && (
            <View style={[styles.typeBadge, { backgroundColor: badge.backgroundColor }]}>
              <Text
                style={[
                  styles.typeBadgeText,
                  {
                    color: badge.textColor,
                    fontSize: tokens.badgeFontSize,
                    fontWeight: tokens.badgeFontWeight,
                  },
                ]}
              >
                {badge.label}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {componentsCount > 0 && onPressComponents && (
        <TouchableOpacity
          style={[styles.componentsSection, { borderTopColor: tokens.cardBorder }]}
          onPress={onPressComponents}
          activeOpacity={0.7}
        >
          <Text style={[styles.componentsText, { color: tokens.accent }]}>
            {componentsCount === 1 ? '1 component' : `${componentsCount} components`}
          </Text>
          <ChevronRightIcon size={16} color={tokens.accent} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
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
  componentsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  componentsText: {
    fontSize: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  typeBadgeText: {},
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDistance } from '../utils/formatDistance';
import { ShoesActivityIcon } from './icons';
import type { Activity } from '../types';

type FilterType = 'run' | 'ride' | 'swim' | 'other';

function getBadgeStyle(type: FilterType, t: ReturnType<typeof useTheme>['tokens']) {
  switch (type) {
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

function normalizeActivityType(type: string): FilterType {
  const t = type.toLowerCase();
  if (t.includes('run') || t === 'running' || t === 'walking' || t === 'trail' || t === 'track') return 'run';
  if (t.includes('ride') || t.includes('cycl') || t === 'bike') return 'ride';
  if (t.includes('swim')) return 'swim';
  return 'other';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

interface ActivityListItemProps {
  activity: Activity;
  activityType?: string;
  primaryGearName?: string;
  onPress: () => void;
  onDelete: () => void;
}

export default function ActivityListItem({
  activity,
  activityType,
  primaryGearName,
  onPress,
  onDelete,
}: ActivityListItemProps) {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const unit = user?.preferred_distance_unit ?? 'km';
  const filterType = activityType ? normalizeActivityType(activityType) : 'other';
  const badgeStyle = getBadgeStyle(filterType, tokens);

  const typeLabel = filterType === 'run' ? 'Run' : filterType === 'ride' ? 'Ride' : filterType === 'swim' ? 'Swim' : 'Other';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: tokens.cardBackground,
          borderColor: tokens.cardBorder,
          borderRadius: tokens.cardBorderRadius,
        },
      ]}
      onPress={onPress}
      onLongPress={() => {
        Alert.alert(
          activity.name,
          undefined,
          [
            { text: 'Delete', style: 'destructive', onPress: onDelete },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                color: tokens.activityTitleColor,
                fontSize: tokens.activityTitleFontSize,
                fontWeight: tokens.activityTitleFontWeight,
                fontFamily: tokens.activityTitleFontFamily,
              },
            ]}
            numberOfLines={1}
          >
            {activity.name}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
            <Text style={[styles.typeBadgeText, { color: badgeStyle.color, fontSize: tokens.badgeFontSize, fontWeight: tokens.badgeFontWeight }]}>
              {typeLabel}
            </Text>
          </View>
        </View>
        <View style={styles.dateSourceRow}>
          <Text style={[styles.date, { color: tokens.activityDateColor, fontSize: tokens.activityDateFontSize }]}>
            {formatDate(activity.date)}
          </Text>
          <Text style={[styles.dot, { color: tokens.textSecondary }]}> • </Text>
          <Text
            style={[
              styles.source,
              { color: activity.source === 'strava' ? tokens.activityStravaColor : tokens.activityManualColor },
            ]}
          >
            {activity.source === 'strava' ? 'Strava' : 'Manual'}
          </Text>
        </View>
      </View>
      <View style={styles.details}>
        <Text
          style={[
            styles.distance,
            {
              color: tokens.activityDistanceColor,
              fontSize: tokens.activityDistanceFontSize,
              fontWeight: tokens.activityDistanceFontWeight,
            },
          ]}
        >
          {formatDistance(activity.total_distance_km, unit)}
        </Text>
        {primaryGearName ? (
          <View style={styles.gearRow}>
            <ShoesActivityIcon size={14} color={tokens.activityMetaColor} />
            <Text style={[styles.gearText, { color: tokens.activityMetaColor, fontSize: tokens.activityMetaFontSize }]}>
              {primaryGearName}
            </Text>
          </View>
        ) : null}
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
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  typeBadgeText: {},
  dateSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {},
  dot: {
    fontSize: 12,
  },
  source: {
    fontSize: 12,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  distance: {},
  gearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gearText: {},
});

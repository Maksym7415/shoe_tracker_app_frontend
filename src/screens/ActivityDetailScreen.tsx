import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainRoutes, type MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { convertKmToMiles } from '../utils/formatDistance';
import { getActivityBadge } from '../utils/activityBadge';
import { PencilIcon, ShoesActivityIcon } from '../components/icons';
import ActivityGearCard from '../components/ActivityGearCard';
import { activitiesApi } from '../api/activities';
import { gearApi } from '../api/gear';
import type { Activity, ActivityGear, Gear } from '../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Activities/Detail'>;

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}`;
  }
  return `${m}`;
}

function getGearId(g: ActivityGear | { shoe_id: number }): number {
  return 'gear_id' in g ? g.gear_id : (g as { shoe_id: number }).shoe_id;
}

export default function ActivityDetailScreen({ route, navigation }: Props) {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const unit = user?.preferred_distance_unit ?? 'km';
  const activityId = route.params.id;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [gearMap, setGearMap] = useState<Map<number, Gear>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [activityRes, shoesRes, bikesRes] = await Promise.all([
        activitiesApi.get(activityId),
        gearApi.list({ gear_type: 'shoe' }),
        gearApi.list({ gear_type: 'bike' }),
      ]);
      const a = activityRes.activity;
      setActivity(a);

      const allGear = [...(shoesRes.gear ?? []), ...(bikesRes.gear ?? [])];
      const map = new Map<number, Gear>();
      allGear.forEach((g) => map.set(g.id, g));
      setGearMap(map);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? 'Failed to load activity');
      setActivity(null);
      setGearMap(new Map());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activityId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate(MainRoutes.ActivitiesEdit, { id: activityId })}
          style={styles.headerButton}
        >
          <PencilIcon size={22} color={tokens.pageTitleColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, activityId, tokens.pageTitleColor]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const parentGearItems = useMemo(() => {
    if (!activity) return [];
    const gearItems = (activity.gear ?? activity.shoes ?? []) as Array<
      ActivityGear | { shoe_id: number; distance_km?: number; value?: number }
    >;
    return gearItems.filter((g) => gearMap.has(getGearId(g)));
  }, [activity, gearMap]);

  if (loading && !activity) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <ActivityIndicator size="large" color={tokens.loadingIndicator} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (error && !activity) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: tokens.accent }]}
          onPress={() => fetchData()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!activity) return null;

  const badge = getActivityBadge(tokens, activity.activity_type);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.pageBackground }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tokens.accent]} />
      }
    >
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.title,
            { color: tokens.activityTitleColor, fontFamily: tokens.activityTitleFontFamily },
          ]}
        >
          {activity.name}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={[styles.typeBadgeText, { color: badge.textColor }]}>{badge.label}</Text>
        </View>
      </View>

      <Text style={[styles.date, { color: tokens.activityDateColor }]}>
        {formatDateLong(activity.date)}
      </Text>

      <View style={styles.metricsRow}>
        <View style={styles.metricBlock}>
          <Text style={[styles.metricValue, { color: tokens.activityDistanceColor }]}>
            {unit === 'miles'
              ? convertKmToMiles(activity.total_distance_km).toFixed(1)
              : Number(activity.total_distance_km).toFixed(1)}
          </Text>
          <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>
            {unit === 'km' ? 'km' : 'mi'}
          </Text>
        </View>
        {activity.moving_time_seconds != null && activity.moving_time_seconds > 0 && (
          <View style={styles.metricBlock}>
            <Text style={[styles.metricValue, { color: tokens.activityDistanceColor }]}>
              {formatDuration(activity.moving_time_seconds)}
            </Text>
            <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>duration</Text>
          </View>
        )}
        <View
          style={[
            styles.sourceBadge,
            {
              backgroundColor:
                activity.source === 'strava'
                  ? tokens.activityStravaColor + '26'
                  : tokens.activityManualColor + '26',
            },
          ]}
        >
          <Text
            style={[
              styles.sourceBadgeText,
              {
                color:
                  activity.source === 'strava'
                    ? tokens.activityStravaColor
                    : tokens.activityManualColor,
              },
            ]}
          >
            {activity.source === 'strava' ? 'Strava' : 'Manual'}
          </Text>
        </View>
      </View>

      <View style={styles.gearSection}>
        <View style={styles.gearSectionHeader}>
          <ShoesActivityIcon size={18} color={tokens.textSecondary} />
          <Text style={[styles.gearSectionTitle, { color: tokens.pageTitleColor }]}>Gear</Text>
        </View>
        {parentGearItems.length === 0 ? (
          <Text style={[styles.emptyGear, { color: tokens.textSecondary }]}>No gear assigned</Text>
        ) : (
          parentGearItems.map((g) => {
            const gearId = getGearId(g);
            const gear = gearMap.get(gearId);
            if (!gear) return null;
            const gearName = gear.nick?.trim() ? gear.nick : `${gear.brand} ${gear.model}`;
            const gearSubtitle = gear.nick?.trim() ? `${gear.brand} ${gear.model}` : gear.brand;
            const rawVal = 'value' in g ? g.value : (g as { distance_km?: number }).distance_km;
            const value = Number(rawVal) || 0;
            const activeIds = (g as ActivityGear).active_component_ids ?? [];
            const excludedIds = (g as ActivityGear).excluded_component_ids ?? [];
            const componentsCount = activeIds.length + excludedIds.length;

            return (
              <ActivityGearCard
                key={gearId}
                gearId={gearId}
                gearName={gearName}
                gearSubtitle={gearSubtitle}
                value={value}
                componentsCount={componentsCount}
                excludedComponentIds={excludedIds}
                editable={false}
                unit={unit}
              />
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 24,
    marginBottom: 28,
  },
  metricBlock: {
    alignItems: 'flex-start',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    alignSelf: 'flex-end',
  },
  sourceBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  gearSection: {
    marginTop: 8,
  },
  gearSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  gearSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyGear: {
    fontSize: 14,
  },
});

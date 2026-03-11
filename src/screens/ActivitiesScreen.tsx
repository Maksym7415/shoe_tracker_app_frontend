import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon } from '../components/icons';
import { activitiesApi } from '../api/activities';
import { gearApi } from '../api/gear';
import type { Activity, Gear } from '../types';
import ActivityListItem from '../components/ActivityListItem';

type Props = NativeStackScreenProps<MainStackParamList, 'Activities'>;

function getPrimaryGear(
  activity: Activity,
  gearMap: Map<number, Gear>
): { activityType: string; name: string } | null {
  const gearItems = activity.gear ?? activity.shoes;
  if (!gearItems || gearItems.length === 0) return null;
  const first = gearItems[0];
  const gearId = 'gear_id' in first ? first.gear_id : first.shoe_id;
  const gear = gearMap.get(gearId);
  if (!gear) return null;
  const name = gear.nick?.trim() ? gear.nick : `${gear.brand} ${gear.model}`;
  return { activityType: gear.activity_type, name };
}

export default function ActivitiesScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [gearList, setGearList] = useState<Gear[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [activitiesRes, gearRes] = await Promise.all([
        activitiesApi.list(),
        gearApi.list({ gear_type: 'shoe' }),
      ]);
      setActivities(activitiesRes.activities ?? []);
      setGearList(gearRes.gear ?? []);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? 'Failed to load activities');
      setActivities([]);
      setGearList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const gearMap = useMemo(() => {
    const m = new Map<number, Gear>();
    gearList.forEach((g) => m.set(g.id, g));
    return m;
  }, [gearList]);

  const handleDelete = useCallback((activity: Activity) => {
    Alert.alert(
      'Delete activity',
      `Delete "${activity.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await activitiesApi.remove(activity.id);
              setActivities((prev) => prev.filter((a) => a.id !== activity.id));
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                  : null;
              Alert.alert('Error', msg ?? 'Failed to delete activity');
            }
          },
        },
      ]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Activity }) => {
      const primary = getPrimaryGear(item, gearMap);
      const activityType = item.activity_type ?? primary?.activityType;
      return (
        <ActivityListItem
          activity={item}
          activityType={activityType}
          primaryGearName={primary?.name}
          onPress={() => navigation.navigate('Activities/Edit', { id: item.id })}
          onDelete={() => handleDelete(item)}
        />
      );
    },
    [navigation, handleDelete, gearMap]
  );

  if (loading && activities.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <ActivityIndicator size="large" color={tokens.loadingIndicator} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>Loading activities…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.pageBackground }]}>
      {error && activities.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: tokens.accent }]}
            onPress={() => fetchData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={activities}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={
              activities.length === 0 ? styles.emptyList : styles.listContent
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyTitle, { color: tokens.pageTitleColor, fontFamily: tokens.pageTitleFontFamily }]}>No activities yet</Text>
                <Text style={[styles.emptySubtitle, { color: tokens.textSecondary }]}>
                  Add your first activity to start tracking.
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[tokens.accent]}
              />
            }
          />
          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: tokens.fabBackground,
                width: tokens.fabSize,
                height: tokens.fabSize,
                borderRadius: tokens.fabSize / 2,
              },
            ]}
            onPress={() => navigation.navigate('Activities/Add')}
          >
            <PlusIcon size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </View>
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
  listContent: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

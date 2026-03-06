import React, { useState, useCallback } from 'react';
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
import { activitiesApi } from '../api/activities';
import type { Activity } from '../types';
import ActivityListItem from '../components/ActivityListItem';

type Props = NativeStackScreenProps<MainStackParamList, 'Activities'>;

export default function ActivitiesScreen({ navigation }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setError(null);
      const data = await activitiesApi.list();
      setActivities(data.activities ?? []);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : null;
      setError(msg ?? 'Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchActivities();
    }, [fetchActivities])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActivities();
  }, [fetchActivities]);

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
                  ? (err as {
                      response?: { data?: { error?: string } };
                    }).response?.data?.error
                  : null;
              Alert.alert('Error', msg ?? 'Failed to delete activity');
            }
          },
        },
      ]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Activity }) => (
      <ActivityListItem
        activity={item}
        onPress={() => navigation.navigate('Activities/Edit', { id: item.id })}
        onDelete={() => handleDelete(item)}
      />
    ),
    [navigation, handleDelete]
  );

  if (loading && activities.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading activities…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && activities.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchActivities()}
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
                <Text style={styles.emptyTitle}>No activities yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your first activity to start tracking.
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2563eb']}
              />
            }
          />
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('Activities/Add')}
          >
            <Text style={styles.fabText}>+ Add Activity</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

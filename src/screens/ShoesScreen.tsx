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
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon } from '../components/icons';
import { gearApi } from '../api/gear';
import type { Gear } from '../types';
import ShoeListItem from '../components/ShoeListItem';

type Props = NativeStackScreenProps<MainStackParamList, 'Shoes'>;

type FilterValue = 'all' | 'run' | 'ride' | 'swim' | 'other';

function normalizeActivityType(type: string): FilterValue {
  const t = type.toLowerCase();
  if (t.includes('run') || t === 'running' || t === 'walking' || t === 'trail' || t === 'track') return 'run';
  if (t.includes('ride') || t.includes('cycl') || t === 'bike') return 'ride';
  if (t.includes('swim')) return 'swim';
  return 'other';
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'run', label: 'Run' },
  { value: 'ride', label: 'Ride' },
  { value: 'swim', label: 'Swim' },
  { value: 'other', label: 'Other' },
];

export default function ShoesScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [gear, setGear] = useState<Gear[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');

  const fetchGear = useCallback(async () => {
    try {
      setError(null);
      const data = await gearApi.list({ gear_type: 'shoe' });
      setGear(data.gear ?? []);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? 'Failed to load gear');
      setGear([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchGear();
    }, [fetchGear])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGear();
  }, [fetchGear]);

  const filteredGear = useMemo(() => {
    if (filter === 'all') return gear;
    return gear.filter((g) => normalizeActivityType(g.activity_type) === filter);
  }, [gear, filter]);

  const handleSetDefault = useCallback(
    async (item: Gear) => {
      try {
        await gearApi.setDefault(item.id);
        const data = await gearApi.list({ gear_type: 'shoe' });
        setGear(data.gear ?? []);
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        Alert.alert('Error', msg ?? 'Failed to set default');
      }
    },
    []
  );

  const handleRetire = useCallback(
    async (item: Gear) => {
      try {
        await gearApi.retire(item.id);
        const data = await gearApi.list({ gear_type: 'shoe' });
        setGear(data.gear ?? []);
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        Alert.alert('Error', msg ?? 'Failed to retire gear');
      }
    },
    []
  );

  const handleDelete = useCallback((item: Gear) => {
    Alert.alert(
      'Delete gear',
      `Delete ${item.brand} ${item.model}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await gearApi.remove(item.id);
              setGear((prev) => prev.filter((g) => g.id !== item.id));
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                  : null;
              Alert.alert('Error', msg ?? 'Failed to delete gear');
            }
          },
        },
      ]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Gear }) => (
      <ShoeListItem
        gear={item}
        showActivityTypeBadge={filter === 'all'}
        onPress={() => navigation.navigate('Shoes/Detail', { id: item.id })}
        onSetDefault={() => handleSetDefault(item)}
        onDelete={() => handleDelete(item)}
        onRetire={() => handleRetire(item)}
      />
    ),
    [navigation, handleSetDefault, handleDelete, handleRetire, filter]
  );

  if (loading && gear.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <ActivityIndicator size="large" color={tokens.loadingIndicator} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>Loading gear…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.pageBackground }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const isActive = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? tokens.filterActiveBg : tokens.filterInactiveBg,
                },
              ]}
              onPress={() => setFilter(f.value)}
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
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error && gear.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: tokens.accent }]}
            onPress={() => fetchGear()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredGear}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={
              filteredGear.length === 0 ? styles.emptyList : styles.listContent
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyTitle, { color: tokens.pageTitleColor, fontFamily: tokens.pageTitleFontFamily }]}>No gear yet</Text>
                <Text style={[styles.emptySubtitle, { color: tokens.textSecondary }]}>
                  Add your first item to start tracking mileage.
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
            onPress={() => navigation.navigate('Shoes/Add')}
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
  },
  filterChipText: {},
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

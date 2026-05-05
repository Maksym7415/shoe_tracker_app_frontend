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
import { MainRoutes, type MainStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon } from '../components/icons';
import { normalizeActivityType, type ActivityFilterType } from '../utils/activityType';
import { gearApi } from '../api/gear';
import type { Gear } from '../types';
import ShoeListItem from '../components/ShoeListItem';
import { GearFilterChips } from '../components/GearFilterChips';
import { useGearList } from '../hooks/useGearList';

type Props = NativeStackScreenProps<MainStackParamList, 'Shoes/List'>;

type FilterValue = ActivityFilterType;

const FILTERS: { value: ActivityFilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'run', label: 'Run' },
  { value: 'ride', label: 'Ride' },
  { value: 'swim', label: 'Swim' },
  { value: 'other', label: 'Other' },
];

export default function ShoesScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [filter, setFilter] = useState<FilterValue>('all');
  const { gear, componentsCountMap, loading, refreshing, error, refresh, refetch } = useGearList();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const filteredGear = useMemo(() => {
    if (filter === 'all') return gear;
    return gear.filter((g) => normalizeActivityType(g.activity_type) === filter);
  }, [gear, filter]);

  const handleSetDefault = useCallback(
    async (item: Gear) => {
      try {
        await gearApi.setDefault(item.id);

        refetch();
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        Alert.alert('Error', msg ?? 'Failed to set default');
      }
    },
    [refetch],
  );

  const handleRetire = useCallback(
    async (item: Gear) => {
      try {
        await gearApi.retire(item.id);

        refetch();
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        Alert.alert('Error', msg ?? 'Failed to retire gear');
      }
    },
    [refetch],
  );

  const handleDelete = useCallback(
    (item: Gear) => {
      Alert.alert('Delete gear', `Delete ${item.brand} ${item.model}? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await gearApi.remove(item.id);
              refetch();
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                  : null;
              Alert.alert('Error', msg ?? 'Failed to delete gear');
            }
          },
        },
      ]);
    },
    [refetch],
  );

  const renderItem = useCallback(
    ({ item }: { item: Gear }) => {
      const count = componentsCountMap.get(item.id) ?? 0;
      return (
        <ShoeListItem
          gear={item}
          showActivityTypeBadge={filter === 'all'}
          componentsCount={count}
          onPress={() => navigation.navigate(MainRoutes.ShoesDetail, { id: item.id })}
          onPressComponents={
            count > 0
              ? () => navigation.navigate(MainRoutes.ShoesComponents, { parentId: item.id })
              : undefined
          }
          onSetDefault={() => handleSetDefault(item)}
          onDelete={() => handleDelete(item)}
          onRetire={() => handleRetire(item)}
        />
      );
    },
    [navigation, componentsCountMap, handleSetDefault, handleDelete, handleRetire, filter],
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
      <GearFilterChips value={filter} options={FILTERS} onChange={setFilter} />

      {error && gear.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: tokens.accent }]}
            onPress={() => refetch()}
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
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: tokens.pageTitleColor, fontFamily: tokens.pageTitleFontFamily },
                  ]}
                >
                  No gear yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: tokens.textSecondary }]}>
                  Add your first item to start tracking mileage.
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
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
            onPress={() => navigation.navigate(MainRoutes.ShoesAdd)}
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

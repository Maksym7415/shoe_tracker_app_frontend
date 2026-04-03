import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainRoutes, type MainStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronLeftIcon } from '../components/icons';
import { gearApi } from '../api/gear';
import type { Gear } from '../types';
import ShoeListItem from '../components/ShoeListItem';

type Props = NativeStackScreenProps<MainStackParamList, 'Shoes/Components'>;

export default function GearComponentsScreen({ route, navigation }: Props) {
  const { tokens } = useTheme();
  const parentId = route.params.parentId;
  const [parentName, setParentName] = useState<string>('');
  const [components, setComponents] = useState<Gear[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [parentRes, componentsRes] = await Promise.all([
        gearApi.get(parentId),
        gearApi.getComponents(parentId),
      ]);
      const name = parentRes.gear.nick?.trim()
        ? parentRes.gear.nick
        : `${parentRes.gear.brand} ${parentRes.gear.model}`;
      setParentName(name);
      setComponents(componentsRes.components ?? []);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? 'Failed to load components');
      setParentName('');
      setComponents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parentId]);

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

  const handleSetDefault = useCallback(
    async (item: Gear) => {
      try {
        await gearApi.setDefault(item.id);
        fetchData();
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        Alert.alert('Error', msg ?? 'Failed to set default');
      }
    },
    [fetchData],
  );

  const handleRetire = useCallback(
    async (item: Gear) => {
      try {
        await gearApi.retire(item.id);
        fetchData();
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        Alert.alert('Error', msg ?? 'Failed to retire');
      }
    },
    [fetchData],
  );

  const handleDelete = useCallback((item: Gear) => {
    Alert.alert('Delete gear', `Delete ${item.brand} ${item.model}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await gearApi.remove(item.id);
            setComponents((prev) => prev.filter((g) => g.id !== item.id));
          } catch (err: unknown) {
            const msg =
              err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                : null;
            Alert.alert('Error', msg ?? 'Failed to delete');
          }
        },
      },
    ]);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Gear }) => (
      <ShoeListItem
        gear={item}
        showActivityTypeBadge={true}
        onPress={() => navigation.navigate(MainRoutes.ShoesDetail, { id: item.id })}
        onSetDefault={() => handleSetDefault(item)}
        onDelete={() => handleDelete(item)}
        onRetire={() => handleRetire(item)}
      />
    ),
    [navigation, handleSetDefault, handleDelete, handleRetire],
  );

  if (loading && components.length === 0 && !parentName) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <ActivityIndicator size="large" color={tokens.loadingIndicator} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (error && components.length === 0) {
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

  return (
    <View style={[styles.container, { backgroundColor: tokens.pageBackground }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ChevronLeftIcon size={20} color={tokens.accent} />
        <Text style={[styles.backButtonText, { color: tokens.accent }]}>Back to all gear</Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.title,
          { color: tokens.pageTitleColor, fontFamily: tokens.pageTitleFontFamily },
        ]}
      >
        Components of {parentName}
      </Text>

      <FlatList
        data={components}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={components.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: tokens.textSecondary }]}>
              No components linked to this gear.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tokens.accent]} />
        }
      />
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
    paddingTop: 24,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

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
import { shoesApi } from '../api/shoes';
import type { Shoe } from '../types';
import ShoeListItem from '../components/ShoeListItem';

type Props = NativeStackScreenProps<MainStackParamList, 'Shoes'>;

export default function ShoesScreen({ navigation }: Props) {
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShoes = useCallback(async () => {
    try {
      setError(null);
      const data = await shoesApi.list();
      setShoes(data.shoes ?? []);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? 'Failed to load shoes');
      setShoes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchShoes();
    }, [fetchShoes])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShoes();
  }, [fetchShoes]);

  const handleSetDefault = useCallback(
    async (shoe: Shoe) => {
      try {
        await shoesApi.setDefault(shoe.id);
        const data = await shoesApi.list();
        setShoes(data.shoes ?? []);
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : null;
        Alert.alert('Error', msg ?? 'Failed to set default shoe');
      }
    },
    []
  );

  const handleDelete = useCallback((shoe: Shoe) => {
    Alert.alert(
      'Delete shoe',
      `Delete ${shoe.brand} ${shoe.model}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await shoesApi.remove(shoe.id);
              setShoes((prev) => prev.filter((s) => s.id !== shoe.id));
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                  : null;
              Alert.alert('Error', msg ?? 'Failed to delete shoe');
            }
          },
        },
      ]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Shoe }) => (
      <ShoeListItem
        shoe={item}
        onPress={() => navigation.navigate('Shoes/Edit', { id: item.id })}
        onSetDefault={() => handleSetDefault(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [navigation, handleSetDefault, handleDelete]
  );

  if (loading && shoes.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading shoes…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && shoes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchShoes()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={shoes}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={
              shoes.length === 0 ? styles.emptyList : styles.listContent
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No shoes yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your first pair to start tracking mileage.
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
            onPress={() => navigation.navigate('Shoes/Add')}
          >
            <Text style={styles.fabText}>+ Add Shoe</Text>
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

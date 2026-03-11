import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDistance } from '../utils/formatDistance';
import { gearApi } from '../api/gear';
import type { Gear, Service } from '../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Shoes/Detail'>;

export default function GearDetailScreen({ route, navigation }: Props) {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const unit = user?.preferred_distance_unit ?? 'km';
  const gearId = route.params.id;
  const [gear, setGear] = useState<Gear & { installations?: unknown[]; services?: Service[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGear = useCallback(async () => {
    try {
      setError(null);
      const data = await gearApi.get(gearId);
      setGear(data.gear);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? 'Failed to load gear');
      setGear(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gearId]);

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

  const handleRetire = useCallback(() => {
    if (!gear) return;
    Alert.alert(
      'Retire gear',
      `Retire ${gear.brand} ${gear.model}? You can still view it but it won't appear in activity assignment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retire',
          style: 'destructive',
          onPress: async () => {
            try {
              await gearApi.retire(gearId);
              navigation.goBack();
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                  : null;
              Alert.alert('Error', msg ?? 'Failed to retire gear');
            }
          },
        },
      ]
    );
  }, [gear, gearId, navigation]);

  if (loading && !gear) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <ActivityIndicator size="large" color={tokens.loadingIndicator} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (error && !gear) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: tokens.accent }]}
          onPress={() => fetchGear()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!gear) return null;

  const gearName = gear.nick?.trim() ? gear.nick : `${gear.brand} ${gear.model}`;
  const mileage = formatDistance(gear.value_covered ?? 0, unit);
  const maxMileage = formatDistance(gear.max_value ?? 0, unit);
  const isRetired = gear.status === 'retired';
  const services = gear.services ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.pageBackground }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tokens.accent]} />
      }
    >
      <View style={[styles.card, { backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder, borderRadius: tokens.cardBorderRadius }]}>
        <Text style={[styles.title, { color: tokens.pageTitleColor }]}>{gearName}</Text>
        <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
          {gear.brand} {gear.model}
        </Text>
        <View style={styles.statsRow}>
          <Text style={[styles.statLabel, { color: tokens.textSecondary }]}>Distance: </Text>
          <Text style={[styles.statValue, { color: tokens.pageTitleColor }]}>{mileage} / {maxMileage}</Text>
        </View>
        {isRetired && (
          <View style={[styles.retiredBadge, { backgroundColor: tokens.cardBorder }]}>
            <Text style={[styles.retiredText, { color: tokens.textSecondary }]}>RETIRED</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {!isRetired && (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: tokens.accent }]}
              onPress={() => navigation.navigate('Shoes/Edit', { id: gearId })}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.retireButton, { borderColor: tokens.cardBorder }]}
              onPress={handleRetire}
            >
              <Text style={[styles.retireButtonText, { color: tokens.textSecondary }]}>Retire</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {services.length > 0 ? (
        <View style={[styles.card, { backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder, borderRadius: tokens.cardBorderRadius }]}>
          <Text style={[styles.sectionTitle, { color: tokens.pageTitleColor }]}>Services</Text>
          {services.map((s) => (
            <View key={s.id} style={[styles.serviceRow, { borderBottomColor: tokens.cardBorder }]}>
              <Text style={[styles.serviceName, { color: tokens.pageTitleColor }]}>{s.name}</Text>
              <Text style={[styles.serviceDetail, { color: tokens.textSecondary }]}>
                Every {s.interval_value} {s.interval_unit}
                {s.last_performed_value != null ? ` · Last at ${s.last_performed_value} ${s.interval_unit}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
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
  card: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  retiredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  retiredText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retireButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  retireButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  serviceRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  serviceDetail: {
    fontSize: 13,
  },
});

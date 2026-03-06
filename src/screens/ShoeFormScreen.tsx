import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { shoesApi } from '../api/shoes';

type Props = NativeStackScreenProps<MainStackParamList, 'Shoes/Add' | 'Shoes/Edit'>;

const ACTIVITY_TYPES = ['running', 'walking', 'trail', 'track'];

export default function ShoeFormScreen({ route, navigation }: Props) {
  const isEdit = route.name === 'Shoes/Edit';
  const shoeId = isEdit ? route.params.id : null;

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [activityType, setActivityType] = useState('running');
  const [nick, setNick] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState('');
  const [distanceCoveredKm, setDistanceCoveredKm] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseNum = (s: string): number | null => {
    const t = s.trim();
    if (t === '') return null;
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
  };

  useFocusEffect(
    useCallback(() => {
      if (!isEdit || shoeId == null) {
        setBrand('');
        setModel('');
        setActivityType('running');
        setNick('');
        setMaxDistanceKm('');
        setDistanceCoveredKm('');
        setError(null);
        setLoading(false);
        return;
      }
      let cancelled = false;
      setLoading(true);
      setError(null);
      shoesApi
        .get(shoeId)
        .then((data) => {
          if (cancelled) return;
          const s = data.shoe;
          setBrand(s.brand);
          setModel(s.model);
          setActivityType(s.activity_type || 'running');
          setNick(s.nick ?? '');
          setMaxDistanceKm(s.max_distance_km != null ? Number(s.max_distance_km).toFixed(2) : '');
          setDistanceCoveredKm(
            s.distance_covered_km != null ? Number(s.distance_covered_km).toFixed(2) : ''
          );
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
              : null;
          setError(msg ?? 'Failed to load shoe');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [isEdit, shoeId])
  );

  const handleSubmit = useCallback(async () => {
    const b = brand.trim();
    const m = model.trim();
    if (!b || !m) {
      setError('Brand and model are required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (isEdit && shoeId != null) {
        const payload: Record<string, string | number | null> = {
          brand: b,
          model: m,
          activity_type: activityType,
          nick: nick.trim() || '',
          max_distance_km: parseNum(maxDistanceKm),
          distance_covered_km: parseNum(distanceCoveredKm),
        };
        await shoesApi.update(shoeId, payload);
      } else {
        await shoesApi.create({
          brand: b,
          model: m,
          activity_type: activityType,
          nick: nick.trim() || undefined,
          max_distance_km: parseNum(maxDistanceKm) ?? undefined,
        });
      }
      navigation.goBack();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }, [
    brand,
    model,
    activityType,
    nick,
    maxDistanceKm,
    distanceCoveredKm,
    isEdit,
    shoeId,
    navigation,
  ]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.label}>Brand *</Text>
        <TextInput
          style={styles.input}
          value={brand}
          onChangeText={setBrand}
          placeholder="e.g. Nike"
          placeholderTextColor="#999"
          editable={!submitting}
        />

        <Text style={styles.label}>Model *</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="e.g. Pegasus 40"
          placeholderTextColor="#999"
          editable={!submitting}
        />

        <Text style={styles.label}>Activity type</Text>
        <View style={styles.activityRow}>
          {ACTIVITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.activityChip,
                activityType === type && styles.activityChipActive,
              ]}
              onPress={() => setActivityType(type)}
              disabled={submitting}
            >
              <Text
                style={[
                  styles.activityChipText,
                  activityType === type && styles.activityChipTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Nickname (optional)</Text>
        <TextInput
          style={styles.input}
          value={nick}
          onChangeText={setNick}
          placeholder="e.g. Daily trainers"
          placeholderTextColor="#999"
          editable={!submitting}
        />

        <Text style={styles.label}>Max distance (km, optional)</Text>
        <TextInput
          style={styles.input}
          value={maxDistanceKm}
          onChangeText={setMaxDistanceKm}
          placeholder="e.g. 800"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          editable={!submitting}
        />

        {isEdit && (
          <>
            <Text style={styles.label}>Distance covered (km, optional)</Text>
            <TextInput
              style={styles.input}
              value={distanceCoveredKm}
              onChangeText={setDistanceCoveredKm}
              placeholder="e.g. 120"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              editable={!submitting}
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEdit ? 'Save changes' : 'Add shoe'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  activityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  activityChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  activityChipActive: {
    backgroundColor: '#2563eb',
  },
  activityChipText: {
    fontSize: 14,
    color: '#374151',
  },
  activityChipTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

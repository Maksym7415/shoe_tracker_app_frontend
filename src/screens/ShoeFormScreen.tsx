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
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronDownIcon } from '../components/icons';
import { gearApi } from '../api/gear';

type Props = NativeStackScreenProps<MainStackParamList, 'Shoes/Add' | 'Shoes/Edit'>;

const ACTIVITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'run', label: 'Running' },
  { value: 'ride', label: 'Bike' },
  { value: 'swim', label: 'Swim' },
  { value: 'walk', label: 'Walk' },
];

function mapActivityTypeFromApi(apiValue: string): string {
  const t = apiValue?.toLowerCase() ?? '';
  if (t === 'running' || t === 'run') return 'run';
  if (t === 'bike' || t === 'ride' || t.includes('cycl')) return 'ride';
  if (t === 'swim' || t.includes('swim')) return 'swim';
  if (t === 'walk' || t === 'walking' || t === 'trail' || t === 'track') return 'walk';
  return 'run';
}

const INPUT_HEIGHT = 40;

export default function ShoeFormScreen({ route, navigation }: Props) {
  const { tokens } = useTheme();
  const isEdit = route.name === 'Shoes/Edit';
  const gearId = isEdit && route.params ? route.params.id : null;

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [activityType, setActivityType] = useState('run');
  const [nick, setNick] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [valueCovered, setValueCovered] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const parseNum = (s: string): number | null => {
    const t = s.trim();
    if (t === '') return null;
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
  };

  const activityLabel = ACTIVITY_OPTIONS.find((o) => o.value === activityType)?.label ?? 'Running';

  useFocusEffect(
    useCallback(() => {
      if (!isEdit || gearId == null) {
        setBrand('');
        setModel('');
        setActivityType('run');
        setNick('');
        setMaxValue('');
        setValueCovered('');
        setError(null);
        setLoading(false);
        return;
      }
      let cancelled = false;
      setLoading(true);
      setError(null);
      gearApi
        .get(gearId)
        .then((data) => {
          if (cancelled) return;
          const g = data.gear;
          setBrand(g.brand);
          setModel(g.model);
          setActivityType(mapActivityTypeFromApi(g.activity_type || 'run'));
          setNick(g.nick ?? '');
          setMaxValue(g.max_value != null ? Number(g.max_value).toFixed(2) : '');
          setValueCovered(g.value_covered != null ? Number(g.value_covered).toFixed(2) : '');
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
              : null;
          setError(msg ?? 'Failed to load gear');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [isEdit, gearId])
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
      if (isEdit && gearId != null) {
        await gearApi.update(gearId, {
          brand: b,
          model: m,
          activity_type: activityType,
          nick: nick.trim() || undefined,
          max_value: parseNum(maxValue) ?? undefined,
          value_covered: parseNum(valueCovered) ?? undefined,
        });
      } else {
        await gearApi.create({
          activity_type: activityType,
          gear_type: 'shoe',
          metric_type: 'distance',
          brand: b,
          model: m,
          nick: nick.trim() || undefined,
          max_value: parseNum(maxValue) ?? 800,
          value_covered: parseNum(valueCovered) ?? 0,
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
    maxValue,
    valueCovered,
    isEdit,
    gearId,
    navigation,
  ]);

  const handleDelete = useCallback(() => {
    if (!isEdit || gearId == null) return;
    Alert.alert(
      'Delete gear',
      `Delete ${brand.trim() || 'this gear'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await gearApi.remove(gearId);
              navigation.goBack();
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                  : null;
              setError(msg ?? 'Failed to delete gear');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }, [isEdit, gearId, brand, navigation]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <ActivityIndicator size="large" color={tokens.loadingIndicator} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  const inputStyle = {
    height: INPUT_HEIGHT,
    backgroundColor: tokens.cardBackground,
    borderColor: tokens.cardBorder,
    borderRadius: tokens.cardBorderRadius,
    color: tokens.pageTitleColor,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tokens.pageBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text>
        ) : null}

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Brand *</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={brand}
          onChangeText={setBrand}
          placeholder="e.g. Nike"
          placeholderTextColor={tokens.profileSecondaryText}
          editable={!submitting}
        />

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Model *</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={model}
          onChangeText={setModel}
          placeholder="e.g. Pegasus 40"
          placeholderTextColor={tokens.profileSecondaryText}
          editable={!submitting}
        />

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Activity Type</Text>
        <TouchableOpacity
          style={[
            styles.dropdownTrigger,
            inputStyle,
            {
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
            },
          ]}
          onPress={() => !submitting && setDropdownVisible(true)}
          disabled={submitting}
        >
          <Text style={{ color: tokens.pageTitleColor, fontSize: 16 }}>{activityLabel}</Text>
          <ChevronDownIcon size={20} color={tokens.textSecondary} />
        </TouchableOpacity>

        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View
              style={[
                styles.dropdownModal,
                {
                  backgroundColor: tokens.cardBackground,
                  borderColor: tokens.cardBorder,
                  borderRadius: tokens.cardBorderRadius,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              {ACTIVITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.dropdownOption, { borderBottomColor: tokens.cardBorder }]}
                  onPress={() => {
                    setActivityType(opt.value);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: tokens.pageTitleColor }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Nickname</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={nick}
          onChangeText={setNick}
          placeholder="e.g. Daily trainers"
          placeholderTextColor={tokens.profileSecondaryText}
          editable={!submitting}
        />

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Max Distance (km)</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={maxValue}
          onChangeText={setMaxValue}
          placeholder="e.g. 800"
          placeholderTextColor={tokens.profileSecondaryText}
          keyboardType="decimal-pad"
          editable={!submitting}
        />

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Distance Covered (km)</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={valueCovered}
          onChangeText={setValueCovered}
          placeholder="e.g. 120"
          placeholderTextColor={tokens.profileSecondaryText}
          keyboardType="decimal-pad"
          editable={!submitting}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: tokens.accent },
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save</Text>
          )}
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: tokens.destructiveButtonBg }]}
            onPress={handleDelete}
            disabled={submitting}
          >
            <Text style={styles.deleteButtonText}>Delete Gear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  dropdownTrigger: {
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdownModal: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
  },
  submitButton: {
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
  deleteButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

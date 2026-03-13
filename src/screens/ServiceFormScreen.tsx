import React, { useState, useCallback, useLayoutEffect } from 'react';
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
import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronDownIcon, TrashIcon } from '../components/icons';
import { gearApi } from '../api/gear';

type Props = NativeStackScreenProps<MainStackParamList, 'Shoes/Service/Add' | 'Shoes/Service/Edit'>;

const INTERVAL_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: 'km', label: 'km' },
  { value: 'hours', label: 'Hours' },
  { value: 'sessions', label: 'Sessions' },
];

const INPUT_HEIGHT = 40;

export default function ServiceFormScreen({ route, navigation }: Props) {
  const { tokens } = useTheme();
  const isEdit = route.name === 'Shoes/Service/Edit';
  const gearId = route.params.gearId;
  const serviceId = isEdit && 'serviceId' in route.params ? route.params.serviceId : null;

  const [name, setName] = useState('');
  const [intervalValue, setIntervalValue] = useState('');
  const [intervalUnit, setIntervalUnit] = useState('km');
  const [earlyWarningPercent, setEarlyWarningPercent] = useState(80);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitDropdownVisible, setUnitDropdownVisible] = useState(false);

  const parseNum = (s: string): number | null => {
    const t = s.trim();
    if (t === '') return null;
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
  };

  const earlyWarningRatio = earlyWarningPercent / 100;
  const unitLabel = INTERVAL_UNIT_OPTIONS.find((o) => o.value === intervalUnit)?.label ?? 'km';

  const handleDelete = useCallback(() => {
    if (!isEdit || serviceId == null) return;
    Alert.alert(
      'Delete service',
      `Delete "${name.trim() || 'this service'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await gearApi.removeService(gearId, serviceId);
              navigation.goBack();
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                  : null;
              setError(msg ?? 'Failed to delete service');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }, [isEdit, serviceId, gearId, name, navigation]);

  useLayoutEffect(() => {
    if (!isEdit || serviceId == null) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.headerButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <TrashIcon size={22} color={tokens.textSecondary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEdit, serviceId, tokens.textSecondary, handleDelete]);

  useFocusEffect(
    useCallback(() => {
      if (!isEdit || serviceId == null) {
        setName('');
        setIntervalValue('');
        setIntervalUnit('km');
        setEarlyWarningPercent(80);
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
          const service = data.gear.services?.find((s) => s.id === serviceId);
          if (service) {
            setName(service.name);
            setIntervalValue(String(service.interval_value));
            setIntervalUnit(service.interval_unit || 'km');
            setEarlyWarningPercent(
              service.early_warning_ratio != null ? Math.round(service.early_warning_ratio * 100) : 80
            );
          }
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
              : null;
          setError(msg ?? 'Failed to load service');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [isEdit, gearId, serviceId])
  );

  const handleSubmit = useCallback(async () => {
    const n = name.trim();
    const iv = parseNum(intervalValue);
    if (!n) {
      setError('Title / Name is required');
      return;
    }
    if (iv == null || iv <= 0) {
      setError('Interval value is required and must be greater than 0');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: n,
        interval_value: iv,
        interval_unit: intervalUnit,
        early_warning_ratio: earlyWarningRatio,
      };
      if (isEdit && serviceId != null) {
        await gearApi.updateService(gearId, serviceId, payload);
      } else {
        await gearApi.createService(gearId, payload);
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
  }, [name, intervalValue, intervalUnit, earlyWarningRatio, isEdit, serviceId, gearId, navigation]);

  if (loading && isEdit) {
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

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Title / Name *</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Chain replacement"
          placeholderTextColor={tokens.profileSecondaryText}
          editable={!submitting}
        />

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Interval Value *</Text>
        <View style={styles.intervalRow}>
          <TextInput
            style={[styles.input, styles.intervalInput, inputStyle]}
            value={intervalValue}
            onChangeText={setIntervalValue}
            placeholder="e.g. 200"
            placeholderTextColor={tokens.profileSecondaryText}
            keyboardType="decimal-pad"
            editable={!submitting}
          />
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepperBtn, { borderColor: tokens.cardBorder, borderRightWidth: 0 }]}
              onPress={() => {
                const v = parseNum(intervalValue) ?? 0;
                if (v > 0) setIntervalValue(String(Math.max(1, Math.floor(v) - 1)));
              }}
              disabled={submitting}
            >
              <Text style={[styles.stepperText, { color: tokens.pageTitleColor }]}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepperBtn, { borderColor: tokens.cardBorder }]}
              onPress={() => {
                const v = parseNum(intervalValue) ?? 0;
                setIntervalValue(String(Math.max(0, Math.floor(v) + 1)));
              }}
              disabled={submitting}
            >
              <Text style={[styles.stepperText, { color: tokens.pageTitleColor }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Interval Unit</Text>
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
          onPress={() => !submitting && setUnitDropdownVisible(true)}
          disabled={submitting}
        >
          <Text style={{ color: tokens.pageTitleColor, fontSize: 16 }}>{unitLabel}</Text>
          <ChevronDownIcon size={20} color={tokens.textSecondary} />
        </TouchableOpacity>

        <Modal
          visible={unitDropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setUnitDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setUnitDropdownVisible(false)}
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
              {INTERVAL_UNIT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.dropdownOption,
                    { borderBottomColor: tokens.cardBorder },
                    opt.value === intervalUnit && { backgroundColor: tokens.accent + '22' },
                  ]}
                  onPress={() => {
                    setIntervalUnit(opt.value);
                    setUnitDropdownVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      { color: tokens.pageTitleColor },
                      opt.value === intervalUnit && { color: tokens.accent, fontWeight: '600' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>
          Early Warning — {earlyWarningPercent}%
        </Text>
        <Text style={[styles.sublabel, { color: tokens.textSecondary }]}>
          Get notified when this percentage of the interval is reached
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={earlyWarningPercent}
          onValueChange={setEarlyWarningPercent}
          minimumTrackTintColor={tokens.accent}
          maximumTrackTintColor={tokens.cardBorder}
          thumbTintColor={tokens.accent}
          disabled={submitting}
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
            <Text style={styles.submitButtonText}>Save Service</Text>
          )}
        </TouchableOpacity>
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
  sublabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  intervalInput: {
    flex: 1,
    marginBottom: 0,
  },
  stepper: {
    flexDirection: 'row',
  },
  stepperBtn: {
    width: 40,
    height: INPUT_HEIGHT,
    borderWidth: 1,
    borderLeftWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: {
    fontSize: 18,
    fontWeight: '600',
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
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 24,
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
  headerButton: {
    padding: 8,
  },
});

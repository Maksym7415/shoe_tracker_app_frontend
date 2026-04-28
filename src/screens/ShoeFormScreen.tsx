import React, { useState, useCallback, useLayoutEffect, useMemo } from 'react';
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
import { MainRoutes, type MainStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronDownIcon, TrashIcon, WrenchIcon, PlusIcon } from '../components/icons';
import { gearApi } from '../api/gear';
import type { Gear, Service } from '../types';

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

function mapActivityTypeToApi(uiValue: string): string {
  if (uiValue === 'run') return 'run';
  if (uiValue === 'ride') return 'bike';
  if (uiValue === 'swim') return 'swim';
  if (uiValue === 'walk') return 'other';
  return 'run';
}


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
  const [parentGearId, setParentGearId] = useState<number | null>(null);
  const [gear, setGear] = useState<
    (Gear & { services?: Service[]; installations?: { parent_gear_id: number }[] }) | null
  >(null);
  const [gearList, setGearList] = useState<Gear[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [linkToGearDropdownVisible, setLinkToGearDropdownVisible] = useState(false);

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
        setParentGearId(null);
        setGear(null);
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
          setGear(g);
          const parentId =
            g.installations?.find((i) => i.removed_at == null)?.parent_gear_id ?? null;
          setParentGearId(parentId ?? null);
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
    }, [isEdit, gearId]),
  );

  useFocusEffect(
    useCallback(() => {
      const apiActivityType = mapActivityTypeToApi(activityType);
      gearApi
        .list({ activity_type: apiActivityType })
        .then((res) => {
          const list = res.gear.filter((g) => g.gear_type !== 'component' && g.id !== gearId);
          setGearList(list);
        })
        .catch(() => setGearList([]));
    }, [activityType, gearId]),
  );

  const handleDelete = useCallback(() => {
    if (!isEdit || gearId == null) return;
    Alert.alert('Delete gear', `Delete ${brand.trim() || 'this gear'}? This cannot be undone.`, [
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
    ]);
  }, [isEdit, gearId, brand, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight:
        isEdit && gearId != null
          ? () => (
              <TouchableOpacity
                onPress={handleDelete}
                style={{ padding: 8 }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <TrashIcon size={22} color={tokens.textSecondary} />
              </TouchableOpacity>
            )
          : undefined,
    });
  }, [navigation, isEdit, gearId, tokens.textSecondary, handleDelete]);

  const parentGearLabel = useMemo(() => {
    if (parentGearId == null) return 'None';
    const g = gearList.find((x) => x.id === parentGearId);
    return g?.nick?.trim() || `${g?.brand ?? ''} ${g?.model ?? ''}`.trim() || 'None';
  }, [parentGearId, gearList]);

  const handleSubmit = useCallback(async () => {
    const b = brand.trim();
    const m = model.trim();
    if (!b || !m) {
      setError('Brand and model are required');
      return;
    }
    setError(null);
    setSubmitting(true);
    const apiActivityType = mapActivityTypeToApi(activityType);
    const gearType = parentGearId != null ? 'component' : 'shoe';
    try {
      if (isEdit && gearId != null) {
        await gearApi.update(gearId, {
          brand: b,
          model: m,
          activity_type: apiActivityType,
          gear_type: gearType,
          nick: nick.trim() || undefined,
          max_value: parseNum(maxValue) ?? undefined,
          value_covered: parseNum(valueCovered) ?? undefined,
          parent_gear_id: parentGearId,
        });
      } else {
        await gearApi.create({
          activity_type: apiActivityType,
          gear_type: gearType,
          metric_type: 'distance',
          brand: b,
          model: m,
          nick: nick.trim() || undefined,
          max_value: parseNum(maxValue) ?? 800,
          value_covered: parseNum(valueCovered) ?? 0,
          ...(parentGearId != null && { parent_gear_id: parentGearId }),
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
    parentGearId,
    isEdit,
    gearId,
    navigation,
  ]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <ActivityIndicator size="large" color={tokens.loadingIndicator} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  const inputStyle = {
   minHeight: 40,
  paddingVertical: 10,
  paddingHorizontal: 12,
    backgroundColor: tokens.cardBackground,
    borderColor: tokens.cardBorder,
    borderRadius: tokens.cardBorderRadius,
    color: tokens.pageTitleColor,
   textAlignVertical: 'center' as const,
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
        {error ? <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text> : null}

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
      <Text
  numberOfLines={1}
  ellipsizeMode="clip"
  style={{
    color: tokens.pageTitleColor,
    fontSize: 16,
    flex: 1,
  }}
>
  {activityLabel}
</Text>
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

        <Text style={[styles.sectionTitle, { color: tokens.pageTitleColor }]}>Link to Gear</Text>
        <Text style={[styles.sectionSubtitle, { color: tokens.textSecondary }]}>
          Assign this as a component of another gear
        </Text>
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
              opacity: activityType ? 1 : 0.6,
            },
          ]}
          onPress={() => activityType && !submitting && setLinkToGearDropdownVisible(true)}
          disabled={!activityType || submitting}
        >
          <Text style={{ color: tokens.pageTitleColor, fontSize: 16 }}>{parentGearLabel}</Text>
          <ChevronDownIcon size={20} color={tokens.textSecondary} />
        </TouchableOpacity>

        <Modal
          visible={linkToGearDropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLinkToGearDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setLinkToGearDropdownVisible(false)}
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
              <TouchableOpacity
                style={[
                  styles.dropdownOption,
                  { borderBottomColor: tokens.cardBorder },
                  parentGearId == null && { backgroundColor: tokens.accent + '22' },
                ]}
                onPress={() => {
                  setParentGearId(null);
                  setLinkToGearDropdownVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    { color: tokens.pageTitleColor },
                    parentGearId == null && { color: tokens.accent, fontWeight: '600' },
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>
              {gearList.map((g) => {
                const label = g.nick?.trim() || `${g.brand} ${g.model}`.trim();
                const isSelected = g.id === parentGearId;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.dropdownOption,
                      { borderBottomColor: tokens.cardBorder },
                      isSelected && { backgroundColor: tokens.accent + '22' },
                    ]}
                    onPress={() => {
                      setParentGearId(g.id);
                      setLinkToGearDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        { color: tokens.pageTitleColor },
                        isSelected && { color: tokens.accent, fontWeight: '600' },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

        {isEdit && gearId != null ? (
          <>
            <Text style={[styles.sectionTitle, { color: tokens.pageTitleColor, marginTop: 24 }]}>
              Services
            </Text>
            {(gear?.services ?? []).map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.serviceRow, { borderBottomColor: tokens.cardBorder }]}
                onPress={() =>
                  navigation.navigate(MainRoutes.ShoesServiceEdit, { gearId, serviceId: s.id })
                }
                disabled={submitting}
              >
                <WrenchIcon size={20} color={tokens.textSecondary} />
                <View style={styles.serviceRowContent}>
                  <Text style={[styles.serviceName, { color: tokens.pageTitleColor }]}>
                    {s.name}
                  </Text>
                  <Text style={[styles.serviceDetail, { color: tokens.textSecondary }]}>
                    Every {s.interval_value} {s.interval_unit}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.addServiceButton,
                {
                  backgroundColor: tokens.cardBackground,
                  borderColor: tokens.cardBorder,
                },
              ]}
              onPress={() => navigation.navigate(MainRoutes.ShoesServiceAdd, { gearId })}
              disabled={submitting}
            >
              <PlusIcon size={20} color={tokens.accent} />
              <Text style={[styles.addServiceText, { color: tokens.accent }]}>Add Service</Text>
            </TouchableOpacity>
          </>
        ) : null}

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
     justifyContent: 'center',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  serviceRowContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  serviceDetail: {
    fontSize: 13,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  },
  addServiceText: {
    fontSize: 16,
    fontWeight: '600',
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
});

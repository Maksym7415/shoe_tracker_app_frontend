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
  FlatList,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainRoutes, type MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronDownIcon, CalendarIcon, TrashIcon } from '../components/icons';
import ActivityGearCard from '../components/ActivityGearCard';
import type { Gear } from '../types';
import type { ActivityGear } from '../types';
import { activitiesApi } from '../api/activities';
import { gearApi } from '../api/gear';

type Props = NativeStackScreenProps<MainStackParamList, 'Activities/Edit'>;

type GearRow = { gearId: number | null; distanceKm: string; excludedComponentIds: number[] };

const INPUT_HEIGHT = 40;

const ACTIVITY_TYPE_OPTIONS: { value: 'run' | 'bike' | 'swim' | 'other'; label: string }[] = [
  { value: 'run', label: 'Running' },
  { value: 'bike', label: 'Bike' },
  { value: 'swim', label: 'Swim' },
  { value: 'other', label: 'Walk' },
];

function mapActivityTypeFromApi(apiValue: string): 'run' | 'bike' | 'swim' | 'other' {
  const t = (apiValue ?? '').toLowerCase();
  if (t === 'run' || t === 'running') return 'run';
  if (t === 'bike' || t === 'ride') return 'bike';
  if (t === 'swim') return 'swim';
  return 'other';
}

function parseDateISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split(/[-T]/).map(Number);
  const month = (m ?? 1) - 1;
  return new Date(y ?? 0, month, d ?? 1);
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

function gearLabel(gear: Gear): string {
  const nick = gear.nick?.trim();
  if (nick) return nick;
  return `${gear.brand} ${gear.model}`;
}

function getGearId(g: ActivityGear | { shoe_id: number }): number {
  return 'gear_id' in g ? g.gear_id : (g as { shoe_id: number }).shoe_id;
}

export default function ActivityEditScreen({ route, navigation }: Props) {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const unit = user?.preferred_distance_unit ?? 'km';
  const activityId = route.params.id;
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [activityType, setActivityType] = useState<'run' | 'bike' | 'swim' | 'other'>('run');
  const [activityTypeDropdownVisible, setActivityTypeDropdownVisible] = useState(false);
  const [totalDistanceKm, setTotalDistanceKm] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gearList, setGearList] = useState<Gear[]>([]);
  const [gearRows, setGearRows] = useState<GearRow[]>([]);
  const [gearPickerRowIndex, setGearPickerRowIndex] = useState<number | null>(null);

  const parseNum = (s: string): number => {
    const t = s.trim();
    if (t === '') return 0;
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : 0;
  };

  const totalDistance = parseNum(totalDistanceKm);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      Promise.all([
        activitiesApi.get(activityId),
        gearApi.list({ gear_type: 'shoe' }),
        gearApi.list({ gear_type: 'bike' }),
      ])
        .then(([activityRes, shoesRes, bikesRes]) => {
          if (cancelled) return;
          const a = activityRes.activity;
          const allGear = [...(shoesRes.gear ?? []), ...(bikesRes.gear ?? [])];
          const gearMap = new Map(allGear.map((g) => [g.id, g]));
          setName(a.name);
          setDate(parseDateISO(a.date));
          setActivityType(mapActivityTypeFromApi(a.activity_type ?? 'run'));
          setTotalDistanceKm(Number(a.total_distance_km).toFixed(2));
          setGearList(allGear);
          const gearItems = (a.gear ?? a.shoes ?? []) as Array<
            ActivityGear | { shoe_id: number; distance_km?: number; value?: number }
          >;
          const rows: GearRow[] = gearItems
            .filter((g) => gearMap.has(getGearId(g)))
            .map((g) => {
              const id = getGearId(g);
              const val = 'value' in g ? g.value : (g as { distance_km: number }).distance_km;
              const excl = (g as ActivityGear).excluded_component_ids ?? [];
              return { gearId: id, distanceKm: Number(val).toFixed(2), excludedComponentIds: excl };
            });
          setGearRows(rows);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
              : null;
          setError(msg ?? 'Failed to load activity');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [activityId]),
  );

  const onDateChange = useCallback((_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  }, []);

  const addGearRow = useCallback(() => {
   
    setGearRows((prev) => {
       
      const next = [...prev, { gearId: null, distanceKm: '', excludedComponentIds: [] }];
      if (prev.length === 1 && prev[0].gearId != null) {
        next[0] = { ...prev[0], distanceKm: totalDistance.toFixed(2) };
      }
      return next;
    });
  }, [totalDistance]);

  const removeGearRow = useCallback((index: number) => {
    setGearRows((prev) => prev.filter((_, i) => i !== index));
    setGearPickerRowIndex(null);
  }, []);

  const setRowGear = useCallback((rowIndex: number, gearId: number) => {
      const gear = gearList.find((g) => g.id === gearId);
    setGearRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], gearId, excludedComponentIds: [] };
          setGearPickerRowIndex(next.length - 1);
      return next;
    });
    setGearPickerRowIndex(null);
  }, []);

  const setRowExcludedComponents = useCallback((rowIndex: number, excludedIds: number[]) => {
    setGearRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], excludedComponentIds: excludedIds };
      return next;
    });
  }, []);

  const setRowDistance = useCallback((rowIndex: number, value: string) => {
    setGearRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], distanceKm: value };
      return next;
    });
  }, []);

  const selectedGearIds = new Set(
    gearRows.map((r) => r.gearId).filter((id): id is number => id != null),
    
  );

const availableGear = gearList.filter((g) => {
  if (g.status !== 'active' || selectedGearIds.has(g.id)) return false;

  if (activityType === 'other') return true;

  return g.activity_type === activityType;
});

  const getRowDistanceDisplay = useCallback(
    (row: GearRow,index:number): string => {
      if (row.gearId == null) return row.distanceKm;
      if (gearRows.length === 1) return totalDistance.toFixed(2);
      return row.distanceKm;
    },
    [gearRows.length, totalDistance],
  );

  const getRowDistanceEditable = useCallback(
    (index: number): boolean => {
      const row = gearRows[index];
      if (row?.gearId == null) return false;
      return gearRows.length > 1;
    },
    [gearRows],
  );

  const gearDistancesSum = gearRows.reduce((sum, row) => {
    if (row.gearId == null) return sum;
    if (gearRows.length === 1) return totalDistance;
    return sum + parseNum(row.distanceKm);
  }, 0);

  const sumValid =
    gearRows.length === 0 ||
    (gearRows.every((r) => r.gearId != null) && Math.abs(gearDistancesSum - totalDistance) < 0.001);

  const canSave =
    name.trim().length > 0 &&
    sumValid &&
    (gearRows.length === 0 || gearRows.every((r) => r.gearId != null));

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    if (!sumValid && gearRows.length > 0) {
      setError('Sum of gear distances must equal activity distance');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await activitiesApi.update(activityId, {
        name: trimmedName,
        date: formatDateISO(date),
        activity_type: activityType,
        total_distance_km: totalDistance,
      });
      if (gearRows.length > 0) {
        const gearPayload = gearRows
          .filter((r) => r.gearId != null)
          .map((r) => ({
            gear_id: r.gearId!,
            value: gearRows.length === 1 ? totalDistance : parseNum(r.distanceKm),
            excluded_component_ids: r.excludedComponentIds ?? [],
          }));
        await activitiesApi.assignGear(activityId, gearPayload);
      } else {
        await activitiesApi.assignGear(activityId, []);
      }
      navigation.navigate(MainRoutes.ActivitiesDetail, { id: activityId });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? 'Failed to update activity');
    } finally {
      setSubmitting(false);
    }
  }, [activityId, name, date, activityType, totalDistance, gearRows, sumValid, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete activity', 'Delete this activity? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSubmitting(true);
            await activitiesApi.remove(activityId);
            navigation.navigate(MainRoutes.ActivitiesList);
          } catch (err: unknown) {
            const msg =
              err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                : null;
            setError(msg ?? 'Failed to delete activity');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }, [activityId, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleDelete}
          style={{ padding: 8 }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <TrashIcon size={22} color={tokens.textSecondary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, tokens.textSecondary, handleDelete]);

  const inputStyle = {
    height: INPUT_HEIGHT,
    backgroundColor: tokens.cardBackground,
    borderColor: tokens.cardBorder,
    borderRadius: tokens.cardBorderRadius,
    color: tokens.pageTitleColor,
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <ActivityIndicator size="large" color={tokens.loadingIndicator} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (error && !name) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: tokens.accent }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Name *</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Morning Run"
          placeholderTextColor={tokens.profileSecondaryText}
          editable={!submitting}
        />

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Date *</Text>
        <TouchableOpacity
          style={[
            styles.dateButton,
            inputStyle,
            {
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
            },
          ]}
          onPress={() => setShowDatePicker(true)}
          disabled={submitting}
        >
          <Text style={{ color: tokens.pageTitleColor, fontSize: 16 }}>
            {formatDateDisplay(date)}
          </Text>
          <CalendarIcon size={20} color={tokens.textSecondary} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <TouchableOpacity style={styles.datePickerDone} onPress={() => setShowDatePicker(false)}>
            <Text style={[styles.datePickerDoneText, { color: tokens.accent }]}>Done</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Activity Type</Text>
        <TouchableOpacity
          style={[
            styles.dateButton,
            inputStyle,
            {
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
            },
          ]}
          onPress={() => !submitting && setActivityTypeDropdownVisible(true)}
          disabled={submitting}
        >
          <Text style={{ color: tokens.pageTitleColor, fontSize: 16 }}>
            {ACTIVITY_TYPE_OPTIONS.find((o) => o.value === activityType)?.label ?? 'Running'}
          </Text>
          <ChevronDownIcon size={20} color={tokens.textSecondary} />
        </TouchableOpacity>

        <Modal
          visible={activityTypeDropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setActivityTypeDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setActivityTypeDropdownVisible(false)}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: tokens.cardBackground,
                  borderColor: tokens.cardBorder,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <Text style={[styles.modalTitle, { color: tokens.pageTitleColor }]}>
                Activity Type
              </Text>
              {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor:
                        opt.value === activityType ? tokens.accent + '26' : tokens.cardBorder,
                    },
                  ]}
                  onPress={() => {
                    setActivityType(opt.value);
                    setActivityTypeDropdownVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: tokens.pageTitleColor }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setActivityTypeDropdownVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: tokens.accent }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Total Distance (km)</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={totalDistanceKm}
          onChangeText={setTotalDistanceKm}
          placeholder="e.g. 5.2"
          placeholderTextColor={tokens.profileSecondaryText}
          keyboardType="decimal-pad"
          editable={!submitting}
        />

        <View style={styles.gearHeader}>
          <Text style={[styles.label, { color: tokens.pageTitleColor, marginBottom: 0 }]}>
            Gear
          </Text>
          <TouchableOpacity
            onPress={addGearRow}
            disabled={submitting || availableGear.length === 0}
         
          >
            <Text style={[styles.addGearLink, { color: tokens.accent }]}>+ Add Gear</Text>
          </TouchableOpacity>
        </View>
        {gearList.length === 0 ? (
          <Text style={[styles.hint, { color: tokens.profileSecondaryText }]}>
            Add gear first to assign it.
          </Text>
        ) : (
          <>
            {gearRows.map((row, index) => {
              const selectedGear =
                row.gearId != null ? gearList.find((g) => g.id === row.gearId) : null;
              const distanceDisplay = getRowDistanceDisplay(row, index);
              const distanceEditable = getRowDistanceEditable(index);
              const isPickerActive = gearPickerRowIndex === index;
              const componentsCount = selectedGear?.components_count ?? 0;
              const value =
                gearRows.length === 1
                  ? totalDistance
                  : row.gearId != null
                    ? parseNum(row.distanceKm) || 0
                    : 0;

              if (selectedGear) {
                const gearName = gearLabel(selectedGear);
                const gearSubtitle = selectedGear.nick?.trim()
                  ? `${selectedGear.brand} ${selectedGear.model}`
                  : selectedGear.brand;
              
                return (
                  <View key={index} style={styles.gearCardWrapper}>
                    <ActivityGearCard
                      gearId={selectedGear.id}
                      gearName={gearName}
                      gearSubtitle={gearSubtitle}
                      value={value}
                      componentsCount={componentsCount}
                      excludedComponentIds={row.excludedComponentIds}
                      editable={true}
                      unit={unit}
                      distanceEditable={distanceEditable}
                      distanceValue={distanceEditable ? distanceDisplay : undefined}
                      onDistanceChange={
                        distanceEditable ? (v) => setRowDistance(index, v) : undefined
                      }
                      onToggleComponent={(compId, active) => {
                        setRowExcludedComponents(
                          index,
                          active
                            ? row.excludedComponentIds.filter((id) => id !== compId)
                            : [...row.excludedComponentIds, compId],
                        );
                      }}
                      onRemove={() => removeGearRow(index)}
                    />
                    <TouchableOpacity
                      style={[styles.selectDifferentGear, { borderColor: tokens.cardBorder }]}
                      onPress={() => !submitting && setGearPickerRowIndex(index)}
                      disabled={submitting}
                    >
                      <Text style={[styles.selectDifferentGearText, { color: tokens.accent }]}>
                        Change gear
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <View key={index} style={styles.shoeRow}>
                  <TouchableOpacity
                    style={[
                      styles.shoeSelect,
                      inputStyle,
                      {
                        borderWidth: 1,
                        borderColor: isPickerActive ? tokens.accent : tokens.cardBorder,
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                      },
                    ]}
                    onPress={() => !submitting && setGearPickerRowIndex(index)}
                    disabled={submitting}
                  >
                    <Text
                      style={{
                        color: tokens.profileSecondaryText,
                        fontSize: 16,
                      }}
                      numberOfLines={1}
                    >
                      Select gear
                    </Text>
                    <ChevronDownIcon size={20} color={tokens.textSecondary} />
                  </TouchableOpacity>
                </View>
              );
            })}
            {!sumValid && gearRows.length > 0 && (
              <Text style={[styles.sumError, { color: tokens.error }]}>
                Sum of distances ({gearDistancesSum.toFixed(2)} km) must equal activity distance (
                {totalDistance.toFixed(2)} km)
              </Text>
            )}
          </>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: tokens.accent },
            (submitting || !canSave) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || !canSave}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={gearPickerRowIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setGearPickerRowIndex(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGearPickerRowIndex(null)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: tokens.cardBackground,
                borderColor: tokens.cardBorder,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: tokens.pageTitleColor }]}>Select gear</Text>
            <FlatList
            data={availableGear}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isSelected =
                  gearPickerRowIndex != null && gearRows[gearPickerRowIndex]?.gearId === item.id;
                const isDisabled =
                  (selectedGearIds.has(item.id) &&
                    !(
                      gearPickerRowIndex != null && gearRows[gearPickerRowIndex]?.gearId === item.id
                    )) ||
                  item.status === 'retired';
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      {
                        backgroundColor: isSelected ? tokens.accent + '26' : tokens.cardBorder,
                      },
                      isDisabled && styles.modalOptionDisabled,
                    ]}
                    onPress={() => {
                      if (!isDisabled && gearPickerRowIndex != null) {
                        setRowGear(gearPickerRowIndex, item.id);
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        {
                          color: isDisabled ? tokens.profileSecondaryText : tokens.pageTitleColor,
                        },
                      ]}
                    >
                      {gearLabel(item)}
                      {item.status === 'retired' ? ' (retired)' : ''}
                      {isDisabled && !isSelected && item.status !== 'retired'
                        ? ' (already selected)'
                        : ''}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setGearPickerRowIndex(null)}
            >
              <Text style={[styles.modalCancelText, { color: tokens.accent }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  errorText: {
    fontSize: 14,
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
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
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
  dateButton: {
    marginBottom: 20,
  },
  datePickerDone: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addGearLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  hint: {
    fontSize: 13,
    marginBottom: 16,
  },
  gearCardWrapper: {
    marginBottom: 12,
  },
  selectDifferentGear: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  selectDifferentGearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  shoeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shoeSelect: {
    flex: 1,
  },
  shoeDistanceInput: {
    width: 76,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sumError: {
    fontSize: 13,
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '70%',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionDisabled: {
    opacity: 0.6,
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

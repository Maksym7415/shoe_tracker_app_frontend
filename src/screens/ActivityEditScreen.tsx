import React, { useState, useCallback, useEffect } from 'react';
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
import type { MainStackParamList } from '../navigation/types';
import type { Shoe } from '../types';
import { activitiesApi } from '../api/activities';
import { shoesApi } from '../api/shoes';

type Props = NativeStackScreenProps<MainStackParamList, 'Activities/Edit'>;

type ShoeRow = { shoeId: number | null; distanceKm: string };

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

function shoeLabel(shoe: Shoe): string {
  const nick = shoe.nick?.trim();
  if (nick) return `${shoe.brand} ${shoe.model} (${nick})`;
  return `${shoe.brand} ${shoe.model}`;
}

export default function ActivityEditScreen({ route, navigation }: Props) {
  const activityId = route.params.id;
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [totalDistanceKm, setTotalDistanceKm] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [shoeRows, setShoeRows] = useState<ShoeRow[]>([]);
  const [shoePickerRowIndex, setShoePickerRowIndex] = useState<number | null>(
    null
  );

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
      Promise.all([activitiesApi.get(activityId), shoesApi.list()])
        .then(([activityRes, shoesRes]) => {
          if (cancelled) return;
          const a = activityRes.activity;
          setName(a.name);
          setDate(parseDateISO(a.date));
          setTotalDistanceKm(Number(a.total_distance_km).toFixed(2));
          setShoes(shoesRes.shoes ?? []);
          const rows: ShoeRow[] = (a.shoes ?? []).map((s) => ({
            shoeId: s.shoe_id,
            distanceKm: Number(s.distance_km).toFixed(2),
          }));
          setShoeRows(rows);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { error?: string } } }).response
                  ?.data?.error
              : null;
          setError(msg ?? 'Failed to load activity');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [activityId])
  );

  const onDateChange = useCallback((_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  }, []);

  const addShoeRow = useCallback(() => {
    setShoeRows((prev) => {
      const next = [...prev, { shoeId: null, distanceKm: '' }];
      if (prev.length === 1 && prev[0].shoeId != null) {
        next[0] = { ...prev[0], distanceKm: totalDistance.toFixed(2) };
      }
      return next;
    });
  }, [totalDistance]);

  const removeShoeRow = useCallback((index: number) => {
    setShoeRows((prev) => prev.filter((_, i) => i !== index));
    setShoePickerRowIndex(null);
  }, []);

  const setRowShoe = useCallback((rowIndex: number, shoeId: number) => {
    setShoeRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], shoeId };
      return next;
    });
    setShoePickerRowIndex(null);
  }, []);

  const setRowDistance = useCallback((rowIndex: number, value: string) => {
    setShoeRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], distanceKm: value };
      return next;
    });
  }, []);

  const selectedShoeIds = new Set(
    shoeRows.map((r) => r.shoeId).filter((id): id is number => id != null)
  );

  const getRowDistanceDisplay = useCallback(
    (row: ShoeRow, index: number): string => {
      if (row.shoeId == null) return row.distanceKm;
      if (shoeRows.length === 1) return totalDistance.toFixed(2);
      return row.distanceKm;
    },
    [shoeRows.length, totalDistance]
  );

  const getRowDistanceEditable = useCallback(
    (index: number): boolean => {
      const row = shoeRows[index];
      if (row?.shoeId == null) return false;
      return shoeRows.length > 1;
    },
    [shoeRows]
  );

  const shoeDistancesSum = shoeRows.reduce((sum, row) => {
    if (row.shoeId == null) return sum;
    if (shoeRows.length === 1) return totalDistance;
    return sum + parseNum(row.distanceKm);
  }, 0);

  const sumValid =
    shoeRows.length === 0 ||
    (shoeRows.every((r) => r.shoeId != null) &&
      Math.abs(shoeDistancesSum - totalDistance) < 0.001);

  const canSave =
    name.trim().length > 0 &&
    sumValid &&
    (shoeRows.length === 0 || shoeRows.every((r) => r.shoeId != null));

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    if (!sumValid && shoeRows.length > 0) {
      setError('Sum of shoe distances must equal activity distance');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await activitiesApi.update(activityId, {
        name: trimmedName,
        date: formatDateISO(date),
        total_distance_km: totalDistance,
      });
      if (shoeRows.length > 0) {
        const shoesPayload = shoeRows
          .filter((r) => r.shoeId != null)
          .map((r) => ({
            shoe_id: r.shoeId!,
            distance_km:
              shoeRows.length === 1 ? totalDistance : parseNum(r.distanceKm),
          }));
        await activitiesApi.assignShoes(activityId, shoesPayload);
      } else {
        await activitiesApi.assignShoes(activityId, []);
      }
      navigation.navigate('Activities');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : null;
      setError(msg ?? 'Failed to update activity');
    } finally {
      setSubmitting(false);
    }
  }, [
    activityId,
    name,
    date,
    totalDistance,
    shoeRows,
    sumValid,
    navigation,
  ]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete activity',
      'Delete this activity? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              await activitiesApi.remove(activityId);
              navigation.navigate('Activities');
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as {
                      response?: { data?: { error?: string } };
                    }).response?.data?.error
                  : null;
              setError(msg ?? 'Failed to delete activity');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }, [activityId, navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (error && !name) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go back</Text>
        </TouchableOpacity>
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

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Morning Run"
          placeholderTextColor="#999"
          editable={!submitting}
        />

        <Text style={styles.label}>Date *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          disabled={submitting}
        >
          <Text style={styles.dateButtonText}>{formatDateISO(date)}</Text>
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
          <TouchableOpacity
            style={styles.datePickerDone}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.datePickerDoneText}>Done</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Total distance (km)</Text>
        <TextInput
          style={styles.input}
          value={totalDistanceKm}
          onChangeText={setTotalDistanceKm}
          placeholder="e.g. 5.2"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          editable={!submitting}
        />

        <Text style={styles.label}>Shoes</Text>
        {shoes.length === 0 ? (
          <Text style={styles.hint}>Add shoes first to assign them.</Text>
        ) : (
          <>
            {shoeRows.map((row, index) => {
              const selectedShoe =
                row.shoeId != null
                  ? shoes.find((s) => s.id === row.shoeId)
                  : null;
              const distanceDisplay = getRowDistanceDisplay(row, index);
              const distanceEditable = getRowDistanceEditable(index);
              return (
                <View key={index} style={styles.shoeRow}>
                  <TouchableOpacity
                    style={styles.shoeSelect}
                    onPress={() =>
                      !submitting && setShoePickerRowIndex(index)
                    }
                    disabled={submitting}
                  >
                    <Text
                      style={
                        selectedShoe
                          ? styles.shoeSelectText
                          : styles.shoeSelectPlaceholder
                      }
                    >
                      {selectedShoe
                        ? shoeLabel(selectedShoe)
                        : 'Select shoe'}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[
                      styles.shoeDistanceInput,
                      !distanceEditable && styles.shoeDistanceDisabled,
                    ]}
                    value={distanceDisplay}
                    onChangeText={(v) => setRowDistance(index, v)}
                    placeholder="km"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    editable={distanceEditable && !submitting}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeShoeRow(index)}
                    disabled={submitting}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity
              style={styles.addShoeButton}
              onPress={addShoeRow}
              disabled={submitting || shoes.length === 0}
            >
              <Text style={styles.addShoeButtonText}>+ Add shoe</Text>
            </TouchableOpacity>
            {!sumValid && shoeRows.length > 0 && (
              <Text style={styles.sumError}>
                Sum of distances ({shoeDistancesSum.toFixed(2)} km) must equal
                activity distance ({totalDistance.toFixed(2)} km)
              </Text>
            )}
          </>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
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

        <TouchableOpacity
          style={[styles.deleteButton, submitting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={submitting}
        >
          <Text style={styles.deleteButtonText}>Delete activity</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={shoePickerRowIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShoePickerRowIndex(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShoePickerRowIndex(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select shoe</Text>
            <FlatList
              data={shoes}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isSelected =
                  shoePickerRowIndex != null &&
                  shoeRows[shoePickerRowIndex]?.shoeId === item.id;
                const isDisabled =
                  selectedShoeIds.has(item.id) &&
                  !(
                    shoePickerRowIndex != null &&
                    shoeRows[shoePickerRowIndex]?.shoeId === item.id
                  );
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                      isDisabled && styles.modalOptionDisabled,
                    ]}
                    onPress={() => {
                      if (!isDisabled && shoePickerRowIndex != null) {
                        setRowShoe(shoePickerRowIndex, item.id);
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isDisabled && styles.modalOptionTextDisabled,
                      ]}
                    >
                      {shoeLabel(item)}
                      {isDisabled && !isSelected ? ' (already selected)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShoePickerRowIndex(null)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
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
    fontSize: 14,
    color: '#dc2626',
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
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
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
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerDone: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  shoeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  shoeSelect: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  shoeSelectText: {
    fontSize: 15,
    color: '#333',
  },
  shoeSelectPlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  shoeDistanceInput: {
    width: 70,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
    textAlign: 'center',
  },
  shoeDistanceDisabled: {
    backgroundColor: '#eee',
    color: '#666',
  },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#dc2626',
  },
  addShoeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
  },
  addShoeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  sumError: {
    fontSize: 13,
    color: '#dc2626',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#2563eb',
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
  deleteButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dc2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#f5f5f5',
  },
  modalOptionSelected: {
    backgroundColor: '#dbeafe',
  },
  modalOptionDisabled: {
    opacity: 0.6,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextDisabled: {
    color: '#999',
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});

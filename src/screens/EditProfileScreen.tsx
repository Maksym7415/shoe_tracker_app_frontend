import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronDownIcon } from '../components/icons';
import { authApi } from '../api/auth';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile/Edit'>;

const INPUT_HEIGHT = 48;

const DISTANCE_UNIT_OPTIONS: { value: 'km' | 'miles'; label: string }[] = [
  { value: 'km', label: 'Kilometers (km)' },
  { value: 'miles', label: 'Miles' },
];

export default function EditProfileScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();
  const { tokens } = useTheme();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>(
    (user?.preferred_distance_unit as 'km' | 'miles') ?? 'km'
  );
  const [unitPickerVisible, setUnitPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState(user?.email ?? '');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.updateProfile({
        name: trimmedName,
        email: trimmedEmail || undefined,
        preferred_distance_unit: distanceUnit,
      });
      await refreshUser();
      navigation.goBack();
    } catch {
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  }, [name, email, distanceUnit, refreshUser, navigation]);

  const handleForgotPassword = useCallback(async () => {
    const trimmed = resetEmail.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    setResetLoading(true);
    try {
      await authApi.forgotPassword(trimmed);
      setResetSent(true);
    } catch {
      Alert.alert('Error', 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  }, [resetEmail]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSubmit}
          style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          disabled={loading}
        >
          <Text style={{ color: tokens.accent, fontSize: 16, fontWeight: '600' }}>Done</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSubmit, tokens.accent, loading]);

  if (!user) return null;

  const selectedUnitLabel =
    DISTANCE_UNIT_OPTIONS.find((o) => o.value === distanceUnit)?.label ?? 'Kilometers (km)';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tokens.pageBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: tokens.cardBorder,
                backgroundColor: tokens.cardBackground,
                color: tokens.pageTitleColor,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={tokens.profileSecondaryText}
            editable={!loading}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: tokens.pageTitleColor }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: tokens.cardBorder,
                backgroundColor: tokens.cardBackground,
                color: tokens.pageTitleColor,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={tokens.profileSecondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.pageTitleColor }]}>Settings</Text>
          <View
            style={[
              styles.dropdownTrigger,
              {
                borderColor: tokens.cardBorder,
                backgroundColor: tokens.cardBackground,
              },
            ]}
          >
            <Text style={[styles.dropdownLabel, { color: tokens.profileSecondaryText }]}>
              Distance Unit
            </Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setUnitPickerVisible(true)}
              disabled={loading}
            >
              <Text style={[styles.dropdownValue, { color: tokens.pageTitleColor }]}>
                {selectedUnitLabel}
              </Text>
              <ChevronDownIcon size={16} color={tokens.profileSecondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.pageTitleColor }]}>Reset password</Text>
          {resetSent ? (
            <Text style={[styles.helperText, { color: '#2bd4bd' }]}>
              Check your email for the reset link.
            </Text>
          ) : (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: tokens.cardBorder,
                    backgroundColor: tokens.cardBackground,
                    color: tokens.pageTitleColor,
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={tokens.profileSecondaryText}
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!resetLoading}
              />
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: tokens.accent }]}
                onPress={handleForgotPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send reset email</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {error ? <Text style={[styles.errorText]}>{error}</Text> : null}
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={tokens.accent} />
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={unitPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUnitPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: tokens.cardBackground }]}>
            {DISTANCE_UNIT_OPTIONS.map((opt) => {
              const selected = opt.value === distanceUnit;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.modalOption,
                    selected && { backgroundColor: tokens.accent },
                  ]}
                  onPress={() => {
                    setDistanceUnit(opt.value);
                    setUnitPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: selected ? '#fff' : tokens.pageTitleColor },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: INPUT_HEIGHT,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
  },
  input: {
    height: INPUT_HEIGHT,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#dc2626',
  },
  loadingRow: {
    paddingVertical: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 8,
  },
  modalOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});


import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { StravaIcon, ConnectIcon, ProfileIcon } from '../components/icons';
import { authApi } from '../api/auth';
import { stravaApi } from '../api/strava';
import { gearApi } from '../api/gear';
import { activitiesApi } from '../api/activities';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { tokens } = useTheme();
  const [name, setName] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [stravaLoading, setStravaLoading] = useState(false);
  const [stravaConnected, setStravaConnected] = useState<boolean | null>(null);
  const [totalGears, setTotalGears] = useState<number | null>(null);
  const [totalActivities, setTotalActivities] = useState<number | null>(null);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [alerts, setAlerts] = useState<Array<{ gear_id: number; type: string; message: string }>>([]);

  React.useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
      const fetchData = async () => {
        try {
          const [stravaRes, gearRes, activitiesRes, alertsRes] = await Promise.all([
            stravaApi.getStatus(),
            gearApi.list({ gear_type: 'shoe' }),
            activitiesApi.list(),
            gearApi.getAlerts().catch(() => ({ success: false, alerts: [] })),
          ]);
          setStravaConnected(stravaRes.data.connected);
          setTotalGears(gearRes.gear?.length ?? 0);
          setTotalActivities(activitiesRes.activities?.length ?? 0);
          setAlerts(alertsRes.alerts ?? []);
        } catch {
          setStravaConnected(false);
          setTotalGears(null);
          setTotalActivities(null);
          setAlerts([]);
        }
      };
      fetchData();
    }, [refreshUser])
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll access to update your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setLoading(true);
    try {
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      await authApi.updateProfileWithAvatar(name, asset.uri, mimeType);
      await refreshUser();
    } catch (err) {
      Alert.alert('Error', 'Failed to update avatar. The backend may not support avatar upload yet.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setLoading(true);
    try {
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      await authApi.updateProfileWithAvatar(name, asset.uri, mimeType);
      await refreshUser();
    } catch (err) {
      Alert.alert('Error', 'Failed to update avatar. The backend may not support avatar upload yet.');
    } finally {
      setLoading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Update avatar', 'Choose a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await authApi.updateProfile({ name: name.trim() });
      await refreshUser();
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(forgotPasswordEmail.trim());
      setForgotPasswordSent(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStrava = async () => {
    const redirectUri = Linking.createURL('strava/callback');
    setStravaLoading(true);
    try {
      const { data } = await stravaApi.getConnectUrl(redirectUri);
      const authorizeUrl = data.authorize_url ?? data.url;
      if (!authorizeUrl) {
        Alert.alert('Error', 'Invalid response from server.');
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri);
      if (result.type === 'success') {
        await refreshUser();
        setStravaConnected(true);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        Alert.alert('Strava unavailable', 'Strava is not configured on the server.');
      } else {
        Alert.alert('Error', 'Failed to connect Strava.');
      }
    } finally {
      setStravaLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

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
        <TouchableOpacity style={styles.avatarContainer} onPress={showImageOptions} disabled={loading}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: tokens.profileAvatarPlaceholderBg }]}>
              <ProfileIcon size={48} color={tokens.textSecondary} />
            </View>
          )}
          {loading && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <TextInput
          style={[styles.nameInput, { color: tokens.pageTitleColor }]}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={tokens.profileSecondaryText}
          editable={!loading}
          onBlur={handleSaveName}
        />
        <Text style={[styles.email, { color: tokens.profileSecondaryText }]}>{user.email}</Text>

        <View style={[styles.card, { backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder, borderRadius: tokens.cardBorderRadius }]}>
          <Text style={[styles.quickStatsTitle, { color: tokens.pageTitleColor }]}>Distance Unit</Text>
          <View style={styles.distanceUnitRow}>
            <TouchableOpacity
              style={[
                styles.unitChip,
                { backgroundColor: (user.preferred_distance_unit ?? 'km') === 'km' ? tokens.accent : tokens.cardBorder },
              ]}
              onPress={async () => {
                setLoading(true);
                try {
                  await authApi.updateProfile({ preferred_distance_unit: 'km' });
                  await refreshUser();
                } catch {
                  Alert.alert('Error', 'Failed to update preference.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={[styles.unitChipText, { color: (user.preferred_distance_unit ?? 'km') === 'km' ? '#fff' : tokens.pageTitleColor }]}>km</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitChip,
                { backgroundColor: user.preferred_distance_unit === 'miles' ? tokens.accent : tokens.cardBorder },
              ]}
              onPress={async () => {
                setLoading(true);
                try {
                  await authApi.updateProfile({ preferred_distance_unit: 'miles' });
                  await refreshUser();
                } catch {
                  Alert.alert('Error', 'Failed to update preference.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={[styles.unitChipText, { color: user.preferred_distance_unit === 'miles' ? '#fff' : tokens.pageTitleColor }]}>miles</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder, borderRadius: tokens.cardBorderRadius }]}>
          <View style={styles.stravaRow}>
            <View style={styles.stravaLeft}>
              <StravaIcon size={24} color={tokens.textSecondary} />
              <View>
                <Text style={[styles.stravaTitle, { color: tokens.pageTitleColor }]}>Strava</Text>
                <Text style={[styles.stravaSubtitle, { color: tokens.profileSecondaryText }]}>Sync your activities</Text>
              </View>
            </View>
            {stravaConnected ? (
              <View style={[styles.connectBtn, { backgroundColor: tokens.cardBorder }]}>
                <Text style={[styles.connectBtnText, { color: tokens.profileSecondaryText }]}>Connected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.connectBtn, { backgroundColor: tokens.accent }]}
                onPress={handleConnectStrava}
                disabled={stravaLoading}
              >
                {stravaLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <ConnectIcon size={16} color="#fff" />
                    <Text style={styles.connectBtnTextWhite}>Connect</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder, borderRadius: tokens.cardBorderRadius }]}>
          <Text style={[styles.quickStatsTitle, { color: tokens.pageTitleColor }]}>Quick Stats</Text>
          <View style={styles.quickStatsRow}>
            <View style={[styles.statBlock, { backgroundColor: tokens.cardBorder }]}>
              <Text style={[styles.statValue, { color: tokens.pageTitleColor }]}>
                {totalGears != null ? totalGears : '–'}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.profileSecondaryText }]}>Total Gears</Text>
            </View>
            <View style={[styles.statBlock, { backgroundColor: tokens.cardBorder }]}>
              <Text style={[styles.statValue, { color: tokens.pageTitleColor }]}>
                {totalActivities != null ? totalActivities : '–'}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.profileSecondaryText }]}>Activities</Text>
            </View>
          </View>
        </View>

        {alerts.length > 0 ? (
          <View style={[styles.card, { backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder, borderRadius: tokens.cardBorderRadius }]}>
            <Text style={[styles.quickStatsTitle, { color: tokens.pageTitleColor }]}>Alerts</Text>
            {alerts.map((a, i) => (
              <View key={i} style={[styles.alertRow, { backgroundColor: a.type === 'service_overdue' || a.type === 'max_value' ? '#fef2f2' : '#fffbeb', padding: 12, borderRadius: 8, marginBottom: 8 }]}>
                <Text style={[styles.alertText, { color: tokens.pageTitleColor }]}>{a.message}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.pageTitleColor }]}>Reset password</Text>
          {!showForgotPassword ? (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              <Text style={[styles.linkText, { color: tokens.accent }]}>Forgot password?</Text>
            </TouchableOpacity>
          ) : forgotPasswordSent ? (
            <Text style={[styles.successText, { color: '#2bd4bd' }]}>Check your email for the reset link.</Text>
          ) : (
            <View>
              <TextInput
                style={[styles.input, { borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground, color: tokens.pageTitleColor }]}
                placeholder="Enter your email"
                placeholderTextColor={tokens.profileSecondaryText}
                value={forgotPasswordEmail}
                onChangeText={setForgotPasswordEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: tokens.accent }]}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send reset email</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordSent(false);
                  setForgotPasswordEmail('');
                }}
                disabled={loading}
              >
                <Text style={[styles.linkText, { color: tokens.accent }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    padding: 8,
  },
  email: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  stravaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stravaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stravaTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  stravaSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  connectBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  connectBtnTextWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  quickStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  distanceUnitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  unitChipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBlock: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  alertRow: {},
  alertText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
  },
  successText: {
    fontSize: 14,
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 16,
    backgroundColor: '#dc2626',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

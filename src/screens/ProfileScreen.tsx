import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
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
  const [loading, setLoading] = useState(false);
  const [stravaLoading, setStravaLoading] = useState(false);
  const [stravaConnected, setStravaConnected] = useState<boolean | null>(null);
  const [totalGears, setTotalGears] = useState<number | null>(null);
  const [totalActivities, setTotalActivities] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<Array<{ gear_id: number; type: string; message: string }>>(
    [],
  );

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
          setStravaConnected(stravaRes.connected);
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
    }, [refreshUser]),
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
      await authApi.updateProfileWithAvatar(user?.name ?? '', asset.uri, mimeType);
      await refreshUser();
    } catch {
      Alert.alert(
        'Error',
        'Failed to update avatar. The backend may not support avatar upload yet.',
      );
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
      await authApi.updateProfileWithAvatar(user?.name ?? '', asset.uri, mimeType);
      await refreshUser();
    } catch {
      Alert.alert(
        'Error',
        'Failed to update avatar. The backend may not support avatar upload yet.',
      );
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

  const handleConnectStrava = async () => {
    const redirectUri = Linking.createURL('strava/callback');
    setStravaLoading(true);
    try {
      const data = await stravaApi.getConnectUrl(redirectUri);
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

  const handleDisconnectStrava = async () => {
    Alert.alert('Disconnect Strava', 'Are you sure you want to disconnect Strava?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          setStravaLoading(true);
          try {
            await stravaApi.disconnect();
            await refreshUser();
            setStravaConnected(false);
          } catch {
            Alert.alert('Error', 'Failed to disconnect Strava.');
          } finally {
            setStravaLoading(false);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  const distanceUnitLabel =
    (user.preferred_distance_unit ?? 'km') === 'km' ? 'Kilometers (km)' : 'Miles';

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
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={showImageOptions}
          disabled={loading}
        >
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: tokens.profileAvatarPlaceholderBg },
              ]}
            >
              <ProfileIcon size={48} color={tokens.textSecondary} />
            </View>
          )}
          {loading && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.nameText, { color: tokens.pageTitleColor }]}>{user.name}</Text>
        <Text style={[styles.email, { color: tokens.profileSecondaryText }]}>{user.email}</Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.cardBackground,
              borderColor: tokens.cardBorder,
              borderRadius: tokens.cardBorderRadius,
            },
          ]}
        >
          <Text style={[styles.settingsTitle, { color: tokens.pageTitleColor }]}>Settings</Text>
          <View style={styles.settingsRow}>
            <Text style={[styles.settingsLabel, { color: tokens.profileSecondaryText }]}>
              Distance Unit
            </Text>
            <Text style={[styles.settingsValue, { color: tokens.pageTitleColor }]}>
              {distanceUnitLabel}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.cardBackground,
              borderColor: tokens.cardBorder,
              borderRadius: tokens.cardBorderRadius,
            },
          ]}
        >
          <View style={styles.stravaRow}>
            <View style={styles.stravaLeft}>
              <StravaIcon size={24} color={tokens.textSecondary} />
              <View>
                <Text style={[styles.stravaTitle, { color: tokens.pageTitleColor }]}>Strava</Text>
                <Text style={[styles.stravaSubtitle, { color: tokens.profileSecondaryText }]}>
                  Sync your activities
                </Text>
              </View>
            </View>
            {stravaConnected ? (
              <TouchableOpacity
                style={[styles.connectBtn, { backgroundColor: tokens.cardBorder }]}
                onPress={handleDisconnectStrava}
                disabled={stravaLoading}
              >
                {stravaLoading ? (
                  <ActivityIndicator color={tokens.profileSecondaryText} size="small" />
                ) : (
                  <Text style={[styles.connectBtnText, { color: tokens.profileSecondaryText }]}>
                    Disconnect
                  </Text>
                )}
              </TouchableOpacity>
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

        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.cardBackground,
              borderColor: tokens.cardBorder,
              borderRadius: tokens.cardBorderRadius,
            },
          ]}
        >
          <Text style={[styles.quickStatsTitle, { color: tokens.pageTitleColor }]}>
            Quick Stats
          </Text>
          <View style={styles.quickStatsRow}>
            <View style={[styles.statBlock, { backgroundColor: tokens.cardBorder }]}>
              <Text style={[styles.statValue, { color: tokens.pageTitleColor }]}>
                {totalGears != null ? totalGears : '–'}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.profileSecondaryText }]}>
                Total Gears
              </Text>
            </View>
            <View style={[styles.statBlock, { backgroundColor: tokens.cardBorder }]}>
              <Text style={[styles.statValue, { color: tokens.pageTitleColor }]}>
                {totalActivities != null ? totalActivities : '–'}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.profileSecondaryText }]}>
                Activities
              </Text>
            </View>
          </View>
        </View>

        {alerts.length > 0 ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: tokens.cardBackground,
                borderColor: tokens.cardBorder,
                borderRadius: tokens.cardBorderRadius,
              },
            ]}
          >
            <Text style={[styles.quickStatsTitle, { color: tokens.pageTitleColor }]}>Alerts</Text>
            {alerts.map((a, i) => (
              <View
                key={i}
                style={[
                  styles.alertRow,
                  {
                    backgroundColor:
                      a.type === 'service_overdue' || a.type === 'max_value'
                        ? tokens.error + '26'
                        : tokens.accent + '26',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                  },
                ]}
              >
                <Text style={[styles.alertText, { color: tokens.pageTitleColor }]}>
                  {a.message}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            styles.logoutButton,
            { backgroundColor: tokens.destructiveButtonBg },
          ]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: tokens.filterActiveColor }]}>
            Log out
          </Text>
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
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
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
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsLabel: {
    fontSize: 14,
  },
  settingsValue: {
    fontSize: 14,
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
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

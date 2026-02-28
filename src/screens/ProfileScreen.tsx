import React, { useState } from 'react';
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
import { authApi } from '../api/auth';
import { stravaApi } from '../api/strava';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [stravaLoading, setStravaLoading] = useState(false);
  const [stravaConnected, setStravaConnected] = useState<boolean | null>(null);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  React.useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
      const fetchStravaStatus = async () => {
        try {
          const { data } = await stravaApi.getStatus();
          setStravaConnected(data.connected);
        } catch {
          setStravaConnected(false);
        }
      };
      fetchStravaStatus();
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
    // Use createURL so Expo Go gets exp://... and dev builds get shoe-tracker://...
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
      style={styles.container}
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
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          {loading && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change avatar</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#999"
            editable={!loading}
            onBlur={handleSaveName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.readOnly}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reset password</Text>
          {!showForgotPassword ? (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          ) : forgotPasswordSent ? (
            <Text style={styles.successText}>Check your email for the reset link.</Text>
          ) : (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={forgotPasswordEmail}
                onChangeText={setForgotPasswordEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.button}
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
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strava</Text>
          {stravaConnected ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.buttonDisabled]}
              disabled
            >
              <Text style={styles.buttonDisabledText}>Strava Connected</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleConnectStrava}
              disabled={stravaLoading}
            >
              {stravaLoading ? (
                <ActivityIndicator color="#2563eb" />
              ) : (
                <Text style={styles.buttonSecondaryText}>Connect Strava</Text>
              )}
            </TouchableOpacity>
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
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 8,
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
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#fff',
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
  avatarHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
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
    backgroundColor: '#fafafa',
  },
  readOnly: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 14,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
    borderColor: '#94a3b8',
  },
  buttonDisabledText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 14,
  },
  successText: {
    fontSize: 14,
    color: '#059669',
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#dc2626',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

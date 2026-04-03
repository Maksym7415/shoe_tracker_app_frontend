import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../contexts/AuthContext';

/** Matches both shoe-tracker://strava/callback (dev build) and exp://.../--/strava/callback (Expo Go) */
function isStravaCallbackUrl(url: string): boolean {
  return url.startsWith('shoe-tracker://strava/callback') || url.includes('/strava/callback');
}

function completeAuthSession() {
  try {
    if (Platform.OS === 'ios') {
      WebBrowser.dismissAuthSession();
    } else if (Platform.OS === 'web') {
      WebBrowser.maybeCompleteAuthSession();
    }
  } catch {
    // Not available on this platform; ignore
  }
}

export function StravaDeepLinkHandler() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      if (isStravaCallbackUrl(url)) {
        completeAuthSession();
        refreshUser();
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, [refreshUser]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url && isStravaCallbackUrl(url)) {
        completeAuthSession();
        refreshUser();
      }
    });
  }, [refreshUser]);

  return null;
}

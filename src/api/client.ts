import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'jwt_token';

const getBaseURL = (): string => {
  const url = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
  return url.replace(/\/$/, '');
};

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

const client: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

const AUTH_ENDPOINTS_REQUIRING_TOKEN = ['/api/auth/me', '/api/auth/profile'];

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.url && AUTH_ENDPOINTS_REQUIRING_TOKEN.some((p) => config.url?.includes(p))) {
      console.warn('[API] No token in storage for auth request:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('error', error);
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('[API] 401 Unauthorized on', originalRequest.url, '- clearing token');
      originalRequest._retry = true;
      await setStoredToken(null);
      onUnauthorized?.();
    }

    return Promise.reject(error);
  }
);

export default client;

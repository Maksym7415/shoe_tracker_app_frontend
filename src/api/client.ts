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

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.url && AUTH_ENDPOINTS_REQUIRING_TOKEN.some((p) => config.url?.includes(p))) {
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      await setStoredToken(null);
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

export default client;

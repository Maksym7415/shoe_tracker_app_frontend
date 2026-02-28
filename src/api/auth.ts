import client from './client';
import type { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string) => {
console.log('login', email, password);
    const res = await client.post<LoginResponse>('/api/auth/login', { email, password })
    console.log('res', res);
    return res;
  },

  register: (email: string, password: string, name: string) =>
    client.post<RegisterResponse>('/api/auth/register', { email, password, name }),

  me: () => client.get<User>('/api/auth/me'),

  updateProfile: (data: { name?: string; avatar_url?: string }) =>
    client.put<User>('/api/auth/profile', data),

  updateProfileWithAvatar: (name: string, avatarUri: string, avatarType: string = 'image/jpeg') => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('avatar', {
      uri: avatarUri,
      type: avatarType,
      name: 'avatar.jpg',
    } as unknown as Blob);
    return client.put<User>('/api/auth/profile', formData);
  },

  forgotPassword: (email: string) =>
    client.post('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    client.post('/api/auth/reset-password', { token, password }),
};

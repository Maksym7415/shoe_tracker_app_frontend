import client from './client';
import type { Shoe } from '../types';

export interface ShoesListResponse {
  success: boolean;
  shoes: Shoe[];
}

export interface ShoeSingleResponse {
  success: boolean;
  shoe: Shoe;
}

export interface ShoeCreatePayload {
  brand: string;
  model: string;
  activity_type?: string;
  nick?: string;
  max_distance_km?: number | null;
}

export interface ShoeUpdatePayload {
  activity_type?: string;
  brand?: string;
  model?: string;
  nick?: string;
  max_distance_km?: number | null;
  distance_covered_km?: number | null;
}

export const shoesApi = {
  list: () =>
    client.get<ShoesListResponse>('/api/shoes').then((res) => res.data),

  create: (payload: ShoeCreatePayload) =>
    client
      .post<ShoeSingleResponse>('/api/shoes', payload)
      .then((res) => res.data),

  get: (id: number) =>
    client
      .get<ShoeSingleResponse>(`/api/shoes/${id}`)
      .then((res) => res.data),

  update: (id: number, payload: ShoeUpdatePayload) =>
    client
      .put<ShoeSingleResponse>(`/api/shoes/${id}`, payload)
      .then((res) => res.data),

  remove: (id: number) =>
    client.delete<{ success: boolean }>(`/api/shoes/${id}`).then((res) => res.data),

  setDefault: (id: number) =>
    client
      .put<ShoeSingleResponse>(`/api/shoes/${id}/default`)
      .then((res) => res.data),
};

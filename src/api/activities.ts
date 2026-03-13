import client from './client';
import type { Activity, ActivityShoe, ActivityGear } from '../types';

export interface ActivityCreatePayload {
  name: string;
  date: string;
  activity_type?: 'run' | 'bike' | 'swim' | 'other';
  total_distance_km?: number;
  auto_add_default_shoe?: boolean;
}

export interface ActivityUpdatePayload {
  name?: string;
  date?: string;
  activity_type?: 'run' | 'bike' | 'swim' | 'other';
  total_distance_km?: number;
}

export interface ActivitySingleResponse {
  success: boolean;
  activity: Activity;
}

export interface ActivitiesListResponse {
  success: boolean;
  activities: Activity[];
}

export const activitiesApi = {
  list: () =>
    client
      .get<ActivitiesListResponse>('/api/activities')
      .then((res) => res.data),

  create: (payload: ActivityCreatePayload) =>
    client
      .post<ActivitySingleResponse>('/api/activities', payload)
      .then((res) => res.data),

  get: (id: number) =>
    client
      .get<ActivitySingleResponse>(`/api/activities/${id}`)
      .then((res) => res.data),

  update: (id: number, payload: ActivityUpdatePayload) =>
    client
      .put<ActivitySingleResponse>(`/api/activities/${id}`, payload)
      .then((res) => res.data),

  assignShoes: (activityId: number, shoes: ActivityShoe[]) =>
    client
      .put<ActivitySingleResponse>(`/api/activities/${activityId}/shoes`, shoes)
      .then((res) => res.data),

  assignGear: (activityId: number, gear: ActivityGear[]) =>
    client
      .put<ActivitySingleResponse>(`/api/activities/${activityId}/gear`, gear)
      .then((res) => res.data),

  remove: (id: number) =>
    client
      .delete<{ success: boolean }>(`/api/activities/${id}`)
      .then((res) => res.data),
};

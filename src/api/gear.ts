import client from './client';
import type { Gear, Installation, Service, GearAlert } from '../types';

export interface GearListParams {
  activity_type?: string;
  gear_type?: string;
}

export interface GearListResponse {
  success: boolean;
  gear: Gear[];
}

export interface GearSingleResponse {
  success: boolean;
  gear: Gear & { installations?: Installation[]; services?: Service[] };
}

export interface GearCreatePayload {
  activity_type?: string;
  gear_type?: string;
  brand: string;
  model: string;
  nick?: string;
  metric_type?: string;
  max_value: number;
  value_covered?: number;
  parent_gear_id?: number | null;
}

export interface GearUpdatePayload {
  activity_type?: string;
  gear_type?: string;
  brand?: string;
  model?: string;
  nick?: string;
  max_value?: number | null;
  value_covered?: number | null;
  parent_gear_id?: number | null;
}

export interface ServiceCreatePayload {
  name: string;
  interval_value: number;
  interval_unit?: string;
  early_warning_ratio?: number;
}

export interface ServiceUpdatePayload {
  name?: string;
  interval_value?: number;
  interval_unit?: string;
  early_warning_ratio?: number | null;
}

export interface AlertsResponse {
  success: boolean;
  alerts: GearAlert[];
}

function buildQuery(params: GearListParams): string {
  const search = new URLSearchParams();
  if (params.activity_type) search.set('activity_type', params.activity_type);
  if (params.gear_type) search.set('gear_type', params.gear_type);
  const q = search.toString();
  return q ? `?${q}` : '';
}

export const gearApi = {
  list: (params: GearListParams = {}) =>
    client
      .get<GearListResponse>(`/api/gear${buildQuery(params)}`)
      .then((res) => res.data),

  create: (payload: GearCreatePayload) =>
    client.post<GearSingleResponse>('/api/gear', payload).then((res) => res.data),

  get: (id: number) =>
    client.get<GearSingleResponse>(`/api/gear/${id}`).then((res) => res.data),

  getComponents: (parentId: number) =>
    client
      .get<{ success: boolean; components: Gear[] }>(`/api/gear/${parentId}/components`)
      .then((res) => res.data),

  update: (id: number, payload: GearUpdatePayload) =>
    client.put<GearSingleResponse>(`/api/gear/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    client.delete<{ success: boolean }>(`/api/gear/${id}`).then((res) => res.data),

  setDefault: (id: number) =>
    client.put<GearSingleResponse>(`/api/gear/${id}/default`).then((res) => res.data),

  retire: (id: number) =>
    client.put<GearSingleResponse>(`/api/gear/${id}/retire`).then((res) => res.data),

  createInstallation: (gearId: number, body: { parent_gear_id: number }) =>
    client
      .post<{ success: boolean }>(`/api/gear/${gearId}/installations`, body)
      .then((res) => res.data),

  removeInstallation: (gearId: number, installationId: number) =>
    client
      .delete<{ success: boolean }>(`/api/gear/${gearId}/installations/${installationId}`)
      .then((res) => res.data),

  listServices: (gearId: number) =>
    client.get<{ success: boolean; services: Service[] }>(`/api/gear/${gearId}/services`).then((res) => res.data),

  createService: (gearId: number, payload: ServiceCreatePayload) =>
    client
      .post<{ success: boolean; service: Service }>(`/api/gear/${gearId}/services`, payload)
      .then((res) => res.data),

  updateService: (gearId: number, serviceId: number, payload: ServiceUpdatePayload) =>
    client
      .put<{ success: boolean; service: Service }>(
        `/api/gear/${gearId}/services/${serviceId}`,
        payload
      )
      .then((res) => res.data),

  removeService: (gearId: number, serviceId: number) =>
    client
      .delete<{ success: boolean }>(`/api/gear/${gearId}/services/${serviceId}`)
      .then((res) => res.data),

  logService: (gearId: number, serviceId: number) =>
    client
      .post<{ success: boolean }>(`/api/gear/${gearId}/services/${serviceId}/logs`)
      .then((res) => res.data),

  getAlerts: () =>
    client.get<AlertsResponse>('/api/gear/alerts').then((res) => res.data),
};

import client from './client';

export interface StravaConnectResponse {
  /** Strava OAuth authorize URL (preferred) */
  authorize_url?: string;
  /** @deprecated Use authorize_url */
  url?: string;
}

export interface StravaStatus {
  connected: boolean;
}

export const stravaApi = {
  getConnectUrl: (redirectUri?: string) =>
    client
      .get<StravaConnectResponse>(
        '/api/strava/connect',
        redirectUri ? { params: { redirect_uri: redirectUri } } : undefined,
      )
      .then((res) => res.data),
  getStatus: () => client.get<StravaStatus>('/api/strava/status').then((res) => res.data),
  disconnect: () =>
    client.post<{ success: boolean }>('/api/strava/disconnect').then((res) => res.data),
};

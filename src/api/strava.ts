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
    client.get<StravaConnectResponse>(
      '/api/strava/connect',
      redirectUri ? { params: { redirect_uri: redirectUri } } : undefined
    ),
  getStatus: () => client.get<StravaStatus>('/api/strava/status'),
  disconnect: () => client.post('/api/strava/disconnect'),
};

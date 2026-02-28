# Strava Integration Configuration

This document describes how to configure the backend and Strava Developer Console for the mobile app's Strava OAuth flow.

## Backend .env

Add these variables to your backend `.env`:

| Variable                       | Value                                             |
| ------------------------------ | ------------------------------------------------- |
| `STRAVA_REDIRECT_URI`          | `https://YOUR-NGROK.ngrok.io/api/strava/callback` |
| `STRAVA_FRONTEND_REDIRECT_URL` | `shoe-tracker://strava/callback`                  |

- **STRAVA_REDIRECT_URI**: The backend callback URL where Strava redirects after the user authorizes. Use your ngrok URL (or production domain) for development.
- **STRAVA_FRONTEND_REDIRECT_URL**: Fallback deep link when the app doesn't pass `redirect_uri`. For **Expo Go** development, the app passes `redirect_uri` dynamically (e.g. `exp://192.168.x.x:8081/--/strava/callback`). The backend must use this when provided in `GET /api/strava/connect?redirect_uri=...`.

## Strava Developer Console

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. **Authorization Callback Domain**: Set to your ngrok host (e.g. `xxxx.ngrok.io`) without `https://`
3. **Redirect URI** (if Strava asks): Must match `STRAVA_REDIRECT_URI` exactly (e.g. `https://xxxx.ngrok.io/api/strava/callback`)

## Flow Summary

1. App calls `GET /api/strava/connect?redirect_uri=<url>` (with JWT) → backend returns `authorize_url`
2. App opens Strava OAuth via `openAuthSessionAsync(authorize_url, redirect_uri)`. The `redirect_uri` is `Linking.createURL('strava/callback')` — in Expo Go this is `exp://.../--/strava/callback`, in dev/prod builds it's `shoe-tracker://strava/callback`.
3. User authorizes on Strava → Strava redirects to backend callback
4. Backend exchanges code, stores tokens, redirects to the `redirect_uri` from step 1 (or `STRAVA_FRONTEND_REDIRECT_URL` if not provided)
5. App receives deep link → refreshes profile to show `strava_connected: true`

**Backend requirement**: The `GET /api/strava/connect` endpoint must accept an optional `redirect_uri` query param and use it when redirecting after OAuth. If omitted, fall back to `STRAVA_FRONTEND_REDIRECT_URL`.

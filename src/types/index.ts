export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  strava_connected?: boolean;
}

export interface Shoe {
  id: number;
  activity_type: string;
  brand: string;
  model: string;
  nick?: string;
  max_distance_km: number | null;
  is_default: boolean;
  created_at: string;
  distance_covered_km?: number | null;
}

export interface ActivityShoe {
  id: number;
  activity_id: number;
  shoe_id: number;
  distance_km: number;
}

export interface Activity {
  id: number;
  name: string;
  date: string;
  total_distance_km: number;
  source: 'manual' | 'strava';
  strava_activity_id?: number;
  shoes?: ActivityShoe[];
}

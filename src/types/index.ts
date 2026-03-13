export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  preferred_distance_unit?: 'km' | 'miles';
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

export interface Gear {
  id: number;
  activity_type: string;
  gear_type: string;
  brand: string;
  model: string;
  nick?: string;
  metric_type: string;
  max_value: number | null;
  value_covered: number | null;
  is_default: boolean;
  status: 'active' | 'retired';
  created_at: string;
  components_count?: number;
  installations?: Installation[];
  services?: Service[];
}

export interface Installation {
  id: number;
  parent_gear_id: number;
  installed_at: string;
  removed_at: string | null;
}

export interface Service {
  id: number;
  name: string;
  interval_value: number;
  interval_unit: string;
  early_warning_ratio: number;
  last_performed_value?: number;
}

export interface GearAlert {
  gear_id: number;
  type: 'max_value' | 'service_overdue' | 'service_warning';
  service_id?: number;
  message: string;
}

export interface ActivityShoe {
  shoe_id: number;
  distance_km: number;
}

export interface ActivityGear {
  gear_id: number;
  value: number;
  active_component_ids?: number[];
  excluded_component_ids?: number[];
}

export interface Activity {
  id: number;
  name: string;
  date: string;
  total_distance_km: number;
  activity_type?: string;
  source: 'manual' | 'strava';
  strava_activity_id?: number | null;
  created_at?: string;
  moving_time_seconds?: number | null;
  shoes?: ActivityShoe[];
  gear?: ActivityGear[];
}

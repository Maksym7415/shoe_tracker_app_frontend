const KM_TO_MILES = 0.621371;

export function convertKmToMiles(km: number): number {
  return km * KM_TO_MILES;
}

export function formatDistance(km: number, unit: 'km' | 'miles'): string {
  const value = unit === 'miles' ? convertKmToMiles(km) : km;
  const suffix = unit === 'miles' ? ' mi' : ' km';
  return `${Number(value).toFixed(1)}${suffix}`;
}

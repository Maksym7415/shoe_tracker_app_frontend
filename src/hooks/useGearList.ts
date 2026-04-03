import { useCallback, useState } from 'react';
import { gearApi } from '../api/gear';
import type { Gear } from '../types';

export function useGearList() {
  const [gear, setGear] = useState<Gear[]>([]);
  const [componentsCountMap, setComponentsCountMap] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGear = useCallback(async () => {
    try {
      setError(null);
      const [shoesRes, bikesRes] = await Promise.all([
        gearApi.list({ gear_type: 'shoe' }),
        gearApi.list({ gear_type: 'bike' }),
      ]);
      const allGear = [...(shoesRes.gear ?? []), ...(bikesRes.gear ?? [])];
      setGear(allGear);

      const parentGear = allGear.filter((g) => g.gear_type === 'shoe' || g.gear_type === 'bike');
      const counts = await Promise.all(
        parentGear.map(async (g) => {
          try {
            const res = await gearApi.getComponents(g.id);
            return [g.id, (res.components ?? []).length] as const;
          } catch {
            return [g.id, 0] as const;
          }
        }),
      );
      setComponentsCountMap(new Map(counts));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? 'Failed to load gear');
      setGear([]);
      setComponentsCountMap(new Map());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetchGear();
  }, [fetchGear]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchGear();
  }, [fetchGear]);

  return {
    gear,
    componentsCountMap,
    loading,
    refreshing,
    error,
    load,
    refresh,
    refetch: fetchGear,
  };
}

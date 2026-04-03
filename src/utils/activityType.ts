export type ActivityFilterType = 'all' | 'run' | 'ride' | 'swim' | 'other';

export function normalizeActivityType(type: string): ActivityFilterType {
  const t = type.toLowerCase();
  if (t.includes('run') || t === 'running' || t === 'walking' || t === 'trail' || t === 'track') {
    return 'run';
  }
  if (t.includes('ride') || t.includes('cycl') || t === 'bike') {
    return 'ride';
  }
  if (t.includes('swim')) return 'swim';
  return 'other';
}

import { describe, expect, it } from 'vitest';
import { themeTokens } from '../theme/tokens';
import { getActivityBadge } from './activityBadge';

describe('getActivityBadge', () => {
  it('returns themed colors and labels', () => {
    const badge = getActivityBadge(themeTokens.dark, 'running');
    expect(badge.label).toBe('Run');
    expect(badge.textColor).toBe(themeTokens.dark.badgeRunColor);
    expect(badge.backgroundColor).toBe(themeTokens.dark.badgeRunBg);
  });

  it('falls back to other when type is missing', () => {
    const badge = getActivityBadge(themeTokens.dark, undefined);
    expect(badge.type).toBe('other');
    expect(badge.label).toBe('Other');
  });
});

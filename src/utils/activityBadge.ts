import type { ThemeTokens } from '../theme/tokens';
import { normalizeActivityType, type ActivityFilterType } from './activityType';

export type ActivityBadgeType = Exclude<ActivityFilterType, 'all'>;

export type ActivityBadge = {
  type: ActivityBadgeType;
  label: string;
  textColor: string;
  backgroundColor: string;
};

function badgeLabel(type: ActivityBadgeType): string {
  switch (type) {
    case 'run':
      return 'Run';
    case 'ride':
      return 'Ride';
    case 'swim':
      return 'Swim';
    case 'other':
      return 'Other';
  }
}

export function getActivityBadge(
  tokens: ThemeTokens,
  rawType: string | null | undefined,
): ActivityBadge {
  const normalized = rawType ? normalizeActivityType(rawType) : 'other';
  const type: ActivityBadgeType = normalized === 'all' ? 'other' : normalized;

  switch (type) {
    case 'run':
      return {
        type,
        label: badgeLabel(type),
        textColor: tokens.badgeRunColor,
        backgroundColor: tokens.badgeRunBg,
      };
    case 'ride':
      return {
        type,
        label: badgeLabel(type),
        textColor: tokens.badgeRideColor,
        backgroundColor: tokens.badgeRideBg,
      };
    case 'swim':
      return {
        type,
        label: badgeLabel(type),
        textColor: tokens.badgeSwimColor,
        backgroundColor: tokens.badgeSwimBg,
      };
    case 'other':
      return {
        type,
        label: badgeLabel(type),
        textColor: tokens.badgeOtherColor,
        backgroundColor: tokens.badgeOtherBg,
      };
  }
}

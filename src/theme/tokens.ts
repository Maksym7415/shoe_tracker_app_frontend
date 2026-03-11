/**
 * Theme tokens. Dark theme is fully defined; light uses dark as fallback until values are provided.
 */
export type ThemeMode = 'dark' | 'light';

export interface ThemeTokens {
  // Page
  pageBackground: string;
  pageTitleColor: string;
  pageTitleFontSize: number;
  pageTitleFontWeight: '700';
  pageTitleFontFamily: string;

  // Typography
  fontTitle: string;
  fontBody: string;

  // FAB
  fabBackground: string;
  fabSize: number;

  // Bottom navigation
  tabBarBackground: string;
  tabBarActiveTint: string;
  tabBarInactiveTint: string;

  // Filters (My Gear)
  filterActiveBg: string;
  filterActiveColor: string;
  filterInactiveBg: string;
  filterInactiveColor: string;
  filterFontSize: number;
  filterFontWeight: '500';

  // Card
  cardBackground: string;
  cardBorder: string;
  cardBorderRadius: number;

  // Gear item
  gearItemHeaderColor: string;
  gearItemHeaderFontSize: number;
  gearItemHeaderFontWeight: '600';
  gearItemHeaderFontFamily: string;
  gearItemSubtitleColor: string;
  gearItemSubtitleFontSize: number;
  gearItemDefaultBadgeColor: string;
  gearItemDefaultBadgeFontSize: number;
  gearItemMileageColor: string;

  // Activity type badges
  badgeRunColor: string;
  badgeRunBg: string;
  badgeRideColor: string;
  badgeRideBg: string;
  badgeSwimColor: string;
  badgeSwimBg: string;
  badgeOtherColor: string;
  badgeOtherBg: string;
  badgeFontSize: number;
  badgeFontWeight: '500';
  badgeBorderRadius: number;

  // Activity list item
  activityTitleColor: string;
  activityTitleFontSize: number;
  activityTitleFontWeight: '600';
  activityTitleFontFamily: string;
  activityDateColor: string;
  activityDateFontSize: number;
  activityDistanceColor: string;
  activityDistanceFontSize: number;
  activityDistanceFontWeight: '500';
  activityMetaColor: string;
  activityMetaFontSize: number;
  activityStravaColor: string;
  activityManualColor: string;

  // Profile
  profileAvatarPlaceholderBg: string;
  profileSecondaryText: string;

  // Common
  accent: string;
  textSecondary: string;
  error: string;
  loadingIndicator: string;
  destructiveButtonBg: string;
}

const darkTokens: ThemeTokens = {
  pageBackground: '#12161d',
  pageTitleColor: '#e7ebef',
  pageTitleFontSize: 18,
  pageTitleFontWeight: '700',
  pageTitleFontFamily: 'SpaceGrotesk_700Bold',

  fontTitle: 'System',
  fontBody: 'System',

  fabBackground: '#f97924',
  fabSize: 56,

  tabBarBackground: '#1d222af2',
  tabBarActiveTint: '#f97924',
  tabBarInactiveTint: '#a1a1a1',

  filterActiveBg: '#f97924',
  filterActiveColor: '#ffffff',
  filterInactiveBg: '#2b303b',
  filterInactiveColor: '#d1d9e0',
  filterFontSize: 12,
  filterFontWeight: '500',

  cardBackground: '#1d222a',
  cardBorder: '#303540',
  cardBorderRadius: 12,

  gearItemHeaderColor: '#e7ebef',
  gearItemHeaderFontSize: 14,
  gearItemHeaderFontWeight: '600',
  gearItemHeaderFontFamily: 'SpaceGrotesk_600SemiBold',
  gearItemSubtitleColor: '#7e8a9a',
  gearItemSubtitleFontSize: 14,
  gearItemDefaultBadgeColor: '#f97924',
  gearItemDefaultBadgeFontSize: 10,
  gearItemMileageColor: '#7e8a9a',

  badgeRunColor: '#f97924',
  badgeRunBg: '#f9792426',
  badgeRideColor: '#0da2e7',
  badgeRideBg: '#0da2e726',
  badgeSwimColor: '#2bd4bd',
  badgeSwimBg: '#2bd4bd26',
  badgeOtherColor: '#7e8a9a',
  badgeOtherBg: '#7e8a9a26',
  badgeFontSize: 12,
  badgeFontWeight: '500',
  badgeBorderRadius: 10,

  activityTitleColor: '#e7ebef',
  activityTitleFontSize: 16,
  activityTitleFontWeight: '600',
  activityTitleFontFamily: 'SpaceGrotesk_600SemiBold',
  activityDateColor: '#7e8a9a',
  activityDateFontSize: 12,
  activityDistanceColor: '#e7ebef',
  activityDistanceFontSize: 14,
  activityDistanceFontWeight: '500',
  activityMetaColor: '#7e8a9a',
  activityMetaFontSize: 12,
  activityStravaColor: '#f97924',
  activityManualColor: '#0da2e7',

  profileAvatarPlaceholderBg: '#2b303b',
  profileSecondaryText: '#7e8a9a',

  accent: '#f97924',
  textSecondary: '#7e8a9a',
  error: '#dc2626',
  loadingIndicator: '#f97924',
  destructiveButtonBg: '#7f1d1d',
};

/** Light theme: uses dark tokens as fallback until values are provided */
const lightTokens: ThemeTokens = { ...darkTokens };

export const themeTokens: Record<ThemeMode, ThemeTokens> = {
  dark: darkTokens,
  light: lightTokens,
};

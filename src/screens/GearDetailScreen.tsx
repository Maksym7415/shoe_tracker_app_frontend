import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDistance } from '../utils/formatDistance';
import { getActivityBadge } from '../utils/activityBadge';
import { gearApi } from '../api/gear';
import type { Gear, Service } from '../types';
import { StarIcon, ChevronRightIcon, ChevronDownIcon } from '../components/icons';
import { useGearList } from '../hooks/useGearList';


type Props = NativeStackScreenProps<MainStackParamList, 'Shoes/Detail'>;

export default function GearDetailScreen({ route,navigation }: Props) {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const unit = user?.preferred_distance_unit ?? 'km';
  const gearId = route.params.id;
  const [gear, setGear] = useState<
    (Gear & { installations?: unknown[]; services?: Service[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [componentsExpanded, setComponentsExpanded] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [components, setComponents] = useState<Gear[]>([]);
  const {refetch}= useGearList()


  const fetchGear = useCallback(async () => {
    try {
      setError(null);
      const [gearRes, componentsRes] = await Promise.all([
        gearApi.get(gearId),
        gearApi.getComponents(gearId).catch(() => null),
      ]);
      setGear(gearRes.gear);
      setComponents(componentsRes?.components ?? []);
      setComponentsExpanded(false);
      setServicesExpanded(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? 'Failed to load gear');
      setGear(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gearId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchGear();
    }, [fetchGear]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGear();
  }, [fetchGear]);

const handleToggleDefault = useCallback(async () => {
  if (!gear) return;

  const wasDefault = gear.is_default;

  try {
    // optimistic update (миттєво UI)
    setGear(prev => prev ? { ...prev, is_default: !wasDefault } : prev);

    if (wasDefault) {
      await gearApi.unsetDefault(gear.id);
    } else {
      await gearApi.setDefault(gear.id);
    }

    await refetch(); 
  } catch (err) {
  
    setGear(prev => prev ? { ...prev, is_default: wasDefault } : prev);
  }
}, [gear, refetch]);

  if (loading && !gear) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <ActivityIndicator size="large" color={tokens.loadingIndicator} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (error && !gear) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.pageBackground }]}>
        <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: tokens.accent }]}
          onPress={() => fetchGear()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
    if (!gear) return null;

  const gearName = gear.nick?.trim() ? gear.nick : `${gear.brand} ${gear.model}`;
  const subtitle = gear.nick?.trim() ? `${gear.brand} ${gear.model}` : null;
  const rawCurrent = gear.value_covered ?? 0;
  const rawMax = gear.max_value ?? null;
  const isMaxSet = rawMax != null && rawMax > 0;
  const mileage = formatDistance(rawCurrent, unit);
  const maxMileage = isMaxSet ? formatDistance(rawMax, unit) : null;
  const isRetired = gear.status === 'retired';
  const services = gear.services ?? [];
  const badge = getActivityBadge(tokens, gear.activity_type);
  const addedDate = new Date(gear.created_at);
  const addedLabel = `Added ${addedDate.toLocaleDateString()}`;


  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.pageBackground }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tokens.accent]} />
      }
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: tokens.cardBackground,
            borderColor: tokens.cardBorder,
            borderRadius: tokens.cardBorderRadius,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerMain}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  {
                    color: tokens.gearItemHeaderColor,
                    fontSize: tokens.gearItemHeaderFontSize,
                    fontWeight: tokens.gearItemHeaderFontWeight,
                    fontFamily: tokens.gearItemHeaderFontFamily,
                  },
                ]}
                numberOfLines={1}
              >
                {gearName}
              </Text>
              {gear.is_default && (
                <View style={[styles.defaultBadge, { backgroundColor: tokens.accent + '26' }]}>
                  <StarIcon size={12} color={tokens.gearItemDefaultBadgeColor} />
                  <Text
                    style={[
                      styles.defaultText,
                      {
                        color: tokens.gearItemDefaultBadgeColor,
                        fontSize: tokens.gearItemDefaultBadgeFontSize,
                      },
                    ]}
                  >
                    DEFAULT
                  </Text>
                </View>
              )}
              {isRetired && (
                <View style={[styles.retiredBadge, { backgroundColor: tokens.cardBorder }]}>
                  <Text style={[styles.retiredText, { color: tokens.textSecondary }]}>RETIRED</Text>
                </View>
              )}
            </View>
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: tokens.gearItemSubtitleColor,
                    fontSize: tokens.gearItemSubtitleFontSize,
                  },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
            <Text style={[styles.addedText, { color: tokens.textSecondary }]}>{addedLabel}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: badge.backgroundColor }]}>
            <Text
              style={[
                styles.typeBadgeText,
                {
                  color: badge.textColor,
                  fontSize: tokens.badgeFontSize,
                  fontWeight: tokens.badgeFontWeight,
                },
              ]}
            >
              {badge.label}
            </Text>
          </View>
        </View>
        <View style={styles.distanceSection}>
          <Text style={[styles.distanceValue, { color: tokens.pageTitleColor }]}>
            {isMaxSet ? `${mileage} / ${maxMileage}` : mileage}
          </Text>
          {isMaxSet && (
            <View style={[styles.progressTrack, { backgroundColor: tokens.cardBorder }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: tokens.accent,
                    width: `${Math.min(1, Math.max(0, rawMax ? rawCurrent / rawMax : 0)) * 100}%`,
                  },
                ]}
              />
            </View>
          )}
        </View>
<TouchableOpacity
 onPress={handleToggleDefault}
  style={[
    styles.defaultButton,
    {
      backgroundColor: gear.is_default ? 'transparent' : tokens.accent,
      borderColor: tokens.accent,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
  ]}

>
  <View style={{ marginRight: 6 }}>
    <StarIcon
      size={16}
      color={gear.is_default ? tokens.accent : '#fff'}
    />
  </View>

  <Text
    style={[
      styles.defaultButtonText,
      {
        color: gear.is_default  ? tokens.accent : '#fff',
      },
    ]}
  >
    {gear.is_default  ? 'Remove default' : 'Set as default'}
  </Text>
</TouchableOpacity>
      </View>

      {components.length > 0 && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.cardBackground,
              borderColor: tokens.cardBorder,
              borderRadius: tokens.cardBorderRadius,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: tokens.pageTitleColor }]}>Components</Text>
          <TouchableOpacity
            style={[styles.componentsRow, { borderTopColor: tokens.cardBorder }]}
            onPress={() => setComponentsExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.componentsText, { color: tokens.accent }]}>
              {components.length === 1 ? '1 component' : `${components.length} components`}
            </Text>
            {componentsExpanded ? (
              <ChevronDownIcon size={16} color={tokens.accent} />
            ) : (
              <ChevronRightIcon size={16} color={tokens.accent} />
            )}
          </TouchableOpacity>
          {componentsExpanded && components.length > 0 && (
            <View style={[styles.componentsList, { borderTopColor: tokens.cardBorder }]}>
              {components.map((c) => {
                const compName = c.nick?.trim() ? c.nick : `${c.brand} ${c.model}`;
                const compSubtitle = c.nick?.trim() ? c.brand : c.model;
                const compMileage = formatDistance(c.value_covered ?? 0, unit);
                return (
                  <View
                    key={c.id}
                    style={[
                      styles.componentRow,
                      { backgroundColor: tokens.pageBackground, borderColor: tokens.cardBorder },
                    ]}
                  >
                    <View style={styles.componentMain}>
                      <Text
                        style={[styles.componentName, { color: tokens.pageTitleColor }]}
                        numberOfLines={1}
                      >
                        {compName}
                      </Text>
                      <Text
                        style={[styles.componentSubtitle, { color: tokens.textSecondary }]}
                        numberOfLines={1}
                      >
                        {compSubtitle}
                      </Text>
                    </View>
                    <Text style={[styles.componentMileage, { color: tokens.gearItemMileageColor }]}>
                      {compMileage}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {services.length > 0 ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.cardBackground,
              borderColor: tokens.cardBorder,
              borderRadius: tokens.cardBorderRadius,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: tokens.pageTitleColor }]}>Services</Text>
          <TouchableOpacity
            style={[styles.componentsRow, { borderTopColor: tokens.cardBorder }]}
            onPress={() => setServicesExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.componentsText, { color: tokens.accent }]}>
              {services.length === 1 ? '1 service' : `${services.length} services`}
            </Text>
            {servicesExpanded ? (
              <ChevronDownIcon size={16} color={tokens.accent} />
            ) : (
              <ChevronRightIcon size={16} color={tokens.accent} />
            )}
          </TouchableOpacity>
          {servicesExpanded && (
            <View style={[styles.servicesList, { borderTopColor: tokens.cardBorder }]}>
              {services.map((s) => (
                <View
                  key={s.id}
                  style={[styles.serviceRow, { borderBottomColor: tokens.cardBorder }]}
                >
                  <Text style={[styles.serviceName, { color: tokens.pageTitleColor }]}>
                    {s.name}
                  </Text>
                  <Text style={[styles.serviceDetail, { color: tokens.textSecondary }]}>
                    Every {s.interval_value} {s.interval_unit}
                    {s.last_performed_value != null
                      ? ` · Last at ${s.last_performed_value} ${s.interval_unit}`
                      : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  defaultButton: {
  marginTop: 16,
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: 'center',
},

defaultButtonText: {
  fontSize: 14,
  fontWeight: '600',
},
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  retiredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  retiredText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  serviceRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  serviceDetail: {
    fontSize: 13,
  },
  distanceSection: {
    marginTop: 16,
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerMain: {
    flex: 1,
    paddingRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  defaultText: {
    fontWeight: '600',
  },
  addedText: {
    fontSize: 12,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  typeBadgeText: {},
  componentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  componentsText: {
    fontSize: 14,
  },
  componentsEmpty: {
    marginTop: 4,
  },
  componentsEmptyText: {
    fontSize: 14,
  },
  componentsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  componentMain: {
    flex: 1,
  },
  componentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  componentSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  componentMileage: {
    fontSize: 12,
  },
  servicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  servicesList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
});

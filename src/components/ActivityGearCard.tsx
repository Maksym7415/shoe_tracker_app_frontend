import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { formatDistance } from '../utils/formatDistance';
import { ChevronRightIcon, ChevronDownIcon, TrashIcon } from './icons';
import { gearApi } from '../api/gear';
import type { Gear } from '../types';

export interface ActivityGearCardProps {
  gearId: number;
  gearName: string;
  gearSubtitle: string;
  value: number;
  componentsCount: number;
  activeComponentIds: number[];
  excludedComponentIds: number[];
  editable: boolean;
  unit: 'km' | 'miles';
  distanceEditable?: boolean;
  distanceValue?: string;
  onDistanceChange?: (value: string) => void;
  onToggleComponent?: (componentId: number, active: boolean) => void;
  onRemove?: () => void;
}

export default function ActivityGearCard({
  gearId,
  gearName,
  gearSubtitle,
  value,
  componentsCount,
  activeComponentIds,
  excludedComponentIds,
  editable,
  unit,
  distanceEditable,
  distanceValue,
  onDistanceChange,
  onToggleComponent,
  onRemove,
}: ActivityGearCardProps) {
  const { tokens } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [components, setComponents] = useState<Gear[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);

  const isComponentActive = useCallback(
    (id: number) => !excludedComponentIds.includes(id),
    [excludedComponentIds]
  );

  const fetchComponents = useCallback(async () => {
    if (components.length > 0) {
      setExpanded((e) => !e);
      return;
    }
    setLoadingComponents(true);
    try {
      const res = await gearApi.getComponents(gearId);
      setComponents(res.components ?? []);
      setExpanded(true);
    } catch {
      setExpanded(false);
    } finally {
      setLoadingComponents(false);
    }
  }, [gearId, components.length]);

  const valueStr = distanceEditable && distanceValue !== undefined
    ? distanceValue
    : formatDistance(value, unit);

  return (
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
      <View style={styles.mainRow}>
        <View style={styles.main}>
          <Text
            style={[
              styles.gearName,
              { color: tokens.gearItemHeaderColor },
            ]}
            numberOfLines={1}
          >
            {gearName}
          </Text>
          {gearSubtitle ? (
            <Text
              style={[styles.subtitle, { color: tokens.gearItemSubtitleColor }]}
              numberOfLines={1}
            >
              {gearSubtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.rightSection}>
          {distanceEditable && onDistanceChange ? (
            <TextInput
              style={[
                styles.distanceInput,
                {
                  color: tokens.gearItemMileageColor,
                  backgroundColor: tokens.cardBackground,
                  borderColor: tokens.cardBorder,
                },
              ]}
              value={distanceValue ?? String(value)}
              onChangeText={onDistanceChange}
              keyboardType="decimal-pad"
              placeholder="km"
            />
          ) : (
            <Text style={[styles.value, { color: tokens.gearItemMileageColor }]}>
              {valueStr}
            </Text>
          )}
          {editable && onRemove && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={onRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <TrashIcon size={20} color={tokens.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {componentsCount > 0 && (
        <>
          <TouchableOpacity
            style={[styles.componentsSection, { borderTopColor: tokens.cardBorder }]}
            onPress={fetchComponents}
            activeOpacity={0.7}
            disabled={loadingComponents}
          >
            <Text style={[styles.componentsText, { color: tokens.accent }]}>
              {componentsCount === 1 ? '1 component' : `${componentsCount} components`}
            </Text>
            {loadingComponents ? (
              <ActivityIndicator size="small" color={tokens.accent} />
            ) : expanded ? (
              <ChevronDownIcon size={16} color={tokens.accent} />
            ) : (
              <ChevronRightIcon size={16} color={tokens.accent} />
            )}
          </TouchableOpacity>

          {expanded && components.length > 0 && (
            <View style={[styles.componentsList, { borderTopColor: tokens.cardBorder }]}>
              {components.map((c) => {
                const compName = c.nick?.trim() ? c.nick : `${c.brand} ${c.model}`;
                const compSubtitle = c.nick?.trim() ? c.brand : c.model;
                const active = isComponentActive(c.id);
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
                    {editable && onToggleComponent ? (
                      <Switch
                        value={active}
                        onValueChange={(v) => onToggleComponent(c.id, v)}
                        trackColor={{
                          false: tokens.cardBorder,
                          true: tokens.accent + '80',
                        }}
                        thumbColor={tokens.accent}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.statusLabel,
                          {
                            color: active ? tokens.textSecondary : tokens.error,
                          },
                        ]}
                      >
                        {active ? 'active' : 'inactive'}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  main: {
    flex: 1,
  },
  gearName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 14,
  },
  distanceInput: {
    width: 56,
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  componentsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  componentsText: {
    fontSize: 12,
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
  statusLabel: {
    fontSize: 12,
    textTransform: 'lowercase',
  },
});

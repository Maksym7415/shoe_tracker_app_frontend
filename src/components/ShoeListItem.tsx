import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Shoe } from '../types';

interface ShoeListItemProps {
  shoe: Shoe;
  onPress: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}

export default function ShoeListItem({
  shoe,
  onPress,
  onSetDefault,
  onDelete,
}: ShoeListItemProps) {
  const hasMax = shoe.max_distance_km != null;
  const hasCovered = shoe.distance_covered_km != null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.brandModel}>
          {shoe.brand} {shoe.model}
        </Text>
        {shoe.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      {shoe.nick ? (
        <Text style={styles.nick} numberOfLines={1}>
          {shoe.nick}
        </Text>
      ) : null}
      <View style={styles.meta}>
        <Text style={styles.metaText}>{shoe.activity_type}</Text>
        {hasMax && (
          <Text style={styles.metaText}>Max: {Number(shoe.max_distance_km).toFixed(2)} km</Text>
        )}
        {hasCovered && (
          <Text style={styles.metaText}>Covered: {Number(shoe.distance_covered_km).toFixed(2)} km</Text>
        )}
      </View>
      <View style={styles.actions}>
        {!shoe.is_default && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onSetDefault();
            }}
          >
            <Text style={styles.actionButtonText}>Set default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brandModel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  nick: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Activity } from '../types';

interface ActivityListItemProps {
  activity: Activity;
  onPress: () => void;
  onDelete: () => void;
}

export default function ActivityListItem({
  activity,
  onPress,
  onDelete,
}: ActivityListItemProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {activity.name}
        </Text>
        <Text style={styles.date}>{activity.date}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {Number(activity.total_distance_km).toFixed(2)} km
        </Text>
        {activity.source === 'strava' && (
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>Strava</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
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
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  sourceBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
  },
});

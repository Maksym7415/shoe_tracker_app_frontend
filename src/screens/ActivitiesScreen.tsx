import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ActivitiesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activities</Text>
      <Text style={styles.subtitle}>Activities list will be implemented in Phase 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

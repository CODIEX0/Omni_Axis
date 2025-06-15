import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IntegrationTest } from '../../components/IntegrationTest';

export default function TestScreen() {
  return (
    <View style={styles.container}>
      <IntegrationTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

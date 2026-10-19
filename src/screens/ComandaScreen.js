import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';

export default function ComandaScreen({ route }) {
  const { mesa } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Comanda</Text>
      {mesa ? (
        <Text style={styles.subtitle}>Mesa {mesa.numero}</Text>
      ) : (
        <Text style={styles.subtitle}>Selecione uma mesa</Text>
      )}
      <Text style={styles.info}>Em desenvolvimento...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 20,
  },
  info: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});
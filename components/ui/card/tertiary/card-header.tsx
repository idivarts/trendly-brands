import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type CardHeaderProps = {
  title: string;
  description?: string;
};

export const CardHeader = ({
  title,
  description
}: CardHeaderProps) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});

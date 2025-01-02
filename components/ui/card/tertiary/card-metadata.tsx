import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type CardMetaDataProps = {
  quote?: string;
  timeline?: string;
};

export const CardMetaData = ({ quote, timeline }: CardMetaDataProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.metaContainer}>
        {quote && <Text style={styles.meta}>Quote: {quote}</Text>}
        {timeline && <Text style={styles.meta}>Timeline: {timeline}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
});

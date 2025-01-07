import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/theme/Themed';

type CardDescriptionProps = {
  text: string;
};

export const CardDescription = ({ text }: CardDescriptionProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text} numberOfLines={3}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});

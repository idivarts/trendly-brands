import Colors from '@/constants/Colors';
import { Theme, useTheme } from '@react-navigation/native';
import React from 'react';
import { View, StyleSheet } from 'react-native';

type CardProps = {
  children: React.ReactNode;
};

export const Card = ({
  children,
}: CardProps) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <View style={styles.card}>{children}</View>
  );
};

const stylesFn = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: Colors(theme).background,
    gap: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
});

import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/theme/Themed';
import { Theme, useTheme } from '@react-navigation/native';
import Colors from '@/constants/Colors';

type CardDescriptionProps = {
  text: string;
};

export const CardDescription = ({ text }: CardDescriptionProps) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text} numberOfLines={3}>
        {text}
      </Text>
    </View>
  );
};

const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    backgroundColor: Colors(theme).transparent,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});

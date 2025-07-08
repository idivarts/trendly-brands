import { Theme, useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/theme/Themed';
import Colors from '@/constants/Colors';
import { CURRENCY_SYMBOL } from '@/constants/Unit';

type CardMetaDataProps = {
  quote?: string;
  timeline?: string;
};

export const CardMetaData = ({ quote, timeline }: CardMetaDataProps) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <View style={styles.container}>
      <View style={styles.metaContainer}>
        {quote && <Text style={styles.meta}>Quote: {CURRENCY_SYMBOL}{quote}</Text>}
        {timeline && <Text style={styles.meta}>Timeline: {timeline}</Text>}
      </View>
    </View>
  );
};

const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: Colors(theme).transparent,
    gap: 16,
  },
  metaContainer: {
    backgroundColor: Colors(theme).transparent,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 16,
    fontWeight: '500',
  },
});

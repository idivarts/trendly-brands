import { Text, View } from '@/components/theme/Themed';
import Colors from '@/constants/Colors';
import { CURRENCY_SYMBOL } from '@/constants/Unit';
import { Theme, useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';

type CardFooterProps = {
  quote: string;
  // timeline: string;
};

export const CardFooter = ({
  quote,
  // timeline,
}: CardFooterProps) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <View style={styles.container}>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Quote: {CURRENCY_SYMBOL}{quote}</Text>
        {/* <Text style={styles.footerText}>Timeline: {timeline}</Text> */}
      </View>
    </View>
  );
};

const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    backgroundColor: Colors(theme).transparent,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: Colors(theme).transparent,
  },
  footerText: {
    fontSize: 14,
  },
});

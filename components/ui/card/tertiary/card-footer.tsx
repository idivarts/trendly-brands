import React from 'react';
import { View } from 'react-native';

type CardFooterProps = {
  footerActions?: React.ReactNode;
};

export const CardFooter = ({
  footerActions = null,
}: CardFooterProps) => {
  return (
    <View>
      {footerActions}
    </View>
  );
};

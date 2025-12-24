import { Theme, useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { View } from '@/components/theme/Themed';
import Colors from '@/constants/Colors';

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
        gap: 24,
        paddingHorizontal: 16,
        paddingVertical: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors(theme).border,
    },
});

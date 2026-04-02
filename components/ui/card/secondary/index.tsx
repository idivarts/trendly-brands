import { Theme, useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { View } from '@/components/theme/Themed';
import Colors from '@/shared-uis/constants/Colors';

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
        backgroundColor: Colors(theme).card,
        gap: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
});

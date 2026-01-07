import React from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/theme/Themed';
import Colors from '@/constants/Colors';
import { Theme, useTheme } from '@react-navigation/native';

type CardHeaderProps = {
    title: string;
    description?: string;
};

export const CardHeader = ({
    title,
    description
}: CardHeaderProps) => {
    const theme = useTheme();
    const styles = stylesFn(theme);

    return (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
        </View>
    );
};

const stylesFn = (theme: Theme) => StyleSheet.create({
    header: {
        backgroundColor: Colors(theme).transparent,
        gap: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
});

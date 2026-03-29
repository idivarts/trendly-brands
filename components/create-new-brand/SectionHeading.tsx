import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

export interface SectionHeadingProps {
    stepNumber: number;
    title: string;
    /** When true, use smaller bottom margin (mb-2 = 8). Default false (mb-6 = 24). */
    tight?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
    stepNumber,
    title,
    tight = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(
        () => createStyles(colors, tight),
        [colors, tight]
    );

    return (
        <View style={styles.row}>
            <View style={styles.circle}>
                <Text style={styles.circleText}>{stepNumber}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, tight: boolean) {
    return StyleSheet.create({
        row: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: tight ? 8 : 24,
            gap: 8,
        },
        circle: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
        },
        circleText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        title: {
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
        },
    });
}

export default SectionHeading;

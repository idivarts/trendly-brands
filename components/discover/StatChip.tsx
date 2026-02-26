import React, { useMemo } from "react";
import { ColorValue, StyleSheet, Text } from "react-native";
import { Chip } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import Colors from "@/shared-uis/constants/Colors";

const formatNumber = (n: number | string | undefined) => {
    if (n == null) return "-";
    if (typeof n === "string") return n;
    if (Number.isNaN(n)) return "-";
    if (n < 100) return String(n.toFixed(2));
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${Math.round(n / 100) / 10}k`;
    if (n < 1_000_000_000) return `${Math.round(n / 100_000) / 10}M`;
    return `${Math.round(n / 100_000_000) / 10}B`;
};

export const StatChip = ({
    label,
    value,
    textColor,
}: {
    label: string;
    value?: number | string;
    textColor?: ColorValue | null;
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const resolvedTextColor: ColorValue | undefined = textColor ?? undefined;

    return (
        <Chip
            mode="flat"
            compact
            style={styles.chip}
        >
            <Text style={[styles.valueText, resolvedTextColor != null && { color: resolvedTextColor }]}>
                {formatNumber(value)}
            </Text>
            <Text style={[styles.labelText, resolvedTextColor != null && { color: resolvedTextColor }]}>
                {label}
            </Text>
        </Chip>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        chip: {
            marginRight: 6,
            marginBottom: 6,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1,
            flexDirection: "column",
        },
        valueText: {
            fontWeight: "600",
            color: colors.text,
        },
        labelText: {
            color: colors.text,
        },
    });
}

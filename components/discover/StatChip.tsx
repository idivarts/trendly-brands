import React from "react";
import { Text } from "react-native";
import { Chip } from "react-native-paper";

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
}: {
    label: string;
    value?: number | string;
}) => (
    <Chip
        mode="flat"
        compact
        style={{
            marginRight: 6,
            marginBottom: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1,
            flexDirection: "column",
        }}
    >
        <Text style={{ fontWeight: "600" }}>
            {formatNumber(value)}
        </Text>
        <Text> {label}</Text>
    </Chip>
);

import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

/**
 * MiniLineChart — a self-measuring area+line sparkline built on react-native-svg.
 * No external chart dependency; renders identically on iOS / Android / web.
 */
export const MiniLineChart = ({
    values,
    color,
    height = 140,
}: {
    values: number[];
    color: string;
    height?: number;
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [width, setWidth] = useState(0);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

    const paths = useMemo(() => {
        if (width <= 0 || values.length === 0) return null;
        const pad = 6;
        const innerW = Math.max(width - pad * 2, 1);
        const innerH = Math.max(height - pad * 2, 1);
        const max = Math.max(...values, 1);
        const min = Math.min(...values, 0);
        const span = max - min || 1;
        const stepX = values.length > 1 ? innerW / (values.length - 1) : 0;

        const pts = values.map((v, i) => {
            const x = pad + (values.length > 1 ? i * stepX : innerW / 2);
            const y = pad + innerH - ((v - min) / span) * innerH;
            return { x, y };
        });

        const line = pts
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
            .join(" ");
        const area = `${line} L ${(pad + innerW).toFixed(1)} ${(pad + innerH).toFixed(1)} L ${pad.toFixed(1)} ${(pad + innerH).toFixed(1)} Z`;
        return { line, area };
    }, [width, values, height]);

    const gradId = "lineGrad";

    return (
        <View onLayout={onLayout} style={[styles.chartBox, { height }]}>
            {paths && (
                <Svg width={width} height={height}>
                    <Defs>
                        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={color} stopOpacity={0.22} />
                            <Stop offset="1" stopColor={color} stopOpacity={0.01} />
                        </LinearGradient>
                    </Defs>
                    <Path d={paths.area} fill={`url(#${gradId})`} />
                    <Path
                        d={paths.line}
                        fill="none"
                        stroke={color}
                        strokeWidth={2.5}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                </Svg>
            )}
        </View>
    );
};

/**
 * BarList — a horizontal proportional bar list for demographic breakdowns.
 * Uses Views (no border separators) for clean theming.
 */
export const BarList = ({
    entries,
    color,
    maxRows = 6,
}: {
    entries: { label: string; value: number }[];
    color: string;
    maxRows?: number;
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const rows = entries.slice(0, maxRows);
    const max = Math.max(...rows.map((r) => r.value), 1);

    return (
        <View style={styles.barList}>
            {rows.map((r) => (
                <View key={r.label} style={styles.barRow}>
                    <Text style={styles.barLabel} numberOfLines={1}>
                        {r.label}
                    </Text>
                    <View style={styles.barTrack}>
                        <View
                            style={[
                                styles.barFill,
                                { width: `${Math.max((r.value / max) * 100, 2)}%`, backgroundColor: color },
                            ]}
                        />
                    </View>
                    <Text style={styles.barValue}>{formatCompact(r.value)}</Text>
                </View>
            ))}
        </View>
    );
};

/** formatCompact renders large numbers as 1.2K / 3.4M. */
export const formatCompact = (n: number): string => {
    if (n === null || n === undefined || isNaN(n)) return "0";
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return `${n}`;
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        chartBox: {
            width: "100%",
        },
        barList: {
            gap: 10,
        },
        barRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        barLabel: {
            width: 72,
            color: colors.subtitleGray,
            fontSize: 12,
        },
        barTrack: {
            flex: 1,
            height: 10,
            borderRadius: 999,
            backgroundColor: colors.tag,
            overflow: "hidden",
        },
        barFill: {
            height: 10,
            borderRadius: 999,
        },
        barValue: {
            width: 48,
            textAlign: "right",
            color: colors.text,
            fontSize: 12,
            fontWeight: "700",
        },
    });
}

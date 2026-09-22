import { Platform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import {
    PlatformFieldDef,
    variationSpecForPlatform,
} from "@/shared-libs/firestore/trendly-pro/constants/platform-fields";
import { IPlatformOptions } from "@/shared-libs/firestore/trendly-pro/models/contents";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface OptionRow {
    label: string;
    value: string;
    /** Multi-line values (thread / first comment) render in a block. */
    block?: boolean;
}

/** Format one registry field's stored value for read-only display, or null to skip. */
function formatValue(field: PlatformFieldDef, raw: unknown): string | null {
    if (raw === undefined || raw === null || raw === "") return null;
    switch (field.type) {
        case "toggle":
            // Only surface enabled toggles — an unchecked toggle is just noise.
            return raw ? "Yes" : null;
        case "select":
            return field.options?.find((o) => o.value === raw)?.label ?? String(raw);
        case "thread":
            return Array.isArray(raw) ? (raw.length ? raw.join("\n\n") : null) : String(raw);
        case "tags":
            return Array.isArray(raw) ? (raw.length ? raw.join(", ") : null) : String(raw);
        default:
            return String(raw);
    }
}

/**
 * Build the visible option rows for a platform from its stored {@link IPlatformOptions}.
 * Only fields with a value are returned, in the registry's display order.
 */
export function getPlatformOptionRows(
    platform: Platform,
    options?: IPlatformOptions
): OptionRow[] {
    if (!options) return [];
    const spec = variationSpecForPlatform(platform);
    if (!spec) return [];
    const rows: OptionRow[] = [];
    for (const field of spec.fields) {
        const value = formatValue(field, (options as Record<string, unknown>)[field.key]);
        if (value != null) {
            rows.push({
                label: field.label,
                value,
                block: field.type === "thread" || field.type === "textarea",
            });
        }
    }
    return rows;
}

/** Read-only list of platform-specific publishing options. Renders nothing when empty. */
const PublicPlatformOptions: React.FC<{ rows: OptionRow[] }> = ({ rows }) => {
    const colors = Colors(useTheme());
    const styles = useStyles(colors);
    if (!rows.length) return null;

    return (
        <View style={styles.wrap}>
            {rows.map((row, i) =>
                row.block ? (
                    <View key={`${row.label}-${i}`} style={styles.blockRow}>
                        <Text style={styles.label}>{row.label}</Text>
                        <Text style={styles.blockValue}>{row.value}</Text>
                    </View>
                ) : (
                    <View key={`${row.label}-${i}`} style={styles.row}>
                        <Text style={styles.label}>{row.label}</Text>
                        <Text style={styles.value}>{row.value}</Text>
                    </View>
                )
            )}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrap: {
            gap: 10,
            marginTop: 4,
        },
        row: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
        },
        blockRow: {
            gap: 4,
        },
        label: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
            width: 120,
        },
        value: {
            flex: 1,
            fontSize: 14,
            lineHeight: 20,
            color: colors.text,
        },
        blockValue: {
            fontSize: 14,
            lineHeight: 21,
            color: colors.text,
        },
    });
}

export default PublicPlatformOptions;

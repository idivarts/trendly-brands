import { ExplainerConfig } from "@/contexts/growthbook-context-provider";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    View
} from "react-native";

/**
 * Reusable explainer section that conditionally renders pieces based on the provided config.
 * - Honors `{...}` focus syntax in title.
 * - Hides description and items on narrow layouts to match current page behavior.
 */
export function ExplainerDynamic({
    config,
    viewBelowItems,
    viewAtBottom
}: {
    config: ExplainerConfig;
    viewBelowItems?: any;
    viewAtBottom?: any;
}) {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const { kicker, title, description, items, image } = config || {} as ExplainerConfig;

    const renderTitle = (t?: string) => {
        if (!t) return null;
        const match = t.match(/\{([^}]+)\}/);
        if (!match) {
            return <Text style={styles.title}>{t}</Text>;
        }
        const focused = match[1];
        const parts = t.split(match[0]);
        const before = parts[0] || "";
        const after = parts[1] || "";
        return (
            <Text style={styles.title}>
                {before}
                <Text style={styles.titleAccent}>{focused}</Text>
                {after}
            </Text>
        );
    };

    return (
        <View>
            {!!kicker &&
                <Text style={styles.kicker}>{kicker}</Text>}
            {/* Title */}
            {renderTitle(title)}

            {/* Description (wide only) */}
            {!!description && (
                <Text style={styles.subtitle}>{description}</Text>
            )}

            {/* Items list (wide only) */}
            {Array.isArray(items) && items.length > 0 && (
                <View style={styles.points}>
                    {items.map((pt, idx) => (
                        <View style={styles.pointItem} key={idx}>
                            <Text style={styles.pointIcon}>✅</Text>
                            <Text style={styles.pointText}>{pt}</Text>
                        </View>
                    ))}
                </View>
            )}
            {viewBelowItems}

            {/* Visual (if image provided) */}
            {!!image && (
                <ImageBackground
                    source={{ uri: image }}
                    style={styles.visual}
                    imageStyle={styles.visualImg}
                >
                    <View style={styles.playBadge}>
                        <Text style={styles.playBadgeText}>Overview</Text>
                    </View>
                </ImageBackground>
            )}
            {viewAtBottom}
        </View>
    );
}

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
    page: {
        paddingHorizontal: 24,
        paddingTop: Platform.select({ web: 36, default: 24 }),
        paddingBottom: 48,
        backgroundColor: colors.background,
        maxWidth: 1300,
        alignSelf: "center",
        width: "100%",
    },
    hero: {
        borderRadius: 24,
        marginTop: 0,
    },
    heroRow: {
        backgroundColor: colors.surface || colors.card,
        padding: 28,
        flexDirection: "row",
        alignItems: "center",
    },
    heroCol: {
        flexDirection: "column",
    },
    left: {
        flex: 1.3,
        alignSelf: "flex-start"
    },
    kicker: {
        color: colors.secondary,
        fontSize: 12,
        letterSpacing: 1.4,
        fontWeight: "700",
        marginBottom: 8,
    },
    title: {
        color: colors.text,
        fontSize: 48,
        lineHeight: 62,
        fontWeight: "600",
        marginTop: 4,
    },
    titleAccent: {
        color: colors.primary,
        textDecorationLine: "underline",
        textDecorationColor: colors.tag,
        textDecorationStyle: "solid",
    },
    subtitle: {
        marginTop: 18,
        marginBottom: 14,
        color: colors.textSecondary,
        fontSize: 16,
        lineHeight: 24,
        maxWidth: 640,
    },
    points: { marginTop: 8, gap: 10, marginBottom: 16 },
    pointItem: { flexDirection: "row", alignItems: "center" },
    pointIcon: { fontSize: 18, marginRight: 10 },
    pointText: { color: colors.text, fontSize: 14 },
    visual: {
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: 20,
        overflow: "hidden",
        justifyContent: "flex-end",
        marginTop: 18,
        backgroundColor: colors.surface || colors.card,
        shadowColor: colors.text,
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    visualImg: { resizeMode: "cover" },
    playBadge: {
        alignSelf: "flex-start",
        margin: 12,
        backgroundColor: colors.card,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    playBadgeText: { color: colors.primaryDark || colors.primary, fontWeight: "800" },
    formCard: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 16,
        paddingVertical: 22,
        paddingHorizontal: 22,
        marginTop: 18,
        ...Platform.select({ web: { maxWidth: 520 } }),
        shadowColor: colors.text,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        ...Platform.select({ android: { elevation: 4 } }),
    },
    formHeading: { fontSize: 24, fontWeight: "800", color: colors.text },
    formSub: { marginTop: 6, color: colors.textSecondary, fontSize: 13 },
    field: { marginTop: 16 },
    label: { color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: 6 },
    input: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        backgroundColor: colors.card,
        color: colors.text,
    },
    inputError: { borderColor: colors.red },
    error: { color: colors.red, marginTop: 6, fontSize: 12 },
    disclaimer: { color: colors.textSecondary, marginTop: 12, fontSize: 12 },
    cta: {
        marginTop: 18,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 22,
        height: 48,
        borderRadius: 999,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    ctaText: {
        color: colors.onPrimary,
        fontSize: 16,
        fontWeight: "700",
    },
    ctaArrow: {
        color: colors.onPrimary,
        fontSize: 22,
        marginLeft: 10,
        marginTop: -2,
    },
    cardGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
    },
    ageHelp: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    ageCard: {
        flexBasis: "48%",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        minHeight: 80,
    },
    ageCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.surface || colors.card,
        shadowColor: colors.primary,
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        ...Platform.select({ android: { elevation: 3 } }),
    },
    ageCardTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
    ageCardDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    });
}

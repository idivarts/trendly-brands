import { ExplainerConfig } from "@/contexts/growthbook-context-provider";
import React from "react";
import {
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    View
} from "react-native";
import { BLUE, BLUE_DARK, BLUE_LIGHT, TEXT } from "./const";



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

const styles = StyleSheet.create({
    page: {
        paddingHorizontal: 24,
        paddingTop: Platform.select({ web: 36, default: 24 }),
        paddingBottom: 48,
        backgroundColor: "#FFFFFF",
        maxWidth: 1300,
        alignSelf: "center",
        width: "100%",
    },

    /* Hero layout */
    hero: {
        borderRadius: 24,
        marginTop: 0,
    },
    heroRow: {
        backgroundColor: "#F8FBFF",
        padding: 28,
        flexDirection: "row",
        alignItems: "center",
    },
    heroCol: {
        flexDirection: "column",
    },

    /* Left */
    left: {
        flex: 1.3,
        alignSelf: "flex-start"
    },
    kicker: {
        color: BLUE_LIGHT,
        fontSize: 12,
        letterSpacing: 1.4,
        fontWeight: "700",
        marginBottom: 8,
    },
    title: {
        color: TEXT,
        fontSize: 48,
        lineHeight: 62,
        fontWeight: "600",
        marginTop: 4,
    },
    titleAccent: {
        color: BLUE,
        textDecorationLine: "underline",
        textDecorationColor: "#CFE2F7",
        textDecorationStyle: "solid",
    },
    subtitle: {
        marginTop: 18,
        marginBottom: 14,
        color: "#53657A",
        fontSize: 16,
        lineHeight: 24,
        maxWidth: 640,
    },
    points: { marginTop: 8, gap: 10, marginBottom: 16 },
    pointItem: { flexDirection: "row", alignItems: "center" },
    pointIcon: { fontSize: 18, marginRight: 10 },
    pointText: { color: TEXT, fontSize: 14 },

    /* Visual under explainer */
    visual: {
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: 20,
        overflow: "hidden",
        justifyContent: "flex-end",
        marginTop: 18,
        backgroundColor: "#E7F0F9",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    visualImg: { resizeMode: "cover" },
    playBadge: {
        alignSelf: "flex-start",
        margin: 12,
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    playBadgeText: { color: BLUE_DARK, fontWeight: "800" },

    /* Form */
    formCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 22,
        paddingHorizontal: 22,
        marginTop: 18,
        ...Platform.select({ web: { maxWidth: 520 } }),
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        ...Platform.select({ android: { elevation: 4 } }),
    },
    formHeading: { fontSize: 24, fontWeight: "800", color: TEXT },
    formSub: { marginTop: 6, color: "#6C7A89", fontSize: 13 },
    field: { marginTop: 16 },
    label: { color: TEXT, fontSize: 13, fontWeight: "700", marginBottom: 6 },
    input: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E1E6EE",
        paddingHorizontal: 14,
        backgroundColor: "#FAFCFF",
        color: TEXT,
    },
    inputError: { borderColor: "#E87070" },
    error: { color: "#D64545", marginTop: 6, fontSize: 12 },
    disclaimer: { color: "#6C7A89", marginTop: 12, fontSize: 12 },

    /* CTA reused */
    cta: {
        marginTop: 18,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 22,
        height: 48,
        borderRadius: 999,
        backgroundColor: BLUE,
        shadowColor: "#2B5C8F",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    ctaText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    ctaArrow: {
        color: "#FFFFFF",
        fontSize: 22,
        marginLeft: 10,
        marginTop: -2,
    },

    // Age select cards
    cardGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
    },
    ageHelp: { color: "#6C7A89", fontSize: 12, marginTop: 2 },
    ageCard: {
        flexBasis: "48%",
        borderWidth: 1,
        borderColor: "#E1E6EE",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 12,
        minHeight: 80,
    },
    ageCardSelected: {
        borderColor: BLUE,
        backgroundColor: "#F0F6FF",
        shadowColor: "#2B5C8F",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        ...Platform.select({ android: { elevation: 3 } }),
    },
    ageCardTitle: { fontSize: 14, fontWeight: "800", color: TEXT },
    ageCardDesc: { fontSize: 12, color: "#6C7A89", marginTop: 4 },

});

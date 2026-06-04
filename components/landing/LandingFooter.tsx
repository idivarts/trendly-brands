import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

const FEATURE_ITEMS = [
    { icon: "🗓️", title: "Plan & Schedule", sub: "Organize your brand's content in one shared calendar" },
    { icon: "✏️", title: "Create & Manage", sub: "Produce, review, and publish content end to end" },
    { icon: "🤝", title: "Creators On Demand", sub: "Bring in vetted creators whenever you need extra hands" },
    { icon: "💰", title: "Zero Commission", sub: "Keep 100% of your budget — no middlemen" },
];

const LandingFooter = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 1000;
    const styles = useMemo(() => makeStyles(colors), [colors]);

    return (
        <View style={styles.featuresBar}>
            <View style={[styles.featuresInner, !isWide && styles.featuresInnerNarrow]}>
                {FEATURE_ITEMS.map((f, idx) => (
                    <View key={idx} style={styles.featureItem}>
                        <Text style={styles.featureIcon}>{f.icon}</Text>
                        <View style={styles.featureTextWrap}>
                            <Text style={styles.featureTitle}>{f.title}</Text>
                            <Text style={styles.featureSub}>{f.sub}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        featuresBar: {
            marginTop: 40,
            backgroundColor: colors.primaryDark || colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 32,
        },
        featuresInner: {
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "stretch",
            gap: 12,
        },
        featuresInnerNarrow: {
            flexDirection: "column",
            gap: 32,
        },
        featureItem: {
            flexDirection: "row",
            alignItems: "flex-start",
            flex: 1,
            paddingVertical: 6,
            minWidth: 150,
            flexShrink: 0,
        },
        featureIcon: {
            fontSize: 42,
            marginRight: 16,
            color: colors.onPrimary,
        },
        featureTextWrap: {
            flexShrink: 1,
            gap: 8,
        },
        featureTitle: {
            color: colors.onPrimary,
            fontSize: 14,
            fontWeight: "800",
            letterSpacing: 0.2,
        },
        featureSub: {
            color: colors.secondary,
            fontSize: 12,
            marginTop: 2,
        },
    });
}

export default LandingFooter;

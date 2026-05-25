import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const METRICS = [
    {
        icon: "👁️",
        label: "Views",
        desc: "Track how many people are actually seeing your content — real reach across every platform and creator.",
    },
    {
        icon: "💬",
        label: "Engagement",
        desc: "Likes, comments, shares, saves. We break down what's resonating with your audience and what's falling flat.",
    },
    {
        icon: "🛒",
        label: "Purchase & Conversion",
        desc: "Connect content performance to actual sales — know which influencer drove product, not just views.",
    },
];

const PROCESS_POINTS = [
    "Track every piece of influencer content weekly",
    "Identify which creators, formats, and niches convert best",
    "Flag underperforming campaigns before they drain budget",
    "Recommend changes based on data — not gut feel",
];

const AnalyticsScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 900;
    const styles = useMemo(() => makeStyles(colors, isWide), [colors, isWide]);

    const openCal = () => router.push("/hire-us");

    return (
        <AppLayout>
            <PageHeader title="Reporting & Analytics" />
            <ScrollView
                contentContainerStyle={styles.page}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.kicker}>REPORTING & ANALYTICS</Text>
                    <Text style={styles.headline}>
                        Great content means nothing{"\n"}if you can't{" "}
                        <Text style={styles.headlineAccent}>measure it</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Creating content is step one. The brands that win analyze what worked,
                        fix what didn't, and double down on what drives results. We give you
                        that clarity every week.
                    </Text>
                    <Pressable
                        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                        onPress={openCal}
                    >
                        <Text style={styles.ctaText}>Hire Us for Reporting  ›</Text>
                    </Pressable>
                </View>

                {/* Pain point */}
                <View style={styles.section}>
                    <Text style={styles.sectionKicker}>THE PROBLEM</Text>
                    <Text style={styles.sectionTitle}>Content without analytics is just noise</Text>
                    <Text style={styles.sectionBody}>
                        Most brands post content and hope for the best. Without reporting,
                        you have no idea which influencer drove sales, which content style
                        underperformed, or where your budget is actually going. That's not
                        a strategy — that's gambling.
                    </Text>
                </View>

                {/* Metrics */}
                <View style={styles.section}>
                    <Text style={styles.sectionKicker}>WHAT WE TRACK</Text>
                    <Text style={styles.sectionTitle}>Weekly reports that drive real decisions</Text>
                    <View style={[styles.metricsRow, isWide && styles.metricsRowWide]}>
                        {METRICS.map((m) => (
                            <View key={m.label} style={[styles.metricCard, isWide && styles.metricCardWide]}>
                                <Text style={styles.metricIcon}>{m.icon}</Text>
                                <Text style={styles.metricLabel}>{m.label}</Text>
                                <Text style={styles.metricDesc}>{m.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Process */}
                <View style={styles.darkCard}>
                    <Text style={[styles.sectionKicker, { color: colors.primaryMid }]}>OUR PROCESS</Text>
                    <Text style={styles.darkCardTitle}>
                        We don't just hand you numbers. We tell you what to do with them.
                    </Text>
                    {PROCESS_POINTS.map((point) => (
                        <View key={point} style={styles.checkRow}>
                            <Text style={styles.checkIcon}>✓</Text>
                            <Text style={styles.checkText}>{point}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </AppLayout>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>, isWide: boolean) {
    const maxWidth = isWide ? 860 : undefined;
    return StyleSheet.create({
        page: {
            paddingHorizontal: isWide ? 32 : 16,
            paddingTop: 16,
            paddingBottom: 48,
            ...(maxWidth ? { maxWidth, alignSelf: "center" as const, width: "100%" } : {}),
        },
        hero: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: isWide ? 32 : 20,
            marginBottom: 28,
            shadowColor: colors.black,
            shadowOpacity: 0.07,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            ...Platform.select({ android: { elevation: 3 } }),
        },
        kicker: {
            color: colors.primaryMid,
            fontSize: 11,
            letterSpacing: 1.4,
            fontWeight: "700",
            marginBottom: 8,
        },
        headline: {
            color: colors.text,
            fontSize: isWide ? 28 : 22,
            lineHeight: isWide ? 38 : 30,
            fontWeight: "800",
        },
        headlineAccent: {
            color: colors.primary,
        },
        subtitle: {
            marginTop: 10,
            color: colors.subtitleGray,
            fontSize: 14,
            lineHeight: 22,
        },
        cta: {
            marginTop: 18,
            alignSelf: "flex-start",
            paddingHorizontal: 20,
            paddingVertical: 11,
            borderRadius: 999,
            backgroundColor: colors.primary,
            shadowColor: colors.primaryShadow,
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            ...Platform.select({ android: { elevation: 4 } }),
        },
        ctaPressed: { transform: [{ scale: 0.97 }] },
        ctaText: {
            color: colors.onPrimary,
            fontSize: 14,
            fontWeight: "700",
        },
        section: {
            marginBottom: 24,
        },
        sectionKicker: {
            color: colors.primaryMid,
            fontSize: 10,
            letterSpacing: 1.4,
            fontWeight: "700",
            marginBottom: 6,
        },
        sectionTitle: {
            color: colors.text,
            fontSize: isWide ? 20 : 17,
            fontWeight: "800",
            marginBottom: 8,
            lineHeight: isWide ? 28 : 24,
        },
        sectionBody: {
            color: colors.subtitleGray,
            fontSize: 14,
            lineHeight: 22,
        },
        metricsRow: {
            flexDirection: "column",
            gap: 12,
            marginTop: 12,
        },
        metricsRowWide: {
            flexDirection: "row",
        },
        metricCard: {
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            shadowColor: colors.black,
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            ...Platform.select({ android: { elevation: 2 } }),
        },
        metricCardWide: {
            flex: 1,
        },
        metricIcon: {
            fontSize: 24,
            marginBottom: 8,
        },
        metricLabel: {
            color: colors.text,
            fontSize: 14,
            fontWeight: "800",
            marginBottom: 4,
        },
        metricDesc: {
            color: colors.subtitleGray,
            fontSize: 13,
            lineHeight: 19,
        },
        darkCard: {
            backgroundColor: colors.primaryDark,
            borderRadius: 16,
            padding: isWide ? 28 : 20,
            marginBottom: 24,
        },
        darkCardTitle: {
            color: colors.white,
            fontSize: isWide ? 18 : 16,
            fontWeight: "800",
            marginBottom: 14,
            lineHeight: isWide ? 26 : 23,
        },
        checkRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            marginTop: 8,
        },
        checkIcon: {
            color: colors.primaryMid,
            fontSize: 13,
            fontWeight: "800",
            marginRight: 10,
            marginTop: 2,
        },
        checkText: {
            color: colors.white,
            fontSize: 13,
            lineHeight: 20,
            flex: 1,
        },
        ctaSection: {
            alignItems: "center",
            paddingVertical: isWide ? 24 : 16,
        },
        ctaTitle: {
            color: colors.text,
            fontSize: isWide ? 20 : 17,
            fontWeight: "800",
            textAlign: "center",
        },
        ctaSubtitle: {
            color: colors.subtitleGray,
            fontSize: 13,
            textAlign: "center",
            marginTop: 8,
            marginBottom: 4,
        },
    });
}

export default AnalyticsScreen;

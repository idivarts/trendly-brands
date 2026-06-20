import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const POINTS = [
    "Access to thousands of vetted micro-creators in your region",
    "We shortlist the best-fit creators for your brand and budget",
    "Hand-picked profiles delivered straight to you — no endless scrolling",
    "Local language, local audiences, local trust",
];

/**
 * Shown on the Discover route for non-India brands instead of the in-app
 * influencer discovery grid (which is currently India-only). Advertises our
 * managed sourcing service and routes the CTA to the Hire Us page.
 */
const NonIndiaDiscoverLanding = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 900;
    const styles = useMemo(() => makeStyles(colors, isWide), [colors, isWide]);

    const openHireUs = () => router.push("/hire-us");

    return (
        <AppLayout>
            <PageHeader title="Discover Influencers" />
            <ScrollView
                contentContainerStyle={styles.page}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.kicker}>CREATORS IN YOUR LOCALITY</Text>
                    <Text style={styles.headline}>
                        We've got{" "}
                        <Text style={styles.headlineAccent}>thousands of creators</Text>{" "}
                        in your area
                    </Text>
                    <Text style={styles.subtitle}>
                        We have access to a deep network of micro-creators in your locality.
                        Tell us what you're looking for and we'll shortlist the best-fit
                        creators and send them straight over to you.
                    </Text>
                    <Pressable
                        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                        onPress={openHireUs}
                    >
                        <Text style={styles.ctaText}>Hire Us to Shortlist Creators  ›</Text>
                    </Pressable>
                </View>

                {/* How it works */}
                <View style={styles.section}>
                    <Text style={styles.sectionKicker}>HOW IT WORKS</Text>
                    <Text style={styles.sectionTitle}>Tell us your brief, we do the legwork</Text>
                    <Text style={styles.sectionBody}>
                        Share your campaign goals, target audience, and budget. Our team taps
                        into our local creator network to find profiles that genuinely fit your
                        brand.{"\n\n"}
                        You get a curated shortlist of creators ready to collaborate — no hours
                        spent searching, filtering, or vetting on your own.
                    </Text>
                </View>

                {/* Dark card with points */}
                <View style={styles.darkCard}>
                    <Text style={[styles.sectionKicker, { color: colors.primaryMid }]}>WHY IT WORKS</Text>
                    <Text style={styles.darkCardTitle}>
                        Local creators, hand-picked for you — without the manual search.
                    </Text>
                    {POINTS.map((pt) => (
                        <View key={pt} style={styles.pointRow}>
                            <View style={styles.pointDot} />
                            <Text style={styles.pointText}>{pt}</Text>
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
        pointRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            marginTop: 8,
        },
        pointDot: {
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: colors.primaryMid,
            marginTop: 8,
            marginRight: 10,
        },
        pointText: {
            color: colors.white,
            fontSize: 13,
            lineHeight: 20,
            flex: 1,
        },
    });
}

export default NonIndiaDiscoverLanding;

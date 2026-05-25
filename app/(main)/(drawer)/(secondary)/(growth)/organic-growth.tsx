import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const POINTS = [
    "Boost post engagement via comment interactions",
    "Auto-send product links to interested buyers via DM",
    "Enable re-targeting from website visits",
    "Capture impulse purchase intent before it fades",
];

const OrganicGrowthScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 900;
    const styles = useMemo(() => makeStyles(colors, isWide), [colors, isWide]);

    const openCal = () => router.push("/hire-us");

    return (
        <AppLayout>
            <PageHeader title="Organic Conversions" />
            <ScrollView
                contentContainerStyle={styles.page}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.kicker}>ORGANIC REACH</Text>
                    <Text style={styles.headline}>
                        Turn Viewers into Buyers —{" "}
                        <Text style={styles.headlineAccent}>Instantly</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Most people who watch your content won't go hunting for your product.
                        The moment passes, the impulse fades, and you lose the sale. We fix that.
                    </Text>
                    <Pressable
                        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                        onPress={openCal}
                    >
                        <Text style={styles.ctaText}>Hire Us for Growth  ›</Text>
                    </Pressable>
                </View>

                {/* How it works */}
                <View style={styles.section}>
                    <Text style={styles.sectionKicker}>HOW IT WORKS</Text>
                    <Text style={styles.sectionTitle}>The comment-to-DM impulse buy flow</Text>
                    <Text style={styles.sectionBody}>
                        When a viewer comments "Link" on your post, they automatically receive
                        your product link in their DMs — instantly. No waiting, no searching,
                        no losing the moment.{"\n\n"}
                        This does two things: it drives comments (which boosts your post's reach
                        on the algorithm) and puts your product link in front of your most
                        interested buyers at exactly the right time.
                    </Text>
                </View>

                {/* Dark card with points */}
                <View style={styles.darkCard}>
                    <Text style={[styles.sectionKicker, { color: colors.primaryMid }]}>WHY IT WORKS</Text>
                    <Text style={styles.darkCardTitle}>
                        Get the product link in front of buyers before the impulse disappears.
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

export default OrganicGrowthScreen;

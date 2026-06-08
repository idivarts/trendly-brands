import { useDiscovery } from "@/components/discover/discovery-context";
import { useOrganizationContext } from "@/contexts/organization-context.provider";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Avatar, Button, Card } from "react-native-paper";

export default function EmptyTrendlyInternalSelected() {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const router = useMyNavigation();
    const { selectedOrgBilling } = useOrganizationContext();
    const { selectedDb, setShowFilters } = useDiscovery();

    const gradientColors = [colors.surface || colors.tag, colors.tag || colors.card];

    return (
        <View style={styles.container}>
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <Text style={styles.bannerTitle}>Trendly Pro</Text>
                <Text style={styles.bannerSubtitle}>Built for lean teams that move fast</Text>
            </LinearGradient>

            <Card style={styles.card}>
                <Card.Content>
                    <Avatar.Icon icon="star" size={36} style={styles.avatar} />
                    <Text style={styles.title}>Micro‑Influencer Discovery for Startups</Text>
                    <Text style={styles.stat}>30,000+ active Indian micro‑influencers (under 100k followers)</Text>
                    <Text style={styles.detail}>
                        • Only <Text style={styles.bold}>₹1,500/month</Text> – designed for early‑stage brands
                    </Text>
                    <Text style={styles.detail}>• Barter and paid collaborations supported</Text>
                    <Text style={styles.detail}>• Clean, India‑first results. Zero global noise</Text>
                    <Text style={styles.detail}>• Built‑in lead capture, shortlists, and campaign boards</Text>
                    <Text style={styles.detail}>• Priority support for founders: fast onboarding, faster results</Text>
                    <Text style={styles.testimonial}>"We found our first 100 true fans with Trendly Pro."</Text>
                    {["pro", "enterprise"].includes(selectedOrgBilling?.planKey || "") ? (
                        <Button
                            mode="contained"
                            style={styles.button}
                            buttonColor={colors.primary}
                            onPress={() => {
                                if (selectedDb !== "") setShowFilters(true);
                            }}
                        >
                            Open Trendly's Database
                        </Button>
                    ) : (
                        <Button
                            mode="contained"
                            style={styles.button}
                            buttonColor={colors.primary}
                            onPress={() => router.push("/billing")}
                        >
                            Unlock All Micro‑Influencers with Pro
                        </Button>
                    )}
                </Card.Content>
            </Card>
        </View>
    );
}

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: { padding: 36, flex: 1, backgroundColor: colors.background, justifyContent: "center" },
        banner: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12 },
        bannerTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", color: colors.text },
        bannerSubtitle: { textAlign: "center", color: colors.primary, marginTop: 4 },
        card: { elevation: 4, borderRadius: 12, paddingBottom: 6, backgroundColor: colors.card },
        title: { fontSize: 20, marginVertical: 8, textAlign: "center", color: colors.text },
        stat: { fontSize: 17, fontWeight: "bold", color: colors.primary, marginVertical: 8, textAlign: "center", lineHeight: 22 },
        detail: { fontSize: 15, marginVertical: 2, textAlign: "center", lineHeight: 22, color: colors.text },
        bold: { fontWeight: "bold" },
        testimonial: { fontStyle: "italic", color: colors.textSecondary, marginVertical: 16, textAlign: "center" },
        avatar: { backgroundColor: colors.gold, alignSelf: "center", marginBottom: 12 },
        button: { marginTop: 14, maxWidth: 400, alignSelf: "center" },
    });
}

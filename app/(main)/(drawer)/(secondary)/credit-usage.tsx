import ScreenHeader from "@/components/ui/screen-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { IS_MONETIZATION_DONE } from "@/shared-constants/app";
import { faBolt, faGem, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const CreditProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(
        () => createProgressBarStyles(theme, colors),
        [theme, colors]
    );
    const fillStyle = useMemo(
        () => ({ width: `${progress * 100}%` }),
        [progress]
    );
    return (
        <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, fillStyle]} />
            </View>
            <Text style={styles.progressLabel}>
                {Math.round(progress * 100)}% of monthly limit
            </Text>
        </View>
    );
};

const CreditUsageScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const { selectedBrand } = useBrandContext();

    const influencerCredits =
        selectedBrand?.credits?.influencer ??
        (IS_MONETIZATION_DONE ? 0 : 1000);
    const discoverCoinsLeft = Number(selectedBrand?.credits?.discovery ?? 0);
    const connectionCreditsLeft = Number(
        selectedBrand?.credits?.connection ?? 0
    );

    const discoveryLimit = 1000;
    const discoveryProgress = Math.min(1, discoverCoinsLeft / discoveryLimit);

    const styles = useMemo(
        () => createStyles(theme, xl, width),
        [theme, xl, width]
    );

    const creditItems = useMemo(
        () => [
            {
                key: "influencers",
                label: "Influencers Remaining",
                description:
                    "How many influencers you can unlock from the explore influencers page. Limit recharges every month based on your plan.",
                count: influencerCredits,
                icon: faStar,
                iconColor: colors.gold,
                progress: null,
            },
            {
                key: "discovery",
                label: "Discovery Remaining",
                description:
                    "Open deep statistics for any influencer on the discover page. Uses 1 coin each time you open a unique profile. Limit recharges monthly.",
                count: discoverCoinsLeft,
                icon: faGem,
                iconColor: colors.gold,
                progress: discoveryProgress,
            },
            {
                key: "invites",
                label: "Invites Remaining",
                description:
                    "We reach out to the influencer on your behalf and connect you directly. Uses 1 coin whenever you invite any influencer. Limit recharges monthly.",
                count: connectionCreditsLeft,
                icon: faBolt,
                iconColor: colors.drawerInvitesIcon,
                progress: null,
            },
        ],
        [
            influencerCredits,
            discoverCoinsLeft,
            connectionCreditsLeft,
            discoveryProgress,
            colors.gold,
            colors.drawerInvitesIcon,
        ]
    );

    return (
        <AppLayout withWebPadding={false}>
            {!xl && <ScreenHeader title="Credit Usage" />}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Your Credits</Text>
                    <Text style={styles.subtitle}>
                        Track your remaining credits across all features
                    </Text>
                </View>

                <View style={styles.cardsContainer}>
                    {creditItems.map((item) => (
                        <View key={item.key} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconCircle}>
                                    <FontAwesomeIcon
                                        icon={item.icon}
                                        size={22}
                                        color={item.iconColor}
                                    />
                                </View>
                                <View style={styles.cardHeaderText}>
                                    <Text style={styles.cardLabel}>
                                        {item.label}
                                    </Text>
                                    <Text style={styles.cardCount}>
                                        {item.count}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.cardDescription}>
                                {item.description}
                            </Text>
                            {item.progress !== null && (
                                <CreditProgressBar progress={item.progress} />
                            )}
                        </View>
                    ))}
                </View>

                <Pressable
                    onPress={() => router.push("/billing")}
                    style={({ pressed }) => [
                        styles.refillButton,
                        pressed && styles.refillButtonPressed,
                    ]}
                >
                    <FontAwesomeIcon
                        icon={faGem}
                        size={18}
                        color={colors.onPrimary}
                        style={styles.refillIcon}
                    />
                    <Text style={styles.refillButtonText}>Refill Credits</Text>
                </Pressable>
            </ScrollView>
        </AppLayout>
    );
};

const createProgressBarStyles = (
    theme: any,
    colors: ReturnType<typeof Colors>
) =>
    StyleSheet.create({
        progressSection: {
            marginTop: 16,
        },
        progressTrack: {
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.drawerProgressTrack,
            overflow: "hidden",
        },
        progressFill: {
            height: "100%",
            backgroundColor: colors.drawerProgressFill,
            borderRadius: 4,
        },
        progressLabel: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 6,
        },
    });

const createStyles = (theme: any, xl: boolean, bpWidth: number) => {
    const colors = Colors(theme);
    const maxContentWidth = xl ? Math.min(480, bpWidth - 48) : undefined;
    return StyleSheet.create({
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            padding: Platform.OS === "web" ? 24 : 16,
            paddingBottom: 40,
            ...(maxContentWidth && {
                maxWidth: maxContentWidth,
                alignSelf: "center",
                width: "100%",
            }),
        },
        header: {
            marginBottom: 24,
        },
        title: {
            fontSize: 24,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 4,
        },
        subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        cardsContainer: {
            gap: 16,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
        },
        cardHeader: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
        },
        iconCircle: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
            backgroundColor: colors.budgetCardBg,
        },
        cardHeaderText: {
            flex: 1,
        },
        cardLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: 2,
        },
        cardCount: {
            fontSize: 28,
            fontWeight: "700",
            color: colors.text,
        },
        cardDescription: {
            fontSize: 13,
            lineHeight: 20,
            color: colors.textSecondary,
        },
        refillButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginTop: 32,
        },
        refillButtonPressed: {
            opacity: 0.9,
        },
        refillIcon: {
            marginRight: 8,
        },
        refillButtonText: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.onPrimary,
        },
    });
};

export default CreditUsageScreen;

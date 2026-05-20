import { Text, View } from "@/components/theme/Themed";
import CustomDivider from "@/components/CustomDivider";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { Campaign } from "@/types/Campaign";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";

const CURRENCY = "₹";

interface CampaignCardProps {
    campaign: Campaign;
    onPress: () => void;
}

const statusColors = (status: Campaign["status"], colors: ReturnType<typeof Colors>) => {
    switch (status) {
        case "active":
            return { bg: colors.reachCardBg, text: colors.green };
        case "past":
            return { bg: colors.aliceBlue, text: colors.textSecondary };
        default:
            return { bg: colors.tag, text: colors.tagForeground };
    }
};

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onPress }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const statusStyle = statusColors(campaign.status, colors);
    const budget = campaign.estimatedBudget || campaign.totalBudget || 0;

    const monthlyPosts =
        campaign.contentFrequency?.period === "week"
            ? campaign.contentFrequency.count * 4
            : campaign.contentFrequency?.count ?? 0;

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            {/* Status + type row */}
            <View style={styles.topRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Text>
                </View>
                <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>
                        {campaign.campaignType === "retainer" ? "Monthly Retainer" : "One-off"}
                    </Text>
                </View>
            </View>

            {/* Name */}
            <Text style={styles.name} numberOfLines={2}>
                {campaign.name}
            </Text>

            {campaign.description ? (
                <Text style={styles.description} numberOfLines={2}>
                    {campaign.description}
                </Text>
            ) : null}

            {/* Platform chips */}
            {campaign.platforms?.length > 0 && (
                <View style={styles.chipRow}>
                    {campaign.platforms.slice(0, 3).map((p) => (
                        <View key={p} style={styles.chip}>
                            <Text style={styles.chipText}>{p}</Text>
                        </View>
                    ))}
                    {campaign.platforms.length > 3 && (
                        <Text style={styles.moreText}>
                            +{campaign.platforms.length - 3} more
                        </Text>
                    )}
                </View>
            )}

            <CustomDivider thickness={1} />

            {/* Stats row */}
            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>
                        {CURRENCY}
                        {budget.toLocaleString("en-IN")}
                    </Text>
                    <Text style={styles.statLabel}>Budget</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{monthlyPosts}</Text>
                    <Text style={styles.statLabel}>Posts / month</Text>
                </View>
            </View>
        </Pressable>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        card: {
            borderWidth: 2,
            borderColor: colors.primary,
            borderRadius: 14,
            backgroundColor: colors.card,
            padding: 16,
            gap: 10,
            shadowColor: colors.primary,
            shadowOffset: { width: 2, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
        },
        pressed: {
            opacity: 0.85,
        },
        topRow: {
            flexDirection: "row",
            gap: 8,
            backgroundColor: "transparent",
        },
        statusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
        },
        statusText: {
            fontSize: 12,
            fontWeight: "700",
        },
        typeBadge: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: colors.aliceBlue,
        },
        typeText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        name: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        description: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 19,
        },
        chipRow: {
            flexDirection: "row",
            gap: 6,
            flexWrap: "wrap",
            backgroundColor: "transparent",
        },
        chip: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: colors.budgetCardBg,
            borderWidth: 1,
            borderColor: colors.budgetCardBorder,
        },
        chipText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.primary,
        },
        moreText: {
            fontSize: 12,
            color: colors.textSecondary,
            alignSelf: "center",
        },
        statsRow: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
        },
        stat: {
            flex: 1,
            alignItems: "center",
            gap: 2,
            backgroundColor: "transparent",
        },
        statValue: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
        },
        statLabel: {
            fontSize: 11,
            color: colors.textSecondary,
        },
        statDivider: {
            width: 1,
            height: 32,
            backgroundColor: colors.border,
        },
    });

export default CampaignCard;

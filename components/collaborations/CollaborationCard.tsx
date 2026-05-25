import Colors from "@/shared-uis/constants/Colors";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import {
    faCalendarDays,
    faChevronRight,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface CollaborationCardItem {
    id: string;
    name: string;
    description?: string;
    status: string;
    promotionType?: string;
    contentFormat?: string[];
    platform?: string[];
    budget?: { min?: number; max?: number };
    timeStamp?: number;
    applications?: number;
    invitations?: number;
    acceptedApplications?: number;
    version?: number;
}

interface CollaborationCardProps {
    item: CollaborationCardItem;
    onPress: (item: CollaborationCardItem) => void;
}

const STATUS_BG: Record<string, string> = {
    draft: "rgba(139,139,139,0.12)",
    active: "rgba(26,122,58,0.12)",
    stopped: "rgba(224,122,0,0.12)",
    inactive: "rgba(139,139,139,0.12)",
};

const STATUS_TEXT: Record<string, string> = {
    draft: "#8B8B8B",
    active: "#1A7A3A",
    stopped: "#E07A00",
    inactive: "#8B8B8B",
};

const STATUS_LABEL: Record<string, string> = {
    draft: "Draft",
    active: "Active",
    stopped: "Paused",
    inactive: "Archived",
};

function formatBudget(budget?: { min?: number; max?: number }): string | null {
    if (!budget) return null;
    const { min, max } = budget;
    if (min == null && max == null) return null;
    const fmt = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;
    if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
    if (min != null) return `From ${fmt(min)}`;
    if (max != null) return `Up to ${fmt(max)}`;
    return null;
}

function formatDate(ts?: number): string | null {
    if (!ts) return null;
    return new Date(ts).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

const CollaborationCard: React.FC<CollaborationCardProps> = ({ item, onPress }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const statusKey = item.status ?? "draft";
    const statusBg = STATUS_BG[statusKey] ?? STATUS_BG.inactive;
    const statusText = STATUS_TEXT[statusKey] ?? STATUS_TEXT.inactive;
    const statusLabel = STATUS_LABEL[statusKey] ?? statusKey;

    const isPaid = item.promotionType === PromotionType.PAID_COLLAB || item.promotionType === "paid";
    const promoChipText = isPaid ? "Paid" : "Barter";
    const promoChipColor = isPaid ? "#6C47FF" : "#0070CC";

    const budgetText = formatBudget(item.budget);
    const dateText = formatDate(item.timeStamp);
    const platforms = item.platform?.join(" · ") ?? "";
    const formats = item.contentFormat?.join(" · ") ?? "";

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => onPress(item)}
        >
            <View style={[styles.typeAccent, { backgroundColor: promoChipColor }]} />

            <View style={styles.body}>
                <View style={styles.topRow}>
                    <View style={[styles.typeChip, { backgroundColor: promoChipColor + "1A" }]}>
                        <Text style={[styles.typeChipText, { color: promoChipColor }]}>
                            {promoChipText}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusText }]}>
                            {statusLabel}
                        </Text>
                    </View>
                    {item.version === 2 && (
                        <View style={styles.v2Badge}>
                            <Text style={styles.v2BadgeText}>v2</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.title} numberOfLines={2}>
                    {item.name || "Untitled Collaboration"}
                </Text>

                {(platforms || formats) ? (
                    <Text style={styles.meta} numberOfLines={1}>
                        {[platforms, formats].filter(Boolean).join("  ·  ")}
                    </Text>
                ) : null}

                {budgetText ? (
                    <Text style={styles.budget}>{budgetText}</Text>
                ) : null}

                <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                        {dateText ? (
                            <View style={styles.dateRow}>
                                <FontAwesomeIcon icon={faCalendarDays} size={11} color={colors.textSecondary} />
                                <Text style={styles.dateText}>{dateText}</Text>
                            </View>
                        ) : null}
                        {(item.applications ?? 0) > 0 ? (
                            <View style={styles.dateRow}>
                                <FontAwesomeIcon icon={faUsers} size={11} color={colors.textSecondary} />
                                <Text style={styles.dateText}>
                                    {item.applications} applied
                                </Text>
                            </View>
                        ) : null}
                    </View>
                    <FontAwesomeIcon icon={faChevronRight} size={12} color={colors.textSecondary} />
                </View>
            </View>
        </Pressable>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                card: {
                    flexDirection: "row",
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    overflow: "hidden",
                    marginHorizontal: 16,
                    marginVertical: 5,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                cardPressed: {
                    opacity: 0.76,
                },
                typeAccent: {
                    width: 4,
                    flexShrink: 0,
                },
                body: {
                    flex: 1,
                    padding: 14,
                    gap: 6,
                },
                topRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                },
                typeChip: {
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 6,
                },
                typeChipText: {
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                },
                statusBadge: {
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 6,
                },
                statusText: {
                    fontSize: 11,
                    fontWeight: "600",
                },
                v2Badge: {
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: "rgba(108,71,255,0.12)",
                },
                v2BadgeText: {
                    fontSize: 10,
                    fontWeight: "700",
                    color: "#6C47FF",
                    letterSpacing: 0.5,
                },
                title: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                    lineHeight: 21,
                },
                meta: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 17,
                },
                budget: {
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.primary,
                },
                footer: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 4,
                },
                footerLeft: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    flex: 1,
                },
                dateRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                },
                dateText: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: "500",
                },
            }),
        [colors]
    );
}

export default CollaborationCard;

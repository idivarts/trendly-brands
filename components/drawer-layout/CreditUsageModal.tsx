import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { faBolt, faDiagramProject, faFileContract, faGem, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface CreditUsageModalProps {
    visible: boolean;
    onClose: () => void;
    hideRefill?: boolean;
}

type CreditType = "discovery" | "invites" | "campaign-creation" | "contracts";
type CreditStatus = "normal" | "warning" | "critical";

interface CreditThreshold {
    warning: number;
    critical: number;
}

const CREDIT_THRESHOLDS: Record<CreditType, CreditThreshold> = {
    discovery: { warning: 20, critical: 10 },
    invites: { warning: 10, critical: 5 },
    "campaign-creation": { warning: 5, critical: 2 },
    contracts: { warning: 5, critical: 2 },
};

const CREDIT_WORKFLOW_COPY = [
    "Discovery credits are used every time you open a creator profile in Discover.",
    "Invite credits are spent when you send collaboration invites and refresh monthly.",
    "Campaign creation credits are consumed when you publish a new campaign.",
    "Contract credits are consumed when you generate and finalize new contracts.",
];

const STATUS_PRIORITY: Record<CreditStatus, number> = {
    normal: 1,
    warning: 2,
    critical: 3,
};

function getCreditStatus(value: number, threshold: CreditThreshold): CreditStatus {
    if (value <= threshold.critical) return "critical";
    if (value <= threshold.warning) return "warning";
    return "normal";
}

const CreditUsageModal: React.FC<CreditUsageModalProps> = ({
    visible,
    onClose,
    hideRefill = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const { selectedBrand } = useBrandContext();

    const discoverCoinsLeft = Number(selectedBrand?.credits?.discovery ?? 0);
    const connectionCreditsLeft = Number(
        selectedBrand?.credits?.connection ?? 0
    );
    const collaborationCredits = Number(
        selectedBrand?.credits?.collaboration ?? 0
    );
    const contractCredits = Number(selectedBrand?.credits?.contract ?? 0);

    const styles = useMemo(
        () => createStyles(colors, xl, width),
        [theme, colors, xl, width]
    );

    const creditItems = useMemo(
        () => [
            {
                key: "discovery" as CreditType,
                label: "Discovery",
                whereUsed: "Use in Discover while browsing detailed creator profiles.",
                whenCharged: "Charged per profile opened in Discover.",
                count: discoverCoinsLeft,
                icon: faGem,
                iconColor: colors.gold,
                status: getCreditStatus(
                    discoverCoinsLeft,
                    CREDIT_THRESHOLDS.discovery
                ),
            },
            {
                key: "campaign-creation" as CreditType,
                label: "Campaign creation",
                whereUsed: "Use in Collaborations while publishing campaign briefs.",
                whenCharged: "Charged when a campaign is created and published.",
                count: collaborationCredits,
                icon: faDiagramProject,
                iconColor: colors.gold,
                status: getCreditStatus(
                    collaborationCredits,
                    CREDIT_THRESHOLDS["campaign-creation"]
                ),
            },
            {
                key: "invites" as CreditType,
                label: "Invites",
                whereUsed: "Use when sending collaboration invites to creators.",
                whenCharged: "Charged for every invite sent. Recharges monthly.",
                count: connectionCreditsLeft,
                icon: faBolt,
                iconColor: colors.drawerInvitesIcon,
                status: getCreditStatus(
                    connectionCreditsLeft,
                    CREDIT_THRESHOLDS.invites
                ),
            },
            {
                key: "contracts" as CreditType,
                label: "Contracts",
                whereUsed: "Use in Contracts when creating and sharing contract drafts.",
                whenCharged:
                    "Charged when a new contract is generated for a collaboration.",
                count: contractCredits,
                icon: faFileContract,
                iconColor: colors.gold,
                status: getCreditStatus(
                    contractCredits,
                    CREDIT_THRESHOLDS.contracts
                ),
            },
        ],
        [
            discoverCoinsLeft,
            connectionCreditsLeft,
            collaborationCredits,
            contractCredits,
            colors.gold,
            colors.drawerInvitesIcon,
        ]
    );

    const modalStatus = useMemo<CreditStatus>(() => {
        const highest = creditItems.reduce<CreditStatus>((current, item) => {
            if (STATUS_PRIORITY[item.status] > STATUS_PRIORITY[current]) {
                return item.status;
            }
            return current;
        }, "normal");
        return highest;
    }, [creditItems]);

    const urgencyCopy = useMemo(() => {
        if (modalStatus === "critical") {
            return {
                title: "Credits are critically low",
                description:
                    "Your team may be blocked from sending invites, discovering creators, or launching campaigns soon.",
                actionHint:
                    "Refill now to avoid interruptions in creator discovery and outreach.",
            };
        }

        if (modalStatus === "warning") {
            return {
                title: "Credits are running low",
                description:
                    "You still have room to work, but at least one credit type is approaching low balance.",
                actionHint:
                    "Plan your next refill now so discovery and campaign workflows stay smooth.",
            };
        }

        return {
            title: "Credits are healthy",
            description:
                "You have enough credits across most workflows. Keep an eye on usage as campaigns scale.",
            actionHint:
                "Top up in advance before major outreach or campaign launch phases.",
        };
    }, [modalStatus]);

    const ctaText =
        modalStatus === "critical"
            ? "Refill Now"
            : modalStatus === "warning"
                ? "Refill Soon"
                : "Refill Credits";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={styles.modalCard}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Your Credits</Text>
                        <Pressable
                            onPress={onClose}
                            hitSlop={12}
                            style={styles.closeButton}
                        >
                            <FontAwesomeIcon
                                icon={faXmark}
                                size={20}
                                color={colors.textSecondary}
                            />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View
                            style={[
                                styles.urgencyStrip,
                                modalStatus === "critical" &&
                                styles.urgencyStripCritical,
                                modalStatus === "warning" &&
                                styles.urgencyStripWarning,
                                modalStatus === "normal" &&
                                styles.urgencyStripNormal,
                            ]}
                        >
                            <Text style={styles.urgencyTitle}>
                                {urgencyCopy.title}
                            </Text>
                            <Text style={styles.urgencyDescription}>
                                {urgencyCopy.description}
                            </Text>
                        </View>

                        <View style={styles.howItWorksCard}>
                            <Text style={styles.sectionTitle}>
                                How credits work
                            </Text>
                            {CREDIT_WORKFLOW_COPY.map((line) => (
                                <View key={line} style={styles.workflowRow}>
                                    <View style={styles.workflowBullet} />
                                    <Text style={styles.workflowText}>
                                        {line}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.gridSection}>
                            {creditItems.map((item, index) => (
                                <View
                                    key={item.key}
                                    style={[
                                        styles.creditTile,
                                        creditItems.length % 2 === 1 &&
                                        index === creditItems.length - 1 &&
                                        styles.creditTileFullWidth,
                                        item.status === "critical" &&
                                        styles.creditTileCritical,
                                        item.status === "warning" &&
                                        styles.creditTileWarning,
                                        item.status === "normal" &&
                                        styles.creditTileNormal,
                                    ]}
                                >
                                    <View style={styles.tileHeader}>
                                        <View style={styles.iconCircle}>
                                            <FontAwesomeIcon
                                                icon={item.icon}
                                                size={16}
                                                color={item.iconColor}
                                            />
                                        </View>
                                        <Text style={styles.tileLabel}>
                                            {item.label}
                                        </Text>
                                    </View>
                                    <Text style={styles.tileCount}>
                                        {item.count} left
                                    </Text>
                                    <Text style={styles.tileDescription}>
                                        {item.whereUsed}
                                    </Text>
                                    <Text style={styles.tileMeta}>
                                        {item.whenCharged}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.actionSection}>
                            <Text style={styles.actionHint}>
                                {urgencyCopy.actionHint}
                            </Text>
                            {!hideRefill && Platform.OS === "web" && (
                                <Pressable
                                    onPress={() => {
                                        onClose();
                                        router.push("/billing");
                                    }}
                                    style={({ pressed }) => [
                                        styles.refillButton,
                                        pressed && styles.refillButtonPressed,
                                    ]}
                                >
                                    <FontAwesomeIcon
                                        icon={faGem}
                                        size={16}
                                        color={colors.onPrimary}
                                        style={styles.refillIcon}
                                    />
                                    <Text style={styles.refillButtonText}>
                                        {ctaText}
                                    </Text>
                                </Pressable>
                            )}
                            {(hideRefill || Platform.OS !== "web") && (
                                <Text style={styles.actionSubText}>
                                    Visit Billing from desktop to refill credits.
                                </Text>
                            )}
                        </View>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const createStyles = (
    colors: ReturnType<typeof Colors>,
    xl: boolean,
    bpWidth: number
) => {
    const maxWidth = xl ? Math.min(700, bpWidth - 48) : bpWidth - 20;
    return StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.backdrop,
            padding: xl ? 24 : 16,
        },
        modalCard: {
            backgroundColor: colors.modalBackground,
            borderRadius: 18,
            width: "100%",
            maxWidth,
            maxHeight: "85%",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        title: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
        },
        closeButton: {
            padding: 4,
        },
        scrollView: {
            maxHeight: 650,
        },
        scrollContent: {
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 20,
            rowGap: 12,
        },
        urgencyStrip: {
            borderRadius: 12,
            padding: 14,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
        },
        urgencyStripCritical: {
            backgroundColor: colors.errorBannerBg,
            borderColor: colors.toastError,
        },
        urgencyStripWarning: {
            backgroundColor: colors.planBadgeProBg,
            borderColor: colors.yellow,
        },
        urgencyStripNormal: {
            backgroundColor: colors.budgetCardBg,
            borderColor: colors.budgetCardBorder,
        },
        urgencyTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 4,
        },
        urgencyDescription: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        howItWorksCard: {
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 14,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
        },
        sectionTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 8,
        },
        workflowRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 8,
        },
        iconCircle: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            backgroundColor: colors.budgetCardBg,
        },
        workflowBullet: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.primary,
            marginTop: 6,
            marginRight: 8,
        },
        workflowText: {
            flex: 1,
            fontSize: 13,
            lineHeight: 18,
            color: colors.textSecondary,
        },
        gridSection: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: 10,
        },
        creditTile: {
            width: xl ? "49%" : "48.5%",
            borderRadius: 12,
            padding: 12,
            borderWidth: StyleSheet.hairlineWidth,
            minHeight: 170,
        },
        creditTileFullWidth: {
            width: "100%",
        },
        creditTileCritical: {
            backgroundColor: colors.errorBannerBg,
            borderColor: colors.toastError,
        },
        creditTileWarning: {
            backgroundColor: colors.planBadgeProBg,
            borderColor: colors.yellow,
        },
        creditTileNormal: {
            backgroundColor: colors.card,
            borderColor: colors.border,
        },
        tileHeader: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
        },
        tileLabel: {
            flex: 1,
            fontSize: 13,
            fontWeight: "700",
            color: colors.text,
        },
        tileCount: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 8,
        },
        tileDescription: {
            fontSize: 12,
            lineHeight: 17,
            color: colors.text,
            marginBottom: 6,
        },
        tileMeta: {
            fontSize: 11,
            lineHeight: 16,
            color: colors.textSecondary,
        },
        actionSection: {
            borderRadius: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            backgroundColor: colors.card,
            padding: 14,
        },
        actionHint: {
            fontSize: 13,
            color: colors.text,
            marginBottom: 10,
            lineHeight: 18,
        },
        refillButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderRadius: 12,
        },
        refillButtonPressed: {
            opacity: 0.9,
        },
        refillIcon: {
            marginRight: 8,
        },
        refillButtonText: {
            fontSize: 15,
            fontWeight: "600",
            color: colors.onPrimary,
        },
        actionSubText: {
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 17,
        },
    });
};

export default CreditUsageModal;

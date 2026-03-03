import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { IS_MONETIZATION_DONE } from "@/shared-constants/app";
import { faBolt, faGem, faStar, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface CreditUsageModalProps {
    visible: boolean;
    onClose: () => void;
}

const CreditProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(
        () =>
            StyleSheet.create({
                track: {
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.drawerProgressTrack,
                    overflow: "hidden",
                    marginTop: 10,
                },
                fill: {
                    height: "100%",
                    backgroundColor: colors.drawerProgressFill,
                    borderRadius: 3,
                },
            }),
        [colors]
    );
    const fillStyle = useMemo(
        () => ({ width: `${progress * 100}%` }),
        [progress]
    );
    return (
        <View style={styles.track}>
            <View style={[styles.fill, fillStyle]} />
        </View>
    );
};

const CreditUsageModal: React.FC<CreditUsageModalProps> = ({
    visible,
    onClose,
}) => {
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
        () => createStyles(theme, colors, xl, width),
        [theme, colors, xl, width]
    );

    const creditItems = useMemo(
        () => [
            {
                key: "influencers",
                label: "Influencers",
                hint: "Unlock from explore influencers",
                count: influencerCredits,
                icon: faStar,
                iconColor: colors.gold,
            },
            {
                key: "discovery",
                label: "Discovery",
                hint: "1 coin per profile on discover",
                count: discoverCoinsLeft,
                icon: faGem,
                iconColor: colors.gold,
                progress: discoveryProgress,
            },
            {
                key: "invites",
                label: "Invites",
                hint: "1 coin per invite. Recharges monthly",
                count: connectionCreditsLeft,
                icon: faBolt,
                iconColor: colors.drawerInvitesIcon,
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
                        {creditItems.map((item) => (
                            <View key={item.key} style={styles.card}>
                                <View style={styles.cardRow}>
                                    <View style={styles.iconCircle}>
                                        <FontAwesomeIcon
                                            icon={item.icon}
                                            size={18}
                                            color={item.iconColor}
                                        />
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardLabel}>
                                            {item.label}
                                        </Text>
                                        <Text style={styles.cardHint}>
                                            {item.hint}
                                        </Text>
                                    </View>
                                    <Text style={styles.cardCount}>
                                        {item.count}
                                    </Text>
                                </View>
                                {item.progress !== undefined && (
                                    <CreditProgressBar
                                        progress={item.progress}
                                    />
                                )}
                            </View>
                        ))}

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
                            <Text style={styles.refillButtonText}>Refill</Text>
                        </Pressable>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const createStyles = (
    theme: any,
    colors: ReturnType<typeof Colors>,
    xl: boolean,
    bpWidth: number
) => {
    const maxWidth = xl ? Math.min(400, bpWidth - 48) : bpWidth - 32;
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
            borderRadius: 16,
            width: "100%",
            maxWidth,
            maxHeight: "85%",
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        closeButton: {
            padding: 4,
        },
        scrollView: {
            maxHeight: 400,
        },
        scrollContent: {
            padding: 4,
            paddingBottom: 20,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 14,
            marginHorizontal: 8,
            marginBottom: 10,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
        },
        cardRow: {
            flexDirection: "row",
            alignItems: "center",
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
        cardContent: {
            flex: 1,
        },
        cardLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        cardHint: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
        cardCount: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
        },
        refillButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderRadius: 12,
            marginTop: 16,
            marginHorizontal: 12,
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
    });
};

export default CreditUsageModal;

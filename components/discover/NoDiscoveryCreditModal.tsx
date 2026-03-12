import { useMyGrowthBook } from "@/contexts/growthbook-context-provider";
import { useBreakpoints } from "@/hooks";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { View } from "@/shared-uis/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
} from "react-native";
import { Button } from "react-native-paper";

const PLANS_PREVIEW = [
    { name: "Growth", price: "₹625", period: "/mo", features: "50 unlocks, 8 contracts" },
    { name: "Pro", price: "₹1,250", period: "/mo", features: "Unlimited unlocks & contracts" },
    { name: "Enterprise", price: "Custom", period: "", features: "Discovery with no limits" },
];

interface NoDiscoveryCreditModalProps {
    visible: boolean;
    onClose: () => void;
}

const useStyles = (
    colors: ReturnType<typeof Colors>,
    xl: boolean,
    width: number
) =>
    useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: colors.backdrop,
                    padding: xl ? 24 : 16,
                },
                modalCard: {
                    backgroundColor: colors.modalBackground,
                    borderRadius: 20,
                    overflow: "hidden",
                    width: "100%",
                    maxWidth: xl ? 520 : width - 32,
                    maxHeight: "90%",
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 8,
                },
                header: {
                    paddingHorizontal: xl ? 28 : 20,
                    paddingTop: xl ? 28 : 24,
                    paddingBottom: xl ? 16 : 12,
                },
                iconWrapper: {
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.budgetCardBg,
                    borderWidth: 1,
                    borderColor: colors.budgetCardBorder,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 16,
                },
                iconText: {
                    fontSize: 28,
                },
                title: {
                    fontSize: xl ? 22 : 20,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 8,
                },
                subtitle: {
                    fontSize: xl ? 15 : 14,
                    lineHeight: 22,
                    color: colors.textSecondary,
                },
                plansSection: {
                    paddingHorizontal: xl ? 28 : 20,
                    paddingVertical: xl ? 20 : 16,
                },
                plansLabel: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                },
                plansRow: {
                    flexDirection: xl ? "row" : "column",
                    gap: 12,
                },
                planChip: {
                    flex: xl ? 1 : undefined,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: colors.tag,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                planName: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 2,
                },
                planPrice: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.primary,
                },
                planFeatures: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 4,
                },
                actionsSection: {
                    paddingHorizontal: xl ? 28 : 20,
                    paddingBottom: xl ? 28 : 24,
                    paddingTop: 8,
                },
                primaryButton: {
                    borderRadius: 12,
                    paddingVertical: 14,
                    marginBottom: 12,
                    backgroundColor: colors.primary,
                },
                primaryButtonText: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                demoLink: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 8,
                },
                demoLinkText: {
                    fontSize: 14,
                    color: colors.primary,
                    fontWeight: "500",
                    textDecorationLine: "underline",
                },
                closeButton: {
                    position: "absolute",
                    top: 16,
                    right: 16,
                    zIndex: 10,
                    padding: 8,
                    borderRadius: 20,
                    backgroundColor: colors.tag,
                },
                closeText: {
                    fontSize: 18,
                    color: colors.textSecondary,
                },
                scrollContent: {
                    paddingBottom: 8,
                },
            }),
        [colors, xl, width]
    );

export const NoDiscoveryCreditModal: React.FC<NoDiscoveryCreditModalProps> = ({
    visible,
    onClose,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const styles = useStyles(colors, xl, width);
    const router = useMyNavigation();
    const { features } = useMyGrowthBook();
    const demoLink = features?.demoLink || "https://cal.com/rahul-idiv/30min";

    const handleGoToBilling = () => {
        onClose();
        router.push("/billing");
    };

    const handleScheduleDemo = () => {
        Linking.openURL(demoLink);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    <Pressable
                        onPress={onClose}
                        style={styles.closeButton}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                    >
                        <Text style={styles.closeText}>×</Text>
                    </Pressable>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.header}>
                            <View style={styles.iconWrapper}>
                                <Text style={styles.iconText}>🔒</Text>
                            </View>
                            <Text style={styles.title}>
                                You've exhausted your free discovery credits
                            </Text>
                            <Text style={styles.subtitle}>
                                You've used up the free usage of the platform. To continue
                                discovering and unlocking influencer profiles, upgrade to a
                                paid plan and keep using the platform without limits.
                            </Text>
                        </View>

                        <View style={styles.plansSection}>
                            <Text style={styles.plansLabel}>Plans at a glance</Text>
                            <View style={styles.plansRow}>
                                {PLANS_PREVIEW.map((plan) => (
                                    <View key={plan.name} style={styles.planChip}>
                                        <Text style={styles.planName}>{plan.name}</Text>
                                        <Text style={styles.planPrice}>
                                            {plan.price}
                                            {plan.period}
                                        </Text>
                                        <Text style={styles.planFeatures}>{plan.features}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.actionsSection}>
                            <Button
                                mode="contained"
                                onPress={handleGoToBilling}
                                style={styles.primaryButton}
                                labelStyle={styles.primaryButtonText}
                            >
                                Go to Billing & Upgrade
                            </Button>

                            <Pressable
                                onPress={handleScheduleDemo}
                                style={styles.demoLink}
                                accessibilityRole="link"
                            >
                                <Text style={styles.demoLinkText}>
                                    Questions or want a quick demo with our team? Click here
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default NoDiscoveryCreditModal;

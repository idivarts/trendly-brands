import type { InfluencerKycShippingAddress } from "./influencer-kyc-shipping-address";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faClose, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal as RNModal,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Modal as PaperModal } from "react-native-paper";
import { Text } from "../theme/Themed";
import Button from "../ui/button";

export interface ViewInfluencerAddressModalProps {
    visible: boolean;
    onClose: () => void;
    influencerName: string;
    /** From Firestore `users/{id}.kyc.currentAddress`. */
    address?: InfluencerKycShippingAddress | null;
    loading?: boolean;
    errorMessage?: string | null;
    onNudgeForAddress?: () => Promise<void>;
}

const ViewInfluencerAddressModal: React.FC<ViewInfluencerAddressModalProps> = ({
    visible,
    onClose,
    influencerName,
    address,
    loading = false,
    errorMessage = null,
    onNudgeForAddress,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
    const [sending, setSending] = useState(false);

    const hasAddress =
        address &&
        String(address.street ?? "").trim() &&
        String(address.city ?? "").trim();

    const handleNudge = async () => {
        if (!onNudgeForAddress) return;
        setSending(true);
        try {
            await onNudgeForAddress();
            Toaster.success("Message sent in chat");
            onClose();
        } catch {
            Toaster.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const content = (
        <View style={styles.inner}>
            <View style={styles.header}>
                <Text style={styles.title}>Influencer shipping address</Text>
                <Pressable onPress={onClose} hitSlop={12}>
                    <FontAwesomeIcon icon={faClose} color={colors.primary} size={22} />
                </Pressable>
            </View>
            <Text style={styles.subtitle}>{influencerName}</Text>

            {loading ? (
                <View style={styles.centerBlock}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading address…</Text>
                </View>
            ) : errorMessage ? (
                <View style={styles.centerBlock}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            ) : hasAddress ? (
                <View style={styles.addressBlock}>
                    <View style={styles.addressRow}>
                        <FontAwesomeIcon
                            icon={faLocationDot}
                            size={16}
                            color={colors.gray300}
                            style={styles.addressIcon}
                        />
                        <View style={styles.addressLines}>
                            <Text style={styles.addressLine}>{address!.street}</Text>
                            <Text style={styles.addressLine}>
                                {[address!.city, address!.state, address!.postalCode]
                                    .filter((p) => String(p ?? "").trim())
                                    .join(", ")}
                            </Text>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.noAddressBlock}>
                    <Text style={styles.noAddressText}>No KYC address on file</Text>
                    {onNudgeForAddress ? (
                        <>
                            <Text style={styles.noAddressHint}>
                                Ask the influencer to complete KYC with a valid shipping address. You
                                can nudge them in the contract chat.
                            </Text>
                            <Button
                                mode="contained"
                                onPress={handleNudge}
                                disabled={sending}
                                style={styles.nudgeButton}
                            >
                                {sending ? "Sending…" : "Nudge in chat"}
                            </Button>
                        </>
                    ) : null}
                </View>
            )}

            <Button mode="outlined" onPress={onClose} style={styles.closeButton}>
                Close
            </Button>
        </View>
    );

    if (Platform.OS !== "web") {
        return (
            <RNModal
                visible={visible}
                animationType="slide"
                onRequestClose={onClose}
                statusBarTranslucent
            >
                <View style={styles.modalContainer}>{content}</View>
            </RNModal>
        );
    }

    return (
        <PaperModal
            visible={visible}
            onDismiss={onClose}
            contentContainerStyle={styles.modalContainer}
        >
            {content}
        </PaperModal>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, safeAreaTop: number) {
    const isNative = Platform.OS !== "web";
    return StyleSheet.create({
        modalContainer: {
            backgroundColor: colors.background,
            ...(isNative
                ? {
                      flex: 1,
                      margin: 0,
                      paddingTop: Math.max(safeAreaTop, 16),
                      paddingHorizontal: 24,
                      paddingBottom: 24,
                  }
                : {
                      borderRadius: 12,
                      marginHorizontal: 24,
                      maxWidth: 440,
                      alignSelf: "center",
                      overflow: "hidden",
                  }),
        },
        inner: {
            flex: 1,
            padding: isNative ? 0 : 20,
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
        },
        title: {
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
        },
        subtitle: {
            fontSize: 14,
            color: colors.gray300,
            marginBottom: 16,
        },
        centerBlock: {
            paddingVertical: 24,
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
        },
        loadingText: {
            fontSize: 14,
            color: colors.gray300,
        },
        errorText: {
            fontSize: 15,
            color: colors.text,
            textAlign: "center",
            lineHeight: 22,
        },
        addressBlock: {
            backgroundColor: colors.tag ?? "rgba(0,0,0,0.06)",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
        },
        addressRow: {
            flexDirection: "row",
            alignItems: "flex-start",
        },
        addressIcon: {
            marginTop: 2,
        },
        addressLines: {
            flex: 1,
            marginLeft: 12,
        },
        addressLine: {
            fontSize: 15,
            color: colors.text,
            lineHeight: 22,
        },
        noAddressBlock: {
            marginBottom: 20,
        },
        noAddressText: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 8,
        },
        noAddressHint: {
            fontSize: 14,
            color: colors.gray300,
            lineHeight: 20,
            marginBottom: 16,
        },
        nudgeButton: {
            alignSelf: "flex-start",
        },
        closeButton: {
            alignSelf: "stretch",
        },
    });
}

export default ViewInfluencerAddressModal;

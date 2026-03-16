import type { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faClose, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Modal as RNModal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Modal as PaperModal } from "react-native-paper";
import { Text } from "../theme/Themed";
import Button from "../ui/button";

export interface ViewInfluencerAddressModalProps {
    visible: boolean;
    onClose: () => void;
    influencerName: string;
    address: IUsers["currentAddress"] | null | undefined;
    onNudgeForAddress: () => Promise<void>;
}

const ViewInfluencerAddressModal: React.FC<ViewInfluencerAddressModalProps> = ({
    visible,
    onClose,
    influencerName,
    address,
    onNudgeForAddress,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
    const [sending, setSending] = useState(false);

    const hasAddress = address?.line1 && address?.city;

    const handleNudge = async () => {
        setSending(true);
        try {
            await onNudgeForAddress();
            Toaster.success("Message sent in chat");
            onClose();
        } catch (e) {
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

                {hasAddress ? (
                    <View style={styles.addressBlock}>
                        <View style={styles.addressRow}>
                            <FontAwesomeIcon
                                icon={faLocationDot}
                                size={16}
                                color={colors.gray300}
                                style={styles.addressIcon}
                            />
                            <View style={styles.addressLines}>
                                <Text style={styles.addressLine}>{address.line1}</Text>
                                {address.line2 ? (
                                    <Text style={styles.addressLine}>{address.line2}</Text>
                                ) : null}
                                <Text style={styles.addressLine}>
                                    {[address.city, address.state, address.postalCode]
                                        .filter(Boolean)
                                        .join(", ")}
                                </Text>
                                {address.country ? (
                                    <Text style={styles.addressLine}>{address.country}</Text>
                                ) : null}
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.noAddressBlock}>
                        <Text style={styles.noAddressText}>No address on file</Text>
                        <Text style={styles.noAddressHint}>
                            Ask the influencer to share their shipping address. You can nudge them
                            with a message in the contract chat.
                        </Text>
                        <Button
                            mode="contained"
                            onPress={handleNudge}
                            disabled={sending}
                            style={styles.nudgeButton}
                        >
                            {sending ? "Sending…" : "Nudge for address in chat"}
                        </Button>
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

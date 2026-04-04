import type { InfluencerKycShippingAddress } from "./influencer-kyc-shipping-address";
import Colors from "@/shared-uis/constants/Colors";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "../theme/Themed";

export interface ViewInfluencerAddressBottomSheetProps {
    influencerName: string;
    /** Populated from Firestore `users/{id}.kyc.currentAddress` after fetch. */
    address?: InfluencerKycShippingAddress | null;
    loading?: boolean;
    errorMessage?: string | null;
}

const ViewInfluencerAddressBottomSheet: React.FC<ViewInfluencerAddressBottomSheetProps> = ({
    influencerName,
    address,
    loading = false,
    errorMessage = null,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const hasAddress =
        address &&
        String(address.street ?? "").trim() &&
        String(address.city ?? "").trim();

    return (
        <View style={styles.inner}>
            <Text style={styles.title}>Influencer shipping address</Text>
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
                </View>
            )}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        inner: {
            padding: 20,
            paddingBottom: 32,
        },
        title: {
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 4,
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
            paddingVertical: 8,
        },
        noAddressText: {
            fontSize: 16,
            color: colors.gray300,
        },
    });
}

export default ViewInfluencerAddressBottomSheet;

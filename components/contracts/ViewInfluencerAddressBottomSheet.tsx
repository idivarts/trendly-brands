import type { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import Colors from "@/shared-uis/constants/Colors";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../theme/Themed";

export interface ViewInfluencerAddressBottomSheetProps {
    influencerName: string;
    address: IUsers["currentAddress"] | null | undefined;
}

const ViewInfluencerAddressBottomSheet: React.FC<ViewInfluencerAddressBottomSheetProps> = ({
    influencerName,
    address,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const hasAddress = address?.line1 && address?.city;

    return (
        <View style={styles.inner}>
            <Text style={styles.title}>Influencer shipping address</Text>
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
                            <Text style={styles.addressLine}>{address!.line1}</Text>
                            {address!.line2 ? (
                                <Text style={styles.addressLine}>{address!.line2}</Text>
                            ) : null}
                            <Text style={styles.addressLine}>
                                {[address!.city, address!.state, address!.postalCode]
                                    .filter(Boolean)
                                    .join(", ")}
                            </Text>
                            {address!.country ? (
                                <Text style={styles.addressLine}>{address!.country}</Text>
                            ) : null}
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.noAddressBlock}>
                    <Text style={styles.noAddressText}>No address</Text>
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

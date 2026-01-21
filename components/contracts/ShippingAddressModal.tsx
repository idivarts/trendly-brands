import { Text } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import { faMapMarkerAlt, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import * as Clipboard from 'expo-clipboard';
import React from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";

interface ShippingAddressModalProps {
    visible: boolean;
    onClose: () => void;
    userData: IUsers;
}

const ShippingAddressModal: React.FC<ShippingAddressModalProps> = ({
    visible,
    onClose,
    userData,
}) => {
    const theme = useTheme();

    const getFullAddress = () => {
        const address = userData.currentAddress;
        if (!address) return "No address available";

        const parts = [
            address.line1,
            address.line2,
            address.city,
            address.state,
            address.postalCode,
            address.country,
        ].filter(Boolean);

        return parts.join(", ");
    };

    const handleCopyAddress = async () => {
        const fullAddress = getFullAddress();
        await Clipboard.setStringAsync(fullAddress);
        Alert.alert("Success", "Address copied to clipboard");
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.overlay}
                onPress={onClose}
            >
                <Pressable
                    style={[
                        styles.modalContainer,
                        { backgroundColor: Colors(theme).background },
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleContainer}>
                            <FontAwesomeIcon
                                icon={faMapMarkerAlt}
                                size={24}
                                color={Colors(theme).primary}
                            />
                            <Text style={styles.title}>Shipping Address</Text>
                        </View>
                        <Pressable onPress={onClose}>
                            <FontAwesomeIcon
                                icon={faTimes}
                                size={24}
                                color={Colors(theme).text}
                            />
                        </Pressable>
                    </View>

                    {/* Address Content */}
                    <View style={styles.content}>
                        <View style={styles.addressContainer}>
                            <Text style={styles.label}>Influencer Name</Text>
                            <Text style={styles.value}>{userData.name || "N/A"}</Text>
                        </View>

                        {userData.currentAddress ? (
                            <>
                                {userData.currentAddress.line1 && (
                                    <View style={styles.addressContainer}>
                                        <Text style={styles.label}>Address Line 1</Text>
                                        <Text style={styles.value}>{userData.currentAddress.line1}</Text>
                                    </View>
                                )}

                                {userData.currentAddress.line2 && (
                                    <View style={styles.addressContainer}>
                                        <Text style={styles.label}>Address Line 2</Text>
                                        <Text style={styles.value}>{userData.currentAddress.line2}</Text>
                                    </View>
                                )}

                                {userData.currentAddress.city && (
                                    <View style={styles.addressContainer}>
                                        <Text style={styles.label}>City</Text>
                                        <Text style={styles.value}>{userData.currentAddress.city}</Text>
                                    </View>
                                )}

                                {userData.currentAddress.state && (
                                    <View style={styles.addressContainer}>
                                        <Text style={styles.label}>State</Text>
                                        <Text style={styles.value}>{userData.currentAddress.state}</Text>
                                    </View>
                                )}

                                {userData.currentAddress.postalCode && (
                                    <View style={styles.addressContainer}>
                                        <Text style={styles.label}>Postal Code</Text>
                                        <Text style={styles.value}>{userData.currentAddress.postalCode}</Text>
                                    </View>
                                )}

                                {userData.currentAddress.country && (
                                    <View style={styles.addressContainer}>
                                        <Text style={styles.label}>Country</Text>
                                        <Text style={styles.value}>{userData.currentAddress.country}</Text>
                                    </View>
                                )}

                                <View style={[styles.fullAddressBox, { backgroundColor: Colors(theme).gray100 + "20" }]}>
                                    <Text style={[styles.fullAddress, { color: Colors(theme).text }]}>
                                        {getFullAddress()}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.addressContainer}>
                                <Text style={[styles.value, { fontStyle: "italic" }]}>
                                    No address information available
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            onPress={handleCopyAddress}
                            style={styles.button}
                            labelStyle={{ color: Colors(theme).primary }}
                            disabled={!userData.currentAddress}
                        >
                            Copy Address
                        </Button>
                        <Button
                            mode="contained"
                            onPress={onClose}
                            style={styles.button}
                            buttonColor={Colors(theme).primary}
                        >
                            Done
                        </Button>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "90%",
        maxWidth: 500,
        borderRadius: 12,
        padding: 20,
        maxHeight: "80%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
    },
    content: {
        gap: 16,
        marginBottom: 20,
    },
    addressContainer: {
        gap: 4,
    },
    label: {
        fontSize: 12,
        opacity: 0.6,
        fontWeight: "500",
    },
    value: {
        fontSize: 16,
        fontWeight: "400",
    },
    fullAddressBox: {
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    fullAddress: {
        fontSize: 14,
        lineHeight: 20,
    },
    actions: {
        flexDirection: "row",
        gap: 12,
    },
    button: {
        flex: 1,
    },
});

export default ShippingAddressModal;

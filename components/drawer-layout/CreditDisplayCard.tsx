import { Text, View } from "@/components/theme/Themed";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Colors from "@/shared-uis/constants/Colors";
import { faBolt, faGem as faGemSolid } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Theme, useTheme } from "@react-navigation/native";
import React, { forwardRef, useMemo, useState } from "react";
import { Pressable, StyleSheet, View as RNView } from "react-native";
import CreditUsageModal from "./CreditUsageModal";

export interface CreditDisplayCardProps {
    discoverCoinsLeft: number;
    connectionCreditsLeft: number;
    discoveryProgress: number;
}

const CreditDisplayCard = React.forwardRef<any, CreditDisplayCardProps>(
    ({ discoverCoinsLeft, connectionCreditsLeft, discoveryProgress }, ref) => {
        const theme = useTheme();
        const colors = Colors(theme);
        const nav = useMyNavigation();
        const styles = useMemo(
            () => createStyles(theme),
            [theme]
        );
        const progressFillStyle = useMemo(
            () => ({ width: `${discoveryProgress * 100}%` }),
            [discoveryProgress]
        );

        const [modalVisible, setModalVisible] = useState(false);

        const handleCardPress = () => {
            setModalVisible(true);
        };

        const handleRefillPress = () => {
            nav.push("/billing");
        };

        return (
            <>
            <RNView ref={ref} collapsable={false}>
                <RNView style={styles.creditsCard}>
                    <RNView style={styles.creditsRow}>
                        <Pressable
                            onPress={handleCardPress}
                            style={({ pressed }) => [
                                styles.creditsMainPressable,
                                pressed && styles.creditsCardPressed,
                            ]}
                        >
                            <FontAwesomeIcon
                                icon={faGemSolid}
                                size={18}
                                color={colors.gold}
                                style={styles.creditsIcon}
                            />
                            <Text style={styles.creditsDiscoveryText}>
                                {discoverCoinsLeft} Discovery
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={handleRefillPress}
                            hitSlop={8}
                            style={({ pressed: refillPressed }) => [
                                styles.refillButton,
                                refillPressed && styles.refillButtonPressed,
                            ]}
                        >
                            <Text style={styles.refillLink}>REFILL</Text>
                        </Pressable>
                    </RNView>
                    <Pressable onPress={handleCardPress}>
                        <RNView style={styles.progressTrack}>
                            <RNView
                                style={[styles.progressFill, progressFillStyle]}
                            />
                        </RNView>
                    </Pressable>
                    <Pressable
                        onPress={handleCardPress}
                        style={({ pressed }) => [
                            styles.creditsRow,
                            pressed && styles.creditsCardPressed,
                        ]}
                    >
                        <FontAwesomeIcon
                            icon={faBolt}
                            size={18}
                            color={colors.drawerInvitesIcon}
                            style={styles.creditsIcon}
                        />
                        <Text style={styles.creditsInvitesText}>
                            {connectionCreditsLeft} Invites
                        </Text>
                        <Text style={styles.creditsMonthly}>Monthly</Text>
                    </Pressable>
                </RNView>
            </RNView>
            <CreditUsageModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
            </>
        );
    }
);

CreditDisplayCard.displayName = "CreditDisplayCard";

const createStyles = (theme: Theme) => {
    const colors = Colors(theme);
    return StyleSheet.create({
        creditsCard: {
            backgroundColor: colors.drawerCardBg,
            borderRadius: 12,
            padding: 12,
            marginHorizontal: 8,
            gap: 8,
        },
        creditsCardPressed: {
            opacity: 0.9,
        },
        creditsRow: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
        },
        creditsMainPressable: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
        },
        creditsIcon: {
            marginRight: 8,
        },
        creditsDiscoveryText: {
            flex: 1,
            fontSize: 14,
            color: colors.drawerText,
            fontWeight: "500",
        },
        refillButton: {
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 6,
        },
        refillButtonPressed: {
            backgroundColor: colors.glassSurface,
        },
        refillLink: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.aliceBlue,
        },
        progressTrack: {
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.drawerProgressTrack,
            overflow: "hidden",
        },
        progressFill: {
            height: "100%",
            backgroundColor: colors.drawerProgressFill,
            borderRadius: 3,
        },
        creditsInvitesText: {
            flex: 1,
            fontSize: 14,
            color: colors.drawerText,
            fontWeight: "500",
        },
        creditsMonthly: {
            fontSize: 11,
            color: colors.drawerTextMuted,
        },
    });
};

export default CreditDisplayCard;

import { Text } from "@/components/theme/Themed";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Colors from "@/shared-uis/constants/Colors";
import {
    faBolt,
    faDiagramProject,
    faGem as faGemSolid,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { usePathname } from "expo-router";
import { Theme, useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    DimensionValue,
    Platform,
    Pressable,
    StyleSheet,
    View as RNView,
} from "react-native";
import CreditUsageModal from "./CreditUsageModal";

const DISCOVERY_LIMIT = 1000;
const COLLABORATION_LIMIT = 1000;

type CreditContext = "discovery" | "campaigns";

function getCreditContext(pathname: string): CreditContext {
    if (pathname.includes("collaboration") || pathname === "/collaborations")
        return "campaigns";
    return "discovery";
}

export interface CreditDisplayCardProps {
    hideRefill?: boolean;
}

const CreditDisplayCard = React.forwardRef<RNView, CreditDisplayCardProps>(
    ({ hideRefill = false }, ref) => {
        const theme = useTheme();
        const colors = Colors(theme);
        const pathname = usePathname();
        const { selectedBrand } = useBrandContext();
        const nav = useMyNavigation();

        const creditContext = useMemo(
            () => getCreditContext(pathname),
            [pathname]
        );

        const discoverCoinsLeft = Number(selectedBrand?.credits?.discovery ?? 0);
        const connectionCreditsLeft = Number(
            selectedBrand?.credits?.connection ?? 0
        );
        const collaborationCredits = Number(
            selectedBrand?.credits?.collaboration ?? 0
        );

        const discoveryProgress = useMemo(
            () => Math.min(1, discoverCoinsLeft / DISCOVERY_LIMIT),
            [discoverCoinsLeft]
        );
        const collaborationProgress = useMemo(
            () => Math.min(1, collaborationCredits / COLLABORATION_LIMIT),
            [collaborationCredits]
        );

        const styles = useMemo(() => createStyles(theme), [theme]);
        const [modalVisible, setModalVisible] = useState(false);

        const handleCardPress = () => setModalVisible(true);
        const handleRefillPress = () => nav.push("/billing");

        const progressFillStyle = useMemo(() => {
            const progress =
                creditContext === "discovery"
                    ? discoveryProgress
                    : collaborationProgress;
            return { width: `${progress * 100}%` as DimensionValue };
        }, [
            creditContext,
            discoveryProgress,
            collaborationProgress,
        ]);

        const renderCardContent = () => {
            if (creditContext === "discovery") {
                return (
                    <>
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
                            {!hideRefill && Platform.OS === "web" && (
                                <Pressable
                                    onPress={handleRefillPress}
                                    hitSlop={8}
                                    style={({ pressed: refillPressed }) => [
                                        styles.refillButton,
                                        refillPressed &&
                                            styles.refillButtonPressed,
                                    ]}
                                >
                                    <Text style={styles.refillLink}>
                                        REFILL
                                    </Text>
                                </Pressable>
                            )}
                        </RNView>
                        <Pressable onPress={handleCardPress}>
                            <RNView style={styles.progressTrack}>
                                <RNView
                                    style={[
                                        styles.progressFill,
                                        progressFillStyle,
                                    ]}
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
                    </>
                );
            }

            // campaigns
            return (
                <>
                    <Pressable
                        onPress={handleCardPress}
                        style={({ pressed }) => [
                            styles.creditsRow,
                            pressed && styles.creditsCardPressed,
                        ]}
                    >
                        <FontAwesomeIcon
                            icon={faDiagramProject}
                            size={18}
                            color={colors.gold}
                            style={styles.creditsIcon}
                        />
                        <Text style={styles.creditsDiscoveryText}>
                            {collaborationCredits} Create campaign
                        </Text>
                        {!hideRefill && Platform.OS === "web" && (
                            <Pressable
                                onPress={handleRefillPress}
                                hitSlop={8}
                                style={({ pressed: refillPressed }) => [
                                    styles.refillButton,
                                    refillPressed &&
                                        styles.refillButtonPressed,
                                ]}
                            >
                                <Text style={styles.refillLink}>REFILL</Text>
                            </Pressable>
                        )}
                    </Pressable>
                    <Pressable onPress={handleCardPress}>
                        <RNView style={styles.progressTrack}>
                            <RNView
                                style={[
                                    styles.progressFill,
                                    progressFillStyle,
                                ]}
                            />
                        </RNView>
                    </Pressable>
                </>
            );
        };

        return (
            <>
                <RNView ref={ref} collapsable={false}>
                    <RNView style={styles.creditsCard} key={creditContext}>
                        {renderCardContent()}
                    </RNView>
                </RNView>
                <CreditUsageModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    hideRefill={hideRefill}
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

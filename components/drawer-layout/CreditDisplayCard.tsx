import { Text } from "@/components/theme/Themed";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Colors from "@/shared-uis/constants/Colors";
import {
    faBolt,
    faDiagramProject,
    faFileContract,
    faGem as faGemSolid,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Theme, useTheme } from "@react-navigation/native";
import { usePathname } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    View as RNView,
    StyleSheet,
} from "react-native";
import { CREDIT_THRESHOLDS, CreditThreshold } from "./credit-thresholds";
import CreditUsageModal from "./CreditUsageModal";

type CreditContext = "discovery" | "campaigns" | "contracts";
type CreditStatus = "normal" | "warning" | "critical";

function getCreditContext(pathname: string): CreditContext {
    if (pathname.includes("contract")) return "contracts";
    if (pathname.includes("collaboration") || pathname === "/collaborations")
        return "campaigns";
    return "discovery";
}

function getCreditStatus(
    value: number,
    thresholds: CreditThreshold
): CreditStatus {
    if (value <= thresholds.critical) return "critical";
    if (value <= thresholds.warning) return "warning";
    return "normal";
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
        const contractCredits = Number(selectedBrand?.credits?.contract ?? 0);

        const styles = useMemo(() => createStyles(theme), [theme]);
        const [modalVisible, setModalVisible] = useState(false);

        const handleCardPress = () => setModalVisible(true);
        const handleRefillPress = () => nav.push("/billing");

        const discoveryStatus = getCreditStatus(
            discoverCoinsLeft,
            CREDIT_THRESHOLDS.discovery
        );
        const inviteStatus = getCreditStatus(
            connectionCreditsLeft,
            CREDIT_THRESHOLDS.invites
        );
        const campaignStatus = getCreditStatus(
            collaborationCredits,
            CREDIT_THRESHOLDS.campaigns
        );
        const contractStatus = getCreditStatus(
            contractCredits,
            CREDIT_THRESHOLDS.contracts
        );

        const renderStatusIndicator = (status: CreditStatus) => {
            if (status === "normal") return null;
            return (
                <RNView
                    style={[
                        styles.statusDot,
                        status === "warning" && styles.statusDotWarning,
                        status === "critical" && styles.statusDotCritical,
                    ]}
                >
                    {status === "critical" && (
                        <Text style={styles.statusDotCriticalText}>!</Text>
                    )}
                </RNView>
            );
        };

        const renderCardContent = () => {
            if (creditContext === "discovery") {
                return (
                    <>
                        <RNView style={styles.creditsRowTop}>
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
                                {renderStatusIndicator(discoveryStatus)}
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
                            {renderStatusIndicator(inviteStatus)}
                        </Pressable>
                    </>
                );
            }

            if (creditContext === "contracts") {
                return (
                    <Pressable
                        onPress={handleCardPress}
                        style={({ pressed }) => [
                            styles.creditsRowTop,
                            pressed && styles.creditsCardPressed,
                        ]}
                    >
                        <FontAwesomeIcon
                            icon={faFileContract}
                            size={18}
                            color={colors.gold}
                            style={styles.creditsIcon}
                        />
                        <Text style={styles.creditsDiscoveryText}>
                            {contractCredits} Contracts
                        </Text>
                        {renderStatusIndicator(contractStatus)}
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
                );
            }

            // campaigns
            return (
                <>
                    <Pressable
                        onPress={handleCardPress}
                        style={({ pressed }) => [
                            styles.creditsRowTop,
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
                        {renderStatusIndicator(campaignStatus)}
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
        creditsRowTop: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
            minHeight: 28,
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
        creditsInvitesText: {
            flex: 1,
            fontSize: 14,
            color: colors.drawerText,
            fontWeight: "500",
        },
        creditsMonthly: {
            fontSize: 11,
            color: colors.drawerTextMuted,
            marginLeft: 8,
        },
        statusDot: {
            width: 10,
            height: 10,
            borderRadius: 999,
            marginLeft: 8,
        },
        statusDotWarning: {
            backgroundColor: colors.planBadgeProBg,
            borderWidth: 1,
            borderColor: colors.yellow,
        },
        statusDotCritical: {
            backgroundColor: colors.errorBannerBg,
            borderWidth: 1,
            borderColor: colors.red,
            alignItems: "center",
            justifyContent: "center",
        },
        statusDotCriticalText: {
            color: colors.red,
            fontSize: 8,
            fontWeight: "800",
            lineHeight: 8,
        },
    });
};

export default CreditDisplayCard;

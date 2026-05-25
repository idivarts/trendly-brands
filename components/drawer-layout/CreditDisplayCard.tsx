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

        const renderRefillFooter = () => {
            if (hideRefill || Platform.OS !== "web") return null;
            return (
                <Pressable
                    onPress={handleRefillPress}
                    hitSlop={8}
                    style={({ pressed }) => [
                        styles.refillFooterButton,
                        pressed && styles.refillButtonPressed,
                    ]}
                >
                    <Text style={styles.refillLink}>REFILL</Text>
                </Pressable>
            );
        };

        const renderCreditRow = ({
            label,
            count,
            icon,
            iconColor,
            status,
            meta,
        }: {
            label: string;
            count: number;
            icon: any;
            iconColor: string;
            status: CreditStatus;
            meta?: string;
        }) => (
            <Pressable
                onPress={handleCardPress}
                style={({ pressed }) => [
                    styles.creditRowCard,
                    pressed && styles.creditsCardPressed,
                ]}
            >
                <RNView style={styles.creditRowLeft}>
                    <FontAwesomeIcon
                        icon={icon}
                        size={18}
                        color={iconColor}
                        style={styles.creditsIcon}
                    />
                    <RNView style={styles.creditTextWrap}>
                        <Text style={styles.creditPrimaryText}>
                            {count} {label}
                        </Text>
                        {!!meta && (
                            <Text style={styles.creditSecondaryText}>
                                {meta}
                            </Text>
                        )}
                    </RNView>
                </RNView>
                {renderStatusIndicator(status)}
            </Pressable>
        );

        const renderCardContent = () => {
            if (creditContext === "discovery") {
                return (
                    <>
                        {renderCreditRow({
                            label: "Discovery",
                            count: discoverCoinsLeft,
                            icon: faGemSolid,
                            iconColor: colors.gold,
                            status: discoveryStatus,
                        })}
                        {renderCreditRow({
                            label: "Invites",
                            count: connectionCreditsLeft,
                            icon: faBolt,
                            iconColor: colors.drawerInvitesIcon,
                            status: inviteStatus,
                            meta: "Monthly refresh",
                        })}
                        {renderRefillFooter()}
                    </>
                );
            }

            if (creditContext === "contracts") {
                return (
                    <>
                        {renderCreditRow({
                            label: "Contracts",
                            count: contractCredits,
                            icon: faFileContract,
                            iconColor: colors.gold,
                            status: contractStatus,
                        })}
                        {renderRefillFooter()}
                    </>
                );
            }

            // campaigns
            return (
                <>
                    {renderCreditRow({
                        label: "Create campaign",
                        count: collaborationCredits,
                        icon: faDiagramProject,
                        iconColor: colors.gold,
                        status: campaignStatus,
                    })}
                    {renderRefillFooter()}
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
            backgroundColor: (colors as any).drawerCardBg ?? colors.drawerCardBg,
            borderRadius: 12,
            padding: 12,
            marginHorizontal: 8,
            gap: 8,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: (colors as any).drawerBorder ?? "transparent",
        },
        creditsCardPressed: {
            opacity: 0.9,
        },
        creditRowCard: {
            minHeight: 42,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            backgroundColor: colors.glassSurface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.drawerBorder,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        creditRowLeft: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            marginRight: 8,
        },
        creditTextWrap: {
            flex: 1,
        },
        creditsIcon: {
            marginRight: 8,
        },
        creditPrimaryText: {
            fontSize: 14,
            color: (colors as any).drawerText ?? colors.text,
            fontWeight: "600",
        },
        creditSecondaryText: {
            marginTop: 2,
            fontSize: 11,
            color: (colors as any).drawerTextMuted ?? colors.drawerTextMuted,
        },
        refillFooterButton: {
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 6,
            alignSelf: "flex-end",
        },
        refillButtonPressed: {
            backgroundColor: (colors as any).drawerActiveBg ?? colors.glassSurface,
        },
        refillLink: {
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 0.5,
            color: (colors as any).drawerTextMuted ?? colors.aliceBlue,
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

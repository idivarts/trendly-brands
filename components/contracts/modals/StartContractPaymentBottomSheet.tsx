import { CURRENCY } from "@/constants/Unit";
import Colors from "@/shared-uis/constants/Colors";
import ImageComponent from "@/shared-uis/components/image-component";
import { truncateText } from "@/shared-uis/utils/text";
import { faCheck, faShield } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import ContractActionOverlay from "../ContractActionOverlay";

export interface StartContractPaymentBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    onPayNow: () => void;
    payNowLoading: boolean;
    influencerName: string;
    influencerHandle?: string | null;
    influencerProfileImageUrl?: string;
    collaborationTitle: string;
    contractBudgetLabel: string;
    paymentAmountLabel: string;
}

const summaryRowStyles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 10,
    },
    label: {
        fontSize: 15,
        fontWeight: "700",
        flexShrink: 0,
    },
    value: {
        fontSize: 15,
        flex: 1,
        textAlign: "right",
    },
    valueBold: {
        fontWeight: "700",
    },
});

function SummaryRow({
    label,
    value,
    valueBold,
    colors,
}: {
    label: string;
    value: string;
    valueBold?: boolean;
    colors: ReturnType<typeof Colors>;
}) {
    return (
        <View style={summaryRowStyles.row}>
            <Text style={[summaryRowStyles.label, { color: colors.text }]}>{label}</Text>
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                    summaryRowStyles.value,
                    { color: colors.text },
                    valueBold && summaryRowStyles.valueBold,
                ]}
            >
                {value}
            </Text>
        </View>
    );
}

const StartContractPaymentBottomSheet: React.FC<StartContractPaymentBottomSheetProps> = ({
    visible,
    onClose,
    onPayNow,
    payNowLoading,
    influencerName,
    influencerHandle,
    influencerProfileImageUrl,
    collaborationTitle,
    contractBudgetLabel,
    paymentAmountLabel,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const collaborationDisplay = useMemo(
        () => truncateText(collaborationTitle || "—", 36),
        [collaborationTitle]
    );

    const content = (
        <View style={styles.container}>
            <View style={styles.grabHandle} />

            <View style={styles.shieldWrap}>
                <FontAwesomeIcon icon={faShield} size={44} color={colors.secondary} />
                <View style={styles.checkOnShield}>
                    <FontAwesomeIcon icon={faCheck} size={16} color={colors.white} />
                </View>
            </View>

            <View style={styles.payNowBadge}>
                <Text style={styles.payNowBadgeText}>PAY NOW</Text>
            </View>

            <Text style={styles.title}>You are about to start the contract</Text>

            <Text style={styles.bodyText}>
                {`Don't worry, your money is not paid upfront to the influencers. We collect the money on your behalf and send it to the influencer once they deliver the content.`}
            </Text>

            <View style={styles.influencerRow}>
                <ImageComponent
                    url={influencerProfileImageUrl || ""}
                    altText={influencerName}
                    initials={influencerName}
                    shape="circle"
                    size="medium"
                    style={styles.avatar}
                />
                <View style={styles.influencerTextCol}>
                    <Text style={styles.influencerName}>{influencerName}</Text>
                    {influencerHandle ? (
                        <Text style={styles.influencerHandle}>{influencerHandle}</Text>
                    ) : null}
                </View>
            </View>

            <View style={styles.summaryBlock}>
                <SummaryRow
                    label="Collaboration"
                    value={collaborationDisplay}
                    colors={colors}
                />
                <SummaryRow
                    label="Contract Budget"
                    value={contractBudgetLabel}
                    valueBold
                    colors={colors}
                />
                <SummaryRow
                    label="Payment amount"
                    value={paymentAmountLabel}
                    valueBold
                    colors={colors}
                />
            </View>

            <Button
                mode="contained"
                onPress={onPayNow}
                loading={payNowLoading}
                disabled={payNowLoading}
                buttonColor={colors.green}
                textColor={colors.white}
                style={styles.payButton}
                contentStyle={styles.payButtonContent}
                labelStyle={styles.payButtonLabel}
            >
                Pay Now
            </Button>
        </View>
    );

    return (
        <ContractActionOverlay
            visible={visible}
            onClose={onClose}
            mode="auto"
            snapPointsRange={["55%", "92%"]}
            modalMaxWidth={520}
        >
            {content}
        </ContractActionOverlay>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: {
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 28,
        },
        grabHandle: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.gray300,
            alignSelf: "center",
            marginBottom: 16,
        },
        shieldWrap: {
            alignSelf: "center",
            marginBottom: 12,
            position: "relative",
            width: 52,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
        },
        checkOnShield: {
            position: "absolute",
            alignSelf: "center",
            top: "38%",
        },
        payNowBadge: {
            alignSelf: "center",
            backgroundColor: colors.yellow,
            paddingHorizontal: 18,
            paddingVertical: 6,
            borderRadius: 20,
            marginBottom: 14,
        },
        payNowBadgeText: {
            color: colors.white,
            fontWeight: "800",
            fontSize: 12,
            letterSpacing: 0.6,
        },
        title: {
            fontSize: 20,
            fontWeight: "800",
            color: colors.text,
            textAlign: "center",
            marginBottom: 12,
            lineHeight: 26,
        },
        bodyText: {
            fontSize: 15,
            lineHeight: 22,
            color: colors.gray100,
            marginBottom: 20,
        },
        influencerRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
        },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
        },
        influencerTextCol: {
            flex: 1,
            minWidth: 0,
        },
        influencerName: {
            fontSize: 17,
            fontWeight: "700",
            color: colors.text,
        },
        influencerHandle: {
            fontSize: 14,
            color: colors.gray300,
            marginTop: 2,
        },
        summaryBlock: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: colors.budgetCardBorder,
            marginBottom: 20,
            marginTop: 8,
        },
        payButton: {
            borderRadius: 10,
        },
        payButtonContent: {
            paddingVertical: 10,
        },
        payButtonLabel: {
            fontSize: 16,
            fontWeight: "700",
        },
    });
}

export function formatContractMoneyLabel(amount: number | null | undefined): string {
    if (amount == null || Number.isNaN(Number(amount))) {
        return "—";
    }
    return `${CURRENCY} ${Number(amount).toLocaleString("en-IN")}`;
}

export function formatInfluencerHandleFromUser(primarySocial?: string | null): string | null {
    const raw = primarySocial?.trim();
    if (!raw) return null;
    if (raw.startsWith("@")) return raw;
    const ig = raw.match(/instagram\.com\/([^/?#]+)/i);
    if (ig?.[1]) {
        return `@${ig[1]}`;
    }
    return `@${raw.replace(/^@/, "")}`;
}

export default StartContractPaymentBottomSheet;

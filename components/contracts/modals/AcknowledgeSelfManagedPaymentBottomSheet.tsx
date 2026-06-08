import ImageComponent from "@/shared-uis/components/image-component";
import Colors from "@/shared-uis/constants/Colors";
import { truncateText } from "@/shared-uis/utils/text";
import { faHandshakeAngle, faSquare } from "@fortawesome/free-solid-svg-icons";
import { faSquareCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import ContractActionOverlay from "../ContractActionOverlay";

export interface AcknowledgeSelfManagedPaymentBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    confirmLoading: boolean;
    influencerName: string;
    influencerHandle?: string | null;
    influencerProfileImageUrl?: string;
    collaborationTitle: string;
    contractBudgetLabel: string;
}

const AcknowledgeSelfManagedPaymentBottomSheet: React.FC<
    AcknowledgeSelfManagedPaymentBottomSheetProps
> = ({
    visible,
    onClose,
    onConfirm,
    confirmLoading,
    influencerName,
    influencerHandle,
    influencerProfileImageUrl,
    collaborationTitle,
    contractBudgetLabel,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [acknowledged, setAcknowledged] = useState(false);

    const collaborationDisplay = useMemo(
        () => truncateText(collaborationTitle || "—", 36),
        [collaborationTitle]
    );

    const content = (
        <View style={styles.container}>
            <View style={styles.grabHandle} />

            <View style={styles.iconWrap}>
                <FontAwesomeIcon icon={faHandshakeAngle} size={40} color={colors.primary} />
            </View>

            <Text style={styles.title}>Start contract with off-platform payment</Text>

            <Text style={styles.bodyText}>
                Trendly does not process payments in your region. By continuing, you and
                the creator agree to handle compensation directly between yourselves —
                fairly, locally, and ethically. Trendly will not collect, hold, or transfer
                any money for this contract.
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
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Collaboration</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                        {collaborationDisplay}
                    </Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Agreed amount</Text>
                    <Text style={[styles.summaryValue, styles.summaryValueBold]} numberOfLines={1}>
                        {contractBudgetLabel}
                    </Text>
                </View>
                <Text style={styles.amountNote}>
                    Settled directly between you and the creator.
                </Text>
            </View>

            <Pressable
                style={styles.checkRow}
                onPress={() => setAcknowledged((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acknowledged }}
            >
                <FontAwesomeIcon
                    icon={acknowledged ? faSquareCheck : faSquare}
                    size={20}
                    color={acknowledged ? colors.primary : colors.gray300}
                />
                <Text style={styles.checkLabel}>
                    I understand Trendly does not handle this payment, and we will settle it
                    directly and ethically.
                </Text>
            </Pressable>

            <Button
                mode="contained"
                onPress={onConfirm}
                loading={confirmLoading}
                disabled={confirmLoading || !acknowledged}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                style={styles.confirmButton}
                contentStyle={styles.confirmButtonContent}
                labelStyle={styles.confirmButtonLabel}
            >
                Acknowledge & Start Contract
            </Button>
        </View>
    );

    return (
        <ContractActionOverlay
            visible={visible}
            onClose={onClose}
            mode="auto"
            snapPointsRange={["60%", "92%"]}
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
        iconWrap: {
            alignSelf: "center",
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
            marginBottom: 14,
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
            backgroundColor: colors.tag,
            borderRadius: 12,
            padding: 14,
            marginBottom: 18,
            marginTop: 8,
        },
        summaryRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingVertical: 6,
        },
        summaryLabel: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
            flexShrink: 0,
        },
        summaryValue: {
            fontSize: 15,
            color: colors.text,
            flex: 1,
            textAlign: "right",
        },
        summaryValueBold: {
            fontWeight: "700",
        },
        amountNote: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 6,
        },
        checkRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 20,
        },
        checkLabel: {
            flex: 1,
            fontSize: 13,
            lineHeight: 19,
            color: colors.text,
        },
        confirmButton: {
            borderRadius: 10,
        },
        confirmButtonContent: {
            paddingVertical: 10,
        },
        confirmButtonLabel: {
            fontSize: 16,
            fontWeight: "700",
        },
    });
}

export default AcknowledgeSelfManagedPaymentBottomSheet;

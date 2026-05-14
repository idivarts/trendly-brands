import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import ContractActionOverlay from "../ContractActionOverlay";

export interface KycBlockedStartContractModalProps {
    visible: boolean;
    onClose: () => void;
}

const KycBlockedStartContractModal: React.FC<KycBlockedStartContractModalProps> = ({
    visible,
    onClose,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Defensive: in case this is rendered from an unexpected code path
    // we still keep it user-friendly and closeable.
    const handleUnderstood = () => {
        try {
            onClose();
        } catch {
            Toaster.error("Failed to close modal");
        }
    };

    return (
        <ContractActionOverlay
            visible={visible}
            onClose={onClose}
            mode="modal"
            modalMaxWidth={520}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Influencer not verified</Text>
                <Text style={styles.body}>
                    Please wait for the influencer to complete their verification before starting the contract.
                </Text>
                <View style={styles.actions}>
                    <Button mode="contained" style={styles.button} onPress={handleUnderstood}>
                        Understood
                    </Button>
                </View>
            </View>
        </ContractActionOverlay>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: {
            padding: 20,
            paddingBottom: 28,
            backgroundColor: colors.background,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 8,
        },
        body: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.gray100 ?? colors.text,
            marginBottom: 16,
        },
        actions: {
            flexDirection: "row",
            justifyContent: "flex-end",
        },
        button: {
            minWidth: 140,
        },
    });
}

export default KycBlockedStartContractModal;


import { useBreakpoints } from "@/hooks";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";

import { Text, View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import ImageComponent from "@/shared-uis/components/image-component";
import { Modal } from "react-native-paper";

interface ManagerModalProps {
    managerName: string;
    managerEmail: string;
    brandDescription: string;
    managerImage: string;
    visible: boolean;
    setVisibility: (visible: boolean) => void;
}

const MAX_MODAL_WIDTH = 420;

const ManagerModal: React.FC<ManagerModalProps> = ({
    managerName,
    managerEmail,
    brandDescription,
    managerImage,
    visible,
    setVisibility,
}) => {
    const theme = useTheme();
    const { xl, width } = useBreakpoints();
    const styles = useStyles(theme, xl, width);

    return (
        <Modal
            visible={visible}
            onDismiss={() => setVisibility(false)}
            contentContainerStyle={styles.modalContent}
        >
            <View style={styles.centerColumn}>
                <ImageComponent
                    url={managerImage}
                    altText={managerName}
                    shape="circle"
                    size="medium"
                    style={styles.managerImage}
                    initials={managerName}
                    initialsSize={40}
                />

                <Text style={styles.managerName}>
                    {managerName}
                </Text>

                <Text style={styles.brandDescription}>
                    {brandDescription}
                </Text>

                <View style={styles.emailRow}>
                    <Text style={styles.emailText}>
                        Email: {managerEmail}
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

function useStyles(
    theme: ReturnType<typeof useTheme>,
    xl: boolean,
    bpWidth: number
) {
    const isWeb = Platform.OS === "web";
    const modalWidth = isWeb
        ? Math.min(MAX_MODAL_WIDTH, bpWidth - 48)
        : Math.max(0, bpWidth - 40);
    return StyleSheet.create({
        modalContent: {
            backgroundColor: Colors(theme).background,
            borderRadius: 10,
            padding: 20,
            marginHorizontal: xl ? 24 : 20,
            maxWidth: MAX_MODAL_WIDTH,
            width: modalWidth,
            alignSelf: "center",
        },
        centerColumn: {
            alignItems: "center",
            gap: 20,
        },
        managerImage: {
            width: 120,
            height: 120,
            borderRadius: 240,
        },
        managerName: {
            fontSize: 24,
            fontWeight: "bold",
            color: Colors(theme).text,
            textAlign: "center",
        },
        brandDescription: {
            fontSize: 16,
            color: Colors(theme).text,
            textAlign: "center",
        },
        emailRow: {
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
        },
        emailText: {
            fontSize: 16,
            color: Colors(theme).text,
        },
    });
}

export default ManagerModal;

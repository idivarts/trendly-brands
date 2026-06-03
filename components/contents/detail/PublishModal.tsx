import { ISocialAccount } from "@/contexts/brand-social-context.provider";
import { ScheduleMode, SocialDestination } from "@/components/contents/types";
import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { faPaperPlane, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ScheduleBar from "./ScheduleBar";

// ─── PublishModal ─────────────────────────────────────────────────────────────
// Wraps the Send-to / When controls (ScheduleBar) in a focused modal opened from
// the header Publish button, so destination + schedule choices stay off the page.

export interface PublishModalProps {
    visible: boolean;
    onClose: () => void;
    socialAccounts: ISocialAccount[];
    destinations: SocialDestination[];
    onDestinationsChange: (next: SocialDestination[]) => void;
    scheduleMode: ScheduleMode;
    onScheduleModeChange: (m: ScheduleMode) => void;
    formattedDate: string;
    onPressDate: () => void;
    timeOfPosting: string;
    onTimeChange: (t: string) => void;
    onPublish: () => void;
    publishing: boolean;
}

const PublishModal: React.FC<PublishModalProps> = ({
    visible,
    onClose,
    ...scheduleProps
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close publish options"
                />
                <View style={styles.sheet} accessibilityViewIsModal>
                    <View style={styles.header}>
                        <View style={styles.headIcon}>
                            <FontAwesomeIcon icon={faPaperPlane} size={14} color={colors.primary} />
                        </View>
                        <View style={styles.headText}>
                            <Text style={styles.title}>Publish or schedule</Text>
                            <Text style={styles.subtitle}>Choose where and when to post</Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            hitSlop={8}
                        >
                            <FontAwesomeIcon icon={faXmark} size={16} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.body}
                        keyboardShouldPersistTaps="handled"
                    >
                        <ScheduleBar embedded alwaysEditing {...scheduleProps} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: xl ? "center" : "flex-end",
            padding: xl ? 20 : 0,
        },
        sheet: {
            width: "100%",
            maxWidth: 480,
            maxHeight: "88%",
            backgroundColor: colors.card,
            borderRadius: xl ? 18 : 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.18,
            elevation: 14,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 12,
        },
        headIcon: {
            width: 32,
            height: 32,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.aliceBlue,
        },
        headText: {
            flex: 1,
        },
        title: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
            marginTop: 1,
        },
        closeBtn: {
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        body: {
            paddingHorizontal: 18,
            paddingTop: 4,
            paddingBottom: 20,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default PublishModal;

import { Text, View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { BlurView } from "expo-blur";
import { Theme, useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    useWindowDimensions,
} from "react-native";

export interface CreditsCoachMarkLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CreditsCoachMarkProps {
    visible: boolean;
    highlightLayout: CreditsCoachMarkLayout | null;
    onDismiss: () => void;
}

const COACH_MESSAGE =
    "This is your credits card. Discovery credits are used when you view influencer profiles in Discovery. Invites are used to send collaboration requests. Tap REFILL to top up Discovery credits.";

const CreditsCoachMark: React.FC<CreditsCoachMarkProps> = ({
    visible,
    highlightLayout,
    onDismiss,
}) => {
    const theme = useTheme();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const styles = useMemo(
        () => createStyles(theme, screenWidth, screenHeight, highlightLayout),
        [theme, screenWidth, screenHeight, highlightLayout]
    );

    if (!visible) return null;

    const overlayContent = (
        <>
            {/* Cutout: four panels around the highlight so the credits card stays visible (hole in the middle) */}
            {highlightLayout && (
                <>
                    {Platform.OS === "web" ? (
                        <>
                            <View style={styles.cutoutTop} />
                            <View style={styles.cutoutLeft} />
                            <View style={styles.cutoutRight} />
                            <View style={styles.cutoutBottom} />
                        </>
                    ) : (
                        <>
                            <BlurView intensity={95} tint="dark" style={styles.cutoutTop} />
                            <BlurView intensity={95} tint="dark" style={styles.cutoutLeft} />
                            <BlurView intensity={95} tint="dark" style={styles.cutoutRight} />
                            <BlurView intensity={95} tint="dark" style={styles.cutoutBottom} />
                        </>
                    )}
                </>
            )}
            {/* Callout with message and Ok button - positioned to the right, with pointer to the card */}
            {highlightLayout && (
                <View style={styles.calloutContainer}>
                    {/* Pointer triangle pointing at the credit card (left) */}
                    <View style={styles.calloutPointer} />
                    <View style={styles.callout}>
                        <Text style={styles.calloutText}>{COACH_MESSAGE}</Text>
                        <Pressable
                            onPress={onDismiss}
                            style={({ pressed }) => [
                                styles.okButton,
                                pressed && styles.okButtonPressed,
                            ]}
                        >
                            <Text style={styles.okButtonText}>Ok</Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </>
    );

    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onDismiss}
            statusBarTranslucent
        >
            <View style={styles.root}>
                {overlayContent}
            </View>
        </Modal>
    );
};

const createStyles = (
    theme: Theme,
    screenWidth: number,
    screenHeight: number,
    layout: CreditsCoachMarkLayout | null
) => {
    const colors = Colors(theme);
    const x = layout?.x ?? 0;
    const y = layout?.y ?? 0;
    const w = layout?.width ?? 0;
    const h = layout?.height ?? 0;
    const padding = 16;
    const calloutGap = 16;
    const calloutMaxWidth = 240;

    return StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: "transparent",
        },
        cutoutTop: {
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            height: Math.max(0, y - padding),
            ...(Platform.OS === "web" && { backgroundColor: colors.backdropStrong }),
        },
        cutoutLeft: {
            position: "absolute",
            left: 0,
            top: y - padding,
            width: Math.max(0, x - padding),
            height: h + padding * 2,
            ...(Platform.OS === "web" && { backgroundColor: colors.backdropStrong }),
        },
        cutoutRight: {
            position: "absolute",
            left: x + w + padding,
            top: y - padding,
            right: 0,
            height: h + padding * 2,
            ...(Platform.OS === "web" && { backgroundColor: colors.backdropStrong }),
        },
        cutoutBottom: {
            position: "absolute",
            left: 0,
            top: y + h + padding,
            right: 0,
            bottom: 0,
            ...(Platform.OS === "web" && { backgroundColor: colors.backdropStrong }),
        },
        calloutContainer: {
            position: "absolute",
            left: x + w + calloutGap,
            top: y - 40,
            width: Math.min(calloutMaxWidth, screenWidth - (x + w + calloutGap + 16)),
            maxWidth: calloutMaxWidth,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
        },
        calloutPointer: {
            width: 0,
            height: 0,
            borderTopWidth: 10,
            borderBottomWidth: 10,
            borderRightWidth: 10,
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
            borderRightColor: colors.primary,
            marginRight: -1,
            backgroundColor: "transparent",
        },
        callout: {
            flex: 1,
            minWidth: 0,
            maxWidth: calloutMaxWidth - 20,
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            gap: 12,
        },
        calloutText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.onPrimary,
        },
        okButton: {
            alignSelf: "flex-end",
            backgroundColor: colors.drawerBannerButtonBg,
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 8,
        },
        okButtonPressed: {
            backgroundColor: colors.drawerBannerButtonPressed,
        },
        okButtonText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.onPrimary,
        },
    });
};

export default CreditsCoachMark;

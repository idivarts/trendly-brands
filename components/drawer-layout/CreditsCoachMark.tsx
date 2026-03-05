import { Text, View } from "@/components/theme/Themed";
import CoachMarkOverlay from "@/components/guide-tour/CoachMarkOverlay";
import Colors from "@/shared-uis/constants/Colors";
import { Theme, useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";

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
    buttonLabel?: string;
}

const COACH_MESSAGE =
    "This is your credits card. Discovery credits are used when you view influencer profiles in Discovery. Invites are used to send collaboration requests. Tap REFILL to top up Discovery credits.";

const CreditsCoachMark: React.FC<CreditsCoachMarkProps> = ({
    visible,
    highlightLayout,
    onDismiss,
    buttonLabel = "Ok",
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(theme), [theme]);

    const calloutContent = (
        <View style={styles.callout}>
            <Text style={styles.calloutText}>{COACH_MESSAGE}</Text>
            <Pressable
                onPress={onDismiss}
                style={({ pressed }) => [
                    styles.okButton,
                    pressed && styles.okButtonPressed,
                ]}
            >
                <Text style={styles.okButtonText}>{buttonLabel}</Text>
            </Pressable>
        </View>
    );

    return (
        <CoachMarkOverlay
            visible={visible}
            highlightLayout={highlightLayout}
            stepIndex={3}
            onRequestClose={onDismiss}
        >
            {calloutContent}
        </CoachMarkOverlay>
    );
};

const createStyles = (theme: Theme) => {
    const colors = Colors(theme);
    return StyleSheet.create({
        callout: {
            flex: 1,
            minWidth: 0,
            maxWidth: 240,
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

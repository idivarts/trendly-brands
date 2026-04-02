import { Text, View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";

interface TourCardProps {
    message: string;
    onSkip: () => void;
    onNext: () => void;
    isLastStep: boolean;
}

const TourCard: React.FC<TourCardProps> = ({
    message,
    onSkip,
    onNext,
    isLastStep,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.card}>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.buttonRow}>
                <Pressable
                    onPress={onSkip}
                    style={({ pressed }) => [
                        styles.skipButton,
                        pressed && styles.buttonPressed,
                    ]}
                >
                    <Text style={styles.skipButtonText}>Skip</Text>
                </Pressable>
                <Pressable
                    onPress={onNext}
                    style={({ pressed }) => [
                        styles.nextButton,
                        pressed && styles.buttonPressed,
                    ]}
                >
                    <Text style={styles.nextButtonText}>
                        {isLastStep ? "Done" : "Next"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => {
    const colors = Colors(theme);
    return StyleSheet.create({
        card: {
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            gap: 12,
            maxWidth: 280,
        },
        message: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.onPrimary,
        },
        buttonRow: {
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
            backgroundColor:"transparent"
        },
        skipButton: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: colors.drawerBannerButtonBg,
        },
        nextButton: {
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 8,
            backgroundColor: colors.drawerBannerButtonBg,
        },
        buttonPressed: {
            backgroundColor: colors.drawerBannerButtonPressed,
        },
        skipButtonText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.onPrimary,
        },
        nextButtonText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.onPrimary,
        },
    });
};

export default TourCard;

import AuthShowcase from "@/components/auth/AuthShowcase";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Full-bleed split-screen auth page.
 *  - Web (wide): left half = branded navy panel with the self-playing
 *    walkthrough; right half = the auth form on the theme surface. Edge to edge,
 *    no floating cards.
 *  - Mobile / narrow: only the right (form) half is shown, full screen.
 */
const AuthPageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const insets = useSafeAreaInsets();
    const { width } = useBreakpoints();
    const isWide = width >= 980;

    const styles = useMemo(() => makeStyles(colors, isWide, insets), [colors, isWide, insets]);

    return (
        <View style={styles.root}>
            {isWide && (
                <LinearGradient
                    colors={[colors.authPanel, colors.authPanelDeep]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.6, y: 1 }}
                    style={styles.leftHalf}
                >
                    <AuthShowcase />
                </LinearGradient>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.rightHalf}
            >
                <ScrollView
                    contentContainerStyle={styles.rightScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    <Animated.View entering={FadeIn.duration(260)} style={styles.formWrap}>
                        {children}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

function makeStyles(
    colors: ReturnType<typeof Colors>,
    isWide: boolean,
    insets: { top: number; bottom: number }
) {
    return StyleSheet.create({
        root: {
            flex: 1,
            flexDirection: isWide ? "row" : "column",
            backgroundColor: colors.background,
        },
        leftHalf: {
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 56,
            paddingVertical: 56,
        },
        rightHalf: {
            flex: 1,
            backgroundColor: colors.background,
        },
        rightScroll: {
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: isWide ? 56 : 24,
            paddingTop: Math.max(insets.top, isWide ? 48 : 32),
            paddingBottom: Math.max(insets.bottom, isWide ? 48 : 32),
        },
        formWrap: {
            width: "100%",
            maxWidth: 420,
        },
    });
}

/**
 * Shared content styles consumed by the auth screens (login / create-new-account
 * / forgot-password) for their form header, inputs, buttons and links.
 */
export const authLayoutStyles = {
    formTitle: {
        textAlign: "center" as const,
    },
    formSubtitle: {
        textAlign: "center" as const,
        opacity: 0.8,
        marginBottom: 10,
    },
    formHeader: {
        marginBottom: 8,
    },
    inputStack: {
        gap: 14,
    },
    primaryButton: {
        marginTop: 16,
        borderRadius: 14,
    },
    loginPrompt: {
        marginTop: 16,
        alignItems: "center" as const,
    },
    loginText: {
        opacity: 0.8,
    },
    secondaryButton: {
        marginTop: 8,
        borderRadius: 14,
    },
    forgotPassword: {
        textAlign: "center" as const,
    },
    backText: {
        opacity: 0.7,
        marginTop: 12,
        textAlign: "center" as const,
    },
} as const;

export default AuthPageLayout;

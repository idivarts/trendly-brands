import TermsAndCondition from "@/components/TermsAndCondition";
import BottomSheetScrollContainer from "@/components/ui/bottom-sheet/BottomSheetWithScroll";
import { useAppleLogin } from "@/utils/use-apple-login";
import { useGoogleLogin } from "@/utils/use-google-login";
import { faApple, faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/shared-uis/constants/Colors";

const GOOGLE_LABEL = "Continue with Google";
const APPLE_LABEL = "Continue with Apple";

/**
 * Social provider buttons + terms. Self-contained (owns the login hooks) so it
 * can be dropped into either the /pre-signin route card or the in-page
 * lets-start modal. The email/password path lives in the email-first form above
 * this (see AuthCard); these are the secondary "or continue with" options.
 */
const AuthOptions: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [termsVisible, setTermsVisible] = useState(false);

    const { googleLogin } = useGoogleLogin(setLoading, setError);
    const { appleLogin } = useAppleLogin(setLoading, setError);
    const showApple = useMemo(() => Platform.OS === "ios", []);

    return (
        <>
            <View style={styles.buttonStack}>
                <Pressable
                    onPress={googleLogin}
                    disabled={loading}
                    style={[styles.providerButton, { opacity: loading ? 0.6 : 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel={GOOGLE_LABEL}
                >
                    <FontAwesomeIcon icon={faGoogle} size={20} color={colors.text} />
                    <Text style={styles.providerLabel}>{GOOGLE_LABEL}</Text>
                </Pressable>

                {showApple && (
                    <Pressable
                        onPress={appleLogin}
                        disabled={loading}
                        style={[styles.providerButton, { opacity: loading ? 0.6 : 1 }]}
                        accessibilityRole="button"
                        accessibilityLabel={APPLE_LABEL}
                    >
                        <FontAwesomeIcon icon={faApple} size={20} color={colors.text} />
                        <Text style={styles.providerLabel}>{APPLE_LABEL}</Text>
                    </Pressable>
                )}
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Text style={styles.termsText}>
                By proceeding to signup, you agree to{" "}
                <Text style={styles.termsLink} onPress={() => setTermsVisible(true)}>
                    Terms & Condition (EULA)
                </Text>{" "}
                of Trendly
            </Text>

            <BottomSheetScrollContainer
                isVisible={termsVisible}
                snapPointsRange={["85%", "85%"]}
                onClose={() => setTermsVisible(false)}
            >
                <TermsAndCondition />
            </BottomSheetScrollContainer>
        </>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        buttonStack: {
            gap: 12,
        },
        providerButton: {
            height: 52,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: colors.tag,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            ...Platform.select({ android: { elevation: 1 } }),
        },
        providerLabel: {
            fontSize: 16,
            fontWeight: "600",
            letterSpacing: 0.2,
            color: colors.text,
        },
        errorText: {
            marginTop: 12,
            textAlign: "center",
            fontSize: 14,
            color: colors.errorBannerText,
        },
        termsText: {
            marginTop: 22,
            fontSize: 12,
            lineHeight: 18,
            textAlign: "center",
            color: colors.gray100,
        },
        termsLink: {
            textDecorationLine: "underline",
            color: colors.primary,
        },
    });
}

export default AuthOptions;

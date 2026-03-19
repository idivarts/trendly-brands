import AuthPageLayout, {
    authLayoutStyles,
    SHORT_VIEWPORT_MAX_HEIGHT,
} from "@/components/auth/AuthPageLayout";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import fnStyles from "@/styles/signup.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Text, View } from "react-native";

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState("");
    const router = useRouter();
    const theme = useTheme();
    const { height } = useBreakpoints();
    const styles = fnStyles(theme);
    const shortViewport = height < SHORT_VIEWPORT_MAX_HEIGHT;
    const compactOverrides = useMemo(
        () =>
            shortViewport
                ? {
                      logo: { marginTop: 4, width: 64, height: 64 },
                      title: { marginBottom: 6, fontSize: 19 },
                      subTitle: { marginBottom: 6 },
                      formHeader: { minHeight: 36 },
                      inputContainer: { marginBottom: 4, paddingHorizontal: 0 },
                      inputStack: { gap: 2 },
                      input: { marginBottom: 4 },
                      primaryButton: { marginTop: 4 },
                      loginPrompt: { marginTop: 4 },
                      secondaryButton: { marginTop: 2 },
                  }
                : null,
        [shortViewport]
    );

    const handleResetPassword = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address");
            return;
        }

        try {
            await HttpWrapper.fetch(
                "/onboard/reset-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                }
            );
            Toaster.success("Password reset email sent successfully");
            router.replace("/(auth)/login");
        } catch (error) {
            if (error instanceof Response) {
                let message = `Request failed (${error.status})`;

                try {
                    const data = await error.json();
                    if (data?.message) {
                        message = data.message;
                    }
                } catch {
                    // ignore JSON parsing errors
                }

                Toaster.error(message);
            } else {
                Toaster.error("Something went wrong. Please try again.");
            }
        }
    };

    return (
        <AuthPageLayout>
            <Image
                source={require("@/assets/images/logo.png")}
                style={[styles.logo, compactOverrides?.logo]}
                resizeMode="contain"
            />
            <View style={[authLayoutStyles.formHeader, compactOverrides?.formHeader]}>
                <Text style={[styles.title, authLayoutStyles.formTitle, compactOverrides?.title]}>
                    Forgot Password
                </Text>
                <Text style={[styles.subTitle, authLayoutStyles.formSubtitle, compactOverrides?.subTitle]}>
                    We will email you a reset link.
                </Text>
            </View>
            <View style={[styles.inputContainer, authLayoutStyles.inputStack, compactOverrides?.inputContainer, compactOverrides?.inputStack]}>
                <TextInput
                    autoCapitalize="none"
                    label="Enter your Email ID"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    textColor={Colors(theme).text}
                    style={[styles.input, compactOverrides?.input]}
                    theme={{ colors: { primary: Colors(theme).text } }}
                />
                <Button
                    mode="contained"
                    style={[authLayoutStyles.primaryButton, compactOverrides?.primaryButton]}
                    onPress={handleResetPassword}
                >
                    Reset Password
                </Button>
            </View>
            <View style={[authLayoutStyles.loginPrompt, compactOverrides?.loginPrompt]}>
                <Text style={[styles.loginText, authLayoutStyles.loginText]}>
                    Remember your password?
                </Text>
                <Button
                    mode="outlined"
                    style={[authLayoutStyles.secondaryButton, compactOverrides?.secondaryButton]}
                    onPress={() => router.replace("/(auth)/login")}
                >
                    Login
                </Button>
            </View>
        </AuthPageLayout>
    );
};

export default ForgotPasswordScreen;

import AuthPageLayout, { authLayoutStyles } from "@/components/auth/AuthPageLayout";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/shared-uis/constants/Colors";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import fnStyles from "@/styles/signup.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, View } from "react-native";

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState("");
    const router = useRouter();
    const theme = useTheme();
    const styles = fnStyles(theme);

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
                style={styles.logo}
                resizeMode="contain"
            />
            <View style={authLayoutStyles.formHeader}>
                <Text style={[styles.title, authLayoutStyles.formTitle]}>
                    Forgot Password
                </Text>
                <Text style={[styles.subTitle, authLayoutStyles.formSubtitle]}>
                    We will email you a reset link.
                </Text>
            </View>
            <View style={[styles.inputContainer, authLayoutStyles.inputStack]}>
                <TextInput
                    autoCapitalize="none"
                    label="Enter your Email ID"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    textColor={Colors(theme).text}
                    style={styles.input}
                    theme={{ colors: { primary: Colors(theme).text } }}
                />
                <Button
                    mode="contained"
                    style={authLayoutStyles.primaryButton}
                    onPress={handleResetPassword}
                >
                    Reset Password
                </Button>
            </View>
            <View style={authLayoutStyles.loginPrompt}>
                <Text style={[styles.loginText, authLayoutStyles.loginText]}>
                    Remember your password?
                </Text>
                <Button
                    mode="outlined"
                    style={authLayoutStyles.secondaryButton}
                    onPress={() => router.replace("/(auth)/login")}
                >
                    Login
                </Button>
            </View>
        </AuthPageLayout>
    );
};

export default ForgotPasswordScreen;

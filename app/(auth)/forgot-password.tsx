import AuthHeader from "@/components/auth/AuthHeader";
import AuthNavLink from "@/components/auth/AuthNavLink";
import AuthPageLayout, { authLayoutStyles } from "@/components/auth/AuthPageLayout";
import AuthTextField from "@/components/auth/AuthTextField";
import Button from "@/components/ui/button";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState("");
    const router = useRouter();

    const goBackToLogin = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(auth)/login");
        }
    };

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
            <AuthHeader
                title="Forgot Password"
                subtitle="We will email you a reset link."
                onBack={goBackToLogin}
            />
            <View style={authLayoutStyles.inputStack}>
                <AuthTextField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    placeholder="Enter your email ID"
                />
                <Button
                    mode="contained"
                    style={authLayoutStyles.primaryButton}
                    labelStyle={authLayoutStyles.primaryButtonLabel}
                    onPress={handleResetPassword}
                >
                    Reset Password
                </Button>
            </View>
            <View style={authLayoutStyles.navStack}>
                <AuthNavLink
                    prompt="Remember your password?"
                    action="Back to log in"
                    onPress={() => router.replace("/(auth)/login")}
                />
            </View>
        </AuthPageLayout>
    );
};

export default ForgotPasswordScreen;

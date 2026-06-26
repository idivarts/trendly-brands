import AuthHeader from "@/components/auth/AuthHeader";
import AuthNavLink from "@/components/auth/AuthNavLink";
import AuthPageLayout, { authLayoutStyles } from "@/components/auth/AuthPageLayout";
import AuthTextField from "@/components/auth/AuthTextField";
import Button from "@/components/ui/button";
import { useAuthContext } from "@/contexts";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

const SignUpScreen = () => {
    const search = useLocalSearchParams();
    const [name, setName] = useState("");
    const [email, setEmail] = useState((search.email as string) || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [verificationSent, setVerificationSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useMyNavigation();
    const { signUp } = useAuthContext();

    // Carried over from pre-signin: the email was already verified as NOT having
    // an account, so it's prefilled and locked here. Changing it would desync
    // from that check — the user goes back to pre-signin to start over.
    const emailLocked = search.locked === "1";

    const goBackToSocial = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.resetAndNavigate("/pre-signin");
        }
    };

    const handleSignUp = async () => {
        setIsSubmitting(true);
        try {
            const success = await signUp(name, email, password);
            if (success) {
                setVerificationSent(true);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (verificationSent) {
        return (
            <AuthPageLayout>
                <AuthHeader
                    title="Verification Email Sent"
                    subtitle={`We've sent a verification email to ${email}. Open your inbox and click the link to activate your account.`}
                />
                <View style={authLayoutStyles.inputStack}>
                    <Button
                        mode="contained"
                        style={authLayoutStyles.primaryButton}
                        labelStyle={authLayoutStyles.primaryButtonLabel}
                        onPress={() => router.replace("/(auth)/login")}
                    >
                        Go to Login
                    </Button>
                    <Button
                        mode="outlined"
                        style={authLayoutStyles.primaryButton}
                        onPress={() => setVerificationSent(false)}
                    >
                        Back to Sign Up
                    </Button>
                </View>
            </AuthPageLayout>
        );
    }

    return (
        <AuthPageLayout>
            <AuthHeader
                title="Create your brand"
                subtitle="Use your work email to create a Trendly brand account"
                onBack={goBackToSocial}
            />
            <View style={authLayoutStyles.inputStack}>
                <AuthTextField
                    label="Work Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    placeholder="you@company.com"
                    locked={emailLocked}
                    onSubmitEditing={handleSignUp}
                    returnKeyType="next"
                />
                <AuthTextField
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                    textContentType="name"
                    onSubmitEditing={handleSignUp}
                    returnKeyType="next"
                />
                <AuthTextField
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                    onSubmitEditing={handleSignUp}
                    returnKeyType="next"
                />
                <AuthTextField
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                    onSubmitEditing={handleSignUp}
                    returnKeyType="go"
                />
                <Button
                    mode="contained"
                    style={authLayoutStyles.primaryButton}
                    labelStyle={authLayoutStyles.primaryButtonLabel}
                    onPress={handleSignUp}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                >
                    Create Account
                </Button>
            </View>
            <View style={authLayoutStyles.navStack}>
                <AuthNavLink
                    prompt="Already have an account?"
                    action="Log in"
                    onPress={() => router.replace("/(auth)/login")}
                />
                {emailLocked && (
                    <AuthNavLink
                        prompt="Not your email?"
                        action="Go back"
                        onPress={goBackToSocial}
                    />
                )}
            </View>
        </AuthPageLayout>
    );
};

export default SignUpScreen;

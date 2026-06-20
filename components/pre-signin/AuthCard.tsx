import AuthDivider from "@/components/auth/AuthDivider";
import AuthHeader from "@/components/auth/AuthHeader";
import { authLayoutStyles } from "@/components/auth/AuthPageLayout";
import AuthTextField from "@/components/auth/AuthTextField";
import AuthOptions from "@/components/pre-signin/AuthOptions";
import Button from "@/components/ui/button";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

const TITLE = "Get Started with Trendly";
const SUBTITLE = "Plan, create, and manage your brand's social content in one calm space.";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The auth surface for /pre-signin (and the in-page card on the lets-start AI
 * page). Email-first: the user enters their email, we ask the backend whether a
 * manager account already exists, and route to login (exists) or
 * create-new-account (new) with the email carried over and locked. Social
 * providers sit below as the secondary path.
 */
const AuthCard: React.FC = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [checking, setChecking] = useState(false);

    const handleContinue = async () => {
        const trimmed = email.trim();
        if (!EMAIL_REGEX.test(trimmed)) {
            Toaster.error("Please enter a valid email address.");
            return;
        }

        setChecking(true);
        try {
            const response = await HttpWrapper.fetch("/onboard/check-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmed }),
            });
            const data = await response.json();

            router.push({
                pathname: data?.exists ? "/login" : "/create-new-account",
                params: { email: trimmed, locked: "1" },
            });
        } catch (error) {
            const message = await HttpWrapper.extractErrorMessage(error);
            Toaster.error(message || "Couldn't verify that email. Please try again.");
        } finally {
            setChecking(false);
        }
    };

    return (
        <View style={styles.container}>
            <AuthHeader title={TITLE} subtitle={SUBTITLE} />

            <View style={authLayoutStyles.inputStack}>
                <AuthTextField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    placeholder="you@company.com"
                    onSubmitEditing={handleContinue}
                    returnKeyType="next"
                />
                <Button
                    mode="contained"
                    style={authLayoutStyles.primaryButton}
                    labelStyle={authLayoutStyles.primaryButtonLabel}
                    onPress={handleContinue}
                    disabled={checking}
                    loading={checking}
                >
                    Continue
                </Button>
            </View>

            <View style={styles.dividerWrap}>
                <AuthDivider />
            </View>

            <AuthOptions />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    dividerWrap: {
        marginTop: 24,
        marginBottom: 20,
    },
});

export default AuthCard;

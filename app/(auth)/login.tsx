import AuthHeader from "@/components/auth/AuthHeader";
import AuthNavLink from "@/components/auth/AuthNavLink";
import AuthPageLayout, { authLayoutStyles } from "@/components/auth/AuthPageLayout";
import AuthTextField from "@/components/auth/AuthTextField";
import Button from "@/components/ui/button";
import { useAuthContext } from "@/contexts";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

const LoginScreen = () => {
    const search = useLocalSearchParams()
    const [email, setEmail] = useState(search.email as string || "");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { signIn } = useAuthContext();

    const goBackToSocial = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/pre-signin");
        }
    };

    const handleSignIn = () => {
        signIn(email, password);
    };

    return (
        <AuthPageLayout>
            <AuthHeader
                title="Login"
                subtitle="Welcome to Trendly Brands"
                onBack={goBackToSocial}
            />
            <View style={authLayoutStyles.inputStack}>
                <AuthTextField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    placeholder="you@company.com"
                />
                <AuthTextField
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <Button
                    mode="contained"
                    style={authLayoutStyles.primaryButton}
                    labelStyle={authLayoutStyles.primaryButtonLabel}
                    onPress={handleSignIn}
                >
                    Login
                </Button>
            </View>
            <View style={authLayoutStyles.navStack}>
                <AuthNavLink
                    action="Forgot password?"
                    onPress={() => router.replace("/(auth)/forgot-password")}
                />
                <AuthNavLink
                    prompt="Don't have an account?"
                    action="Sign up"
                    onPress={() => router.replace("/(auth)/create-new-account")}
                />
            </View>
        </AuthPageLayout>
    );
};

export default LoginScreen;

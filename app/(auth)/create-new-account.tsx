import AuthPageLayout, { authLayoutStyles } from "@/components/auth/AuthPageLayout";
import AuthTextField from "@/components/auth/AuthTextField";
import Button from "@/components/ui/button";
import { useAuthContext } from "@/contexts";
import { useMyNavigation } from "@/shared-libs/utils/router";
import fnStyles from "@/styles/signup.styles";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Text, View } from "react-native";

const SignUpScreen = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [verificationSent, setVerificationSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useMyNavigation();
    const theme = useTheme();
    const styles = fnStyles(theme);
    const { signUp } = useAuthContext();

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
                {/* <Image
                    source={require("@/assets/images/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                /> */}
                <View style={authLayoutStyles.formHeader}>
                    <Text style={[styles.title, authLayoutStyles.formTitle]}>
                        Verification Email Sent
                    </Text>
                    <Text style={[styles.subTitle, authLayoutStyles.formSubtitle]}>
                        We've sent a verification email to{" "}
                        <Text style={styles.bold}>{email}</Text>.
                        {"\n\n"}
                        Please open your inbox and click the verification link to activate your account.
                    </Text>
                </View>
                <View style={[styles.inputContainer, authLayoutStyles.inputStack]}>
                    <Button
                        mode="contained"
                        style={authLayoutStyles.primaryButton}
                        onPress={() => router.replace("/(auth)/login")}
                    >
                        Go to Login
                    </Button>
                    <Button
                        mode="outlined"
                        style={authLayoutStyles.secondaryButton}
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
            {/* <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
            /> */}
            <View style={authLayoutStyles.formHeader}>
                <Text style={[styles.title, authLayoutStyles.formTitle]}>
                    Create your brand
                </Text>
                <Text style={[styles.subTitle, authLayoutStyles.formSubtitle]}>
                    Use your work email to create a Trendly brand account
                </Text>
            </View>
            <View style={[styles.inputContainer, authLayoutStyles.inputStack]}>
                <AuthTextField
                    label="Name"
                    value={name}
                    onChangeText={setName}
                />
                <AuthTextField
                    label="Work Email"
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
                <AuthTextField
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
                <Button
                    mode="contained"
                    style={authLayoutStyles.primaryButton}
                    onPress={handleSignUp}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                >
                    Create Account
                </Button>
            </View>
            <View style={authLayoutStyles.loginPrompt}>
                <Text style={[styles.loginText, authLayoutStyles.loginText]}>
                    Already have an account?
                </Text>
                <Button
                    mode="outlined"
                    style={authLayoutStyles.secondaryButton}
                    onPress={() => router.replace("/(auth)/login")}
                >
                    Login
                </Button>
            </View>
            <Text style={[styles.loginText, authLayoutStyles.backText]}>
                Looking for Social Signup?{" "}
                <Text
                    style={styles.loginLink}
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back()
                        } else {
                            router.resetAndNavigate("/pre-signin")
                        }
                    }}
                >
                    Go Back
                </Text>
            </Text>
        </AuthPageLayout>
    );
};

export default SignUpScreen;
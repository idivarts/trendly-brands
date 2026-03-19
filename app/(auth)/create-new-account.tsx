import AuthPageLayout, {
    authLayoutStyles,
    SHORT_VIEWPORT_MAX_HEIGHT,
} from "@/components/auth/AuthPageLayout";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { useAuthContext } from "@/contexts";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import fnStyles from "@/styles/signup.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Text, View } from "react-native";

const SignUpScreen = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [verificationSent, setVerificationSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const theme = useTheme();
    const { xl, height } = useBreakpoints();
    const styles = fnStyles(theme);
    const shortViewport = height < SHORT_VIEWPORT_MAX_HEIGHT;
    const narrowOverrides = useMemo(
        () =>
            !xl
                ? {
                      logo: { marginTop: 12 },
                      title: { marginBottom: 16 },
                      subTitle: { marginBottom: 16 },
                      inputContainer: { marginBottom: 12, paddingHorizontal: 0 },
                  }
                : null,
        [xl]
    );
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
                      backText: { marginTop: 4 },
                  }
                : null,
        [shortViewport]
    );
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
                <Image
                    source={require("@/assets/images/logo.png")}
                    style={[styles.logo, narrowOverrides?.logo, compactOverrides?.logo]}
                    resizeMode="contain"
                />
                <View style={[authLayoutStyles.formHeader, compactOverrides?.formHeader]}>
                    <Text style={[styles.title, authLayoutStyles.formTitle, narrowOverrides?.title, compactOverrides?.title]}>
                        Verification Email Sent
                    </Text>
                    <Text style={[styles.subTitle, authLayoutStyles.formSubtitle, narrowOverrides?.subTitle, compactOverrides?.subTitle]}>
                        We've sent a verification email to{" "}
                        <Text style={styles.bold}>{email}</Text>.
                        {"\n\n"}
                        Please open your inbox and click the verification link to activate your account.
                    </Text>
                </View>
                <View style={[styles.inputContainer, authLayoutStyles.inputStack, narrowOverrides?.inputContainer, compactOverrides?.inputContainer, compactOverrides?.inputStack]}>
                    <Button
                        mode="contained"
                        style={[authLayoutStyles.primaryButton, compactOverrides?.primaryButton]}
                        onPress={() => router.replace("/(auth)/login")}
                    >
                        Go to Login
                    </Button>
                    <Button
                        mode="outlined"
                        style={[authLayoutStyles.secondaryButton, compactOverrides?.secondaryButton]}
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
            <Image
                source={require("@/assets/images/logo.png")}
                style={[styles.logo, narrowOverrides?.logo, compactOverrides?.logo]}
                resizeMode="contain"
            />
            <View style={[authLayoutStyles.formHeader, compactOverrides?.formHeader]}>
                <Text style={[styles.title, authLayoutStyles.formTitle, narrowOverrides?.title, compactOverrides?.title]}>
                    Create your brand
                </Text>
                <Text style={[styles.subTitle, authLayoutStyles.formSubtitle, narrowOverrides?.subTitle, compactOverrides?.subTitle]}>
                    Use your work email to create a Trendly brand account
                </Text>
            </View>
            <View style={[styles.inputContainer, authLayoutStyles.inputStack, narrowOverrides?.inputContainer, compactOverrides?.inputContainer, compactOverrides?.inputStack]}>
                <TextInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    textColor={Colors(theme).text}
                    placeholderTextColor={Colors(theme).text}
                    style={[styles.input, compactOverrides?.input]}
                    theme={{ colors: { primary: Colors(theme).text } }}
                />
                <TextInput
                    autoCapitalize="none"
                    label="Work Email"
                    value={email}
                    placeholderTextColor={Colors(theme).text}
                    onChangeText={setEmail}
                    textColor={Colors(theme).text}
                    mode="outlined"
                    style={[styles.input, compactOverrides?.input]}
                    theme={{ colors: { primary: Colors(theme).text } }}
                />
                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    mode="outlined"
                    placeholderTextColor={Colors(theme).text}
                    textColor={Colors(theme).text}
                    style={[styles.input, compactOverrides?.input]}
                    theme={{ colors: { primary: Colors(theme).text } }}
                />
                <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholderTextColor={Colors(theme).text}
                    textColor={Colors(theme).text}
                    secureTextEntry
                    mode="outlined"
                    style={[styles.input, compactOverrides?.input]}
                    theme={{ colors: { primary: Colors(theme).text } }}
                />
                <Button
                    mode="contained"
                    style={[authLayoutStyles.primaryButton, compactOverrides?.primaryButton]}
                    onPress={handleSignUp}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                >
                    Create Account
                </Button>
            </View>
            <View style={[authLayoutStyles.loginPrompt, compactOverrides?.loginPrompt]}>
                <Text style={[styles.loginText, authLayoutStyles.loginText]}>
                    Already have an account?
                </Text>
                <Button
                    mode="outlined"
                    style={[authLayoutStyles.secondaryButton, compactOverrides?.secondaryButton]}
                    onPress={() => router.replace("/(auth)/login")}
                >
                    Login
                </Button>
            </View>
            <Text style={[styles.loginText, authLayoutStyles.backText, compactOverrides?.backText]}>
                Looking for Social Signup?{" "}
                <Text
                    style={styles.loginLink}
                    onPress={() => router.back()}
                >
                    Go Back
                </Text>
            </Text>
        </AuthPageLayout>
    );
};

export default SignUpScreen;
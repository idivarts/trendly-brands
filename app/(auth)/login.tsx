import AuthPageLayout, { authLayoutStyles } from "@/components/auth/AuthPageLayout";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/shared-uis/constants/Colors";
import { useAuthContext } from "@/contexts";
import fnStyles from "@/styles/signup.styles";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, View } from "react-native";

const LoginScreen = () => {
    const search = useLocalSearchParams()
    const [email, setEmail] = useState(search.email as string || "");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const theme = useTheme();
    const styles = fnStyles(theme);
    const { signIn } = useAuthContext();

    const handleSignIn = () => {
        signIn(email, password);
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
                    Login
                </Text>
                <Text style={[styles.subTitle, authLayoutStyles.formSubtitle]}>
                    Welcome to Trendly Brands
                </Text>
            </View>
            <View style={[styles.inputContainer, authLayoutStyles.inputStack]}>
                <TextInput
                    autoCapitalize="none"
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    textColor={Colors(theme).text}
                    style={styles.input}
                    theme={{ colors: { primary: Colors(theme).text } }}
                />
                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    mode="outlined"
                    style={styles.input}
                    textColor={Colors(theme).text}
                    theme={{ colors: { primary: Colors(theme).text } }}
                />
                <Button
                    mode="contained"
                    style={authLayoutStyles.primaryButton}
                    onPress={handleSignIn}
                >
                    Login
                </Button>
            </View>
            <View style={authLayoutStyles.loginPrompt}>
                <Text style={[styles.loginText, authLayoutStyles.loginText]}>
                    Don&apos;t have an account?
                </Text>
                <Button
                    mode="outlined"
                    style={authLayoutStyles.secondaryButton}
                    onPress={() => router.replace("/(auth)/create-new-account")}
                >
                    Sign Up
                </Button>
                <Text
                    style={[
                        styles.loginText,
                        authLayoutStyles.forgotPassword,
                        styles.loginLink,
                    ]}
                    onPress={() => router.replace("/(auth)/forgot-password")}
                >
                    Forgot Password?
                </Text>
            </View>
        </AuthPageLayout>
    );
};

export default LoginScreen;

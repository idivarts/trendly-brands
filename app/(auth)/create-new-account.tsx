import AuthPageLayout, { authLayoutStyles } from "@/components/auth/AuthPageLayout";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import fnStyles from "@/styles/signup.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, View } from "react-native";

const SignUpScreen = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const router = useRouter();
    const theme = useTheme();
    const styles = fnStyles(theme);
    const { signUp } = useAuthContext();

    const handleSignUp = () => {
        signUp(name, email, password);
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
                    Create your brand
                </Text>
                <Text style={[styles.subTitle, authLayoutStyles.formSubtitle]}>
                    Use your work email to create a Trendly brand account
                </Text>
            </View>
            <View style={[styles.inputContainer, authLayoutStyles.inputStack]}>
                <TextInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    textColor={Colors(theme).text}
                    placeholderTextColor={Colors(theme).text}
                    style={styles.input}
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
                    style={styles.input}
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
                    style={styles.input}
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
                    style={styles.input}
                    theme={{ colors: { primary: Colors(theme).text } }}
                />
                <Button
                    mode="contained"
                    style={authLayoutStyles.primaryButton}
                    onPress={handleSignUp}
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
                    onPress={() => router.back()}
                >
                    Go Back
                </Text>
            </Text>
        </AuthPageLayout>
    );
};

export default SignUpScreen;

import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/constants/Colors";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import fnStyles from "@/styles/forgot-password.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as React from "react";
import { Image, Text, View } from "react-native";

const ForgotPasswordScreen = () => {
    const [email, setEmail] = React.useState("");
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
        <View style={styles.container}>
            {/* Logo Section */}
            <Image
                source={require("@/assets/images/logo.png")} // Replace with your actual logo path
                style={styles.logo}
                resizeMode="contain"
            />

            {/* Title */}
            <Text style={styles.title}>Forgot Password</Text>

            {/* Email Input Field */}
            <TextInput
                autoCapitalize="none"
                label="Enter your Email ID"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: Colors(theme).text } }}
            />

            {/* Reset Password Button */}
            <Button
                mode="contained"
                onPress={() => {
                    handleResetPassword();
                }}
            >
                Reset Password
            </Button>

            {/* Back to Login Prompt */}
            <Text style={styles.loginText}>
                Remember your password?{" "}
                <Text
                    style={styles.loginLink}
                    onPress={() => router.replace("/(auth)/login")}
                >
                    Login
                </Text>
            </Text>
        </View>
    );
};

export default ForgotPasswordScreen;

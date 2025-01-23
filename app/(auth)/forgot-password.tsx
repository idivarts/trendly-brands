import fnStyles from "@/styles/forgot-password.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as React from "react";
import { View, Image, Text } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { AuthApp } from "@/utils/auth";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/constants/Colors";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = React.useState("");
  const router = useRouter();
  const theme = useTheme();
  const styles = fnStyles(theme);

  const handleResetPassword = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    sendPasswordResetEmail(AuthApp, email)
      .then(() => {
        Toaster.success("Password reset email sent successfully");
        router.replace("/(auth)/login");
      })
      .catch((error) => {
        Toaster.error(error.message);
      });
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

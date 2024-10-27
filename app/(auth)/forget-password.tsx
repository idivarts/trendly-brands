import fnStyles from "@/styles/forget-password.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as React from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { sendPasswordResetEmail } from "firebase/auth";
import { AuthApp } from "@/utils/auth";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Toast from "react-native-toast-message";

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
        router.navigate("/(auth)/login");
      })
      .catch((error) => {
        Toaster.error(error.message);
      });
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <Toast />
      <Image
        source={require("../../assets/images/logo.png")} // Replace with your actual logo path
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Forgot Password</Text>

      {/* Email Input Field */}
      <TextInput
        label="Enter your Email ID"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        theme={{ colors: { primary: "#000" } }}
      />

      {/* Reset Password Button */}
      <Button
        mode="contained"
        onPress={() => {
          handleResetPassword();
        }}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        Reset Password
      </Button>

      {/* Back to Login Prompt */}
      <Text style={styles.loginText}>
        Remember your password?{" "}
        <Text
          style={styles.loginLink}
          onPress={() => router.navigate("/(auth)/login")}
        >
          Login
        </Text>
      </Text>
    </View>
  );
};

export default ForgotPasswordScreen;

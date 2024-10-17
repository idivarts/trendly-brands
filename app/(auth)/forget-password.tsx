import fnStyles from "@/styles/forget-password.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as React from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import { TextInput, Button } from "react-native-paper";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = React.useState("");
  const router = useRouter();
  const theme = useTheme();
  const styles = fnStyles(theme);

  return (
    <View style={styles.container}>
      {/* Logo Section */}
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
          router.navigate("Login");
        }}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        Reset Password
      </Button>

      {/* Back to Login Prompt */}
      <Text style={styles.loginText}>
        Remember your password?{" "}
        <Text style={styles.loginLink} onPress={() => router.navigate("login")}>
          Login
        </Text>
      </Text>
    </View>
  );
};

export default ForgotPasswordScreen;

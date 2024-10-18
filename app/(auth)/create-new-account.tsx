import { useRouter } from "expo-router";
import { useState } from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import { TextInput, Button } from "react-native-paper";
import fnStyles from "@/styles/signup.styles";
import { useTheme } from "@react-navigation/native";
import { useAuthContext } from "@/contexts";
import Toast from "react-native-toast-message";

const SignUpScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();
  const theme = useTheme();
  const styles = fnStyles(theme);
  const { signUp } = useAuthContext();

  return (
    <View style={styles.container}>
      <Toast />
      {/* Logo Section */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subTitle}>Welcome to Trendly Brands</Text>

      {/* Name Field */}
      <View style={styles.inputContainer}>
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { primary: "#000" } }} // Simplified input styling
        />

        {/* Email Field */}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { primary: "#000" } }}
        />

        {/* Password Field */}
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
          theme={{ colors: { primary: "#000" } }}
        />
        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
          theme={{ colors: { primary: "#000" } }}
        />

        {/* Sign Up Button */}
        <Button
          mode="contained"
          onPress={() => signUp(name, email, password)}
          style={styles.button}
          labelStyle={styles.buttonText}
        >
          SIGN UP
        </Button>
      </View>

      {/* Login Prompt */}
      <Text style={styles.loginText}>
        Already have an account?{" "}
        <Text style={styles.loginLink} onPress={() => router.navigate("login")}>
          Login
        </Text>
      </Text>
    </View>
  );
};

export default SignUpScreen;

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import fnStyles from "@/styles/signup.styles";
import { useTheme } from "@react-navigation/native";
import { useAuthContext } from "@/contexts";
import Toast from "react-native-toast-message";
import Colors from "@/constants/Colors";

const SignUpScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();
  const theme = useTheme();
  const styles = fnStyles(theme);
  const { signUp } = useAuthContext();

  const windowHeight = Dimensions.get("window").height;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          minHeight: windowHeight,
          paddingBottom: 30,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Toast />
        {/* Logo Section */}
        <Image
          source={require("@/assets/images/logo.png")}
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
            theme={{ colors: { primary: Colors(theme).text } }}
          />
          {/* Email Field */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: Colors(theme).text } }}
          />
          {/* Password Field */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: Colors(theme).text } }}
          />
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: Colors(theme).text } }}
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
          <Text
            style={styles.loginLink}
            onPress={() => router.navigate("/(auth)/login")}
          >
            Login
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

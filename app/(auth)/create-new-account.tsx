import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import fnStyles from "@/styles/signup.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

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
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: 480, alignSelf: "center" }}>
          {/* Logo Section */}
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* Title */}
          <Text style={styles.title}>Create Your Brand</Text>
          <Text style={styles.subTitle}>Welcome to Trendly! Lets put your work email register to Trendly</Text>
          {/* Name Field */}
          <View style={styles.inputContainer}>
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
            {/* Email Field */}
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
            {/* Password Field */}
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
            {/* Sign Up Button */}
            <Button
              mode="contained"
              style={{ marginTop: 16 }}
              onPress={() => signUp(name, email, password)}
            >
              Signup
            </Button>
          </View>
          {/* Login Prompt */}
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text
              style={styles.loginLink}
              onPress={() => router.replace("/(auth)/login")}
            >
              Login
            </Text>
          </Text>
          <Text style={styles.loginText}>
            Looking for Social Signup?{" "}
            <Text
              style={styles.loginLink}
              onPress={() => router.back()}
            >
              Go Back
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

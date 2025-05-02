import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import fnStyles from "@/styles/login.styles";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

const LoginScreen = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const router = useRouter();
  const { signIn } = useAuthContext();
  const theme = useTheme();
  const styles = fnStyles(theme);

  const handleSignIn = () => {
    signIn(email, password);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flex: 1 }}>
        <View style={[styles.container, { width: "100%", paddingHorizontal: 16 }]}>
          <View style={{ flex: 1, width: "100%", maxWidth: 420, alignSelf: "center" }}>
            {/* Logo Section */}
            <Image
              source={require("@/assets/images/logo.png")}
              style={[styles.logo, { alignSelf: "center", marginBottom: 20 }]}
              resizeMode="contain"
            />

            {/* Title */}
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subTitle}>Welcome to Trendly Brands</Text>

            {/* Email and Password Input Fields */}
            <View style={{ marginBottom: 20, padding: 20, backgroundColor: Colors(theme).background, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              <TextInput
                autoCapitalize="none"
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                textColor={Colors(theme).text}
                style={styles.input}
                left={<Ionicons name="mail-outline" size={20} color={Colors(theme).text} />}
                theme={{ colors: { primary: Colors(theme).text } }}
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                style={[styles.input, { marginTop: 10 }]}
                left={<Ionicons name="lock-closed-outline" size={20} color={Colors(theme).text} />}
                textColor={Colors(theme).text}
                theme={{ colors: { primary: Colors(theme).text } }}
              />
            </View>

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleSignIn}
              style={{ marginTop: 10, marginBottom: 20, elevation: 2 }}
            >
              Login
            </Button>

            {/* Sign Up and Forgot Password Links */}
            <View style={[styles.footer, { alignItems: "center", marginTop: 10 }]}>
              <Text style={styles.footerText}>
                Don't have an account?{" "}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.replace("/create-new-account")}
                >
                  Sign Up
                </Text>
              </Text>

              <Text
                style={[styles.footerLink, { marginTop: 10 }]}
                onPress={() => router.replace("/forgot-password")}
              >
                Forgot Password?
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

import { useAuthContext } from "@/contexts";
import * as React from "react";
import { View, Image, Text } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import fnStyles from "@/styles/login.styles";
import Colors from "@/constants/Colors";

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
    <View style={styles.container}>
      {/* Logo Section */}
      <Image
        source={require("@/assets/images/logo.png")} // Replace with your actual logo path
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subTitle}>Welcome to Trendly Brands</Text>

      {/* Email Input Field */}
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        theme={{ colors: { primary: Colors(theme).text } }}
      />

      {/* Password Input Field */}
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        theme={{ colors: { primary: Colors(theme).text } }}
      />

      {/* Login Button */}
      <Button
        mode="contained"
        onPress={() => handleSignIn()}
      >
        Login
      </Button>

      {/* Sign Up and Forgot Password Links */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{" "}
          <Text
            style={styles.footerLink}
            onPress={() => router.navigate("/create-new-account")}
          >
            Sign Up
          </Text>
        </Text>

        <Text
          style={styles.footerLink}
          onPress={() => router.navigate("/forget-password")}
        >
          Forgot Password?
        </Text>
      </View>
    </View>
  );
};

export default LoginScreen;

import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const fnStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors(theme).background,
    },
    inputContainer: {
      marginBottom: 15,
      paddingHorizontal: 16,
    },
    logo: {
      alignSelf: "center",
      width: 100,
      height: 100,
      marginTop: 20,
      zIndex: -1,
    },
    title: {
      textAlign: "center",
      fontSize: 22,
      fontWeight: "600",
      marginBottom: 30,
      color: Colors(theme).text,
    },
    subTitle: {
      textAlign: "center",
      fontSize: 16,
      color: "#333",
      marginBottom: 30,
    },
    input: {
      marginBottom: 15,
      backgroundColor: Colors(theme).background,
    },
    button: {
      marginTop: 20,
      backgroundColor: Colors(theme).primary,
      paddingVertical: 10,
      borderRadius: 8,
    },
    buttonText: {
      fontWeight: "bold",
      fontSize: 16,
      color: Colors(theme).text,
    },
    loginText: {
      textAlign: "center",
      marginTop: 20,
      color: Colors(theme).text,
    },
    loginLink: {
      color: Colors(theme).primary,
      fontWeight: "bold",
    },
  });

export default fnStyles;

import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const fnStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: Colors(theme).background,
    },
    heading: {
      fontSize: 28,
      fontWeight: "bold",
      color: Colors(theme).text,
      marginBottom: 20,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    button: {
      backgroundColor: Colors(theme).primary,
      padding: 10,
      borderRadius: 5,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    buttonText: {
      color: Colors(theme).text,
      fontSize: 16,
    },
    headline: {
      fontSize: 28,
      fontWeight: "bold",
      color: Colors(theme).text,
    },
    question: {
      fontSize: 16,
      color: Colors(theme).text,
      marginBottom: 10,
    },
    dropdown: {
      borderWidth: 1,
      borderColor: Colors(theme).text,
      backgroundColor: Colors(theme).background,
      padding: 10,
      marginBottom: 20,
      justifyContent: "center",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      position: "absolute",
      bottom: 30,
      left: 20,
      right: 20,
    },
  });

export default fnStyles;

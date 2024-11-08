import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      padding: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
    },
    titleActive: {
      fontSize: 20,
      fontWeight: "bold",
      color: "rgb(120, 69, 172)",
      textDecorationLine: "underline",
    },
    subtitle: {
      fontSize: 16,
      textAlign: "center",
    },
  });

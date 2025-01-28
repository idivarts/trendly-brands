import { StyleSheet } from "react-native";
import { Theme } from "@react-navigation/native";

const styles = (theme: Theme) =>
  StyleSheet.create({
    settingsContainer: {
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
  });

export default styles;

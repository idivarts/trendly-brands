import { StyleSheet } from "react-native";
import { Theme } from "@react-navigation/native";
import Colors from "@/constants/Colors";

const styles = (theme: Theme) =>
  StyleSheet.create({
    settingsContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
    },
    settingsRow: {
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    settingsLabel: {
      fontSize: 18,
      textAlign: "left",
      width: "100%",
      marginVertical: 10,
      color: Colors(theme).gray100,
    },
  });

export default styles;

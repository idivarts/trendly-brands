import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      width: "100%",
    },
    infoText: {
      fontSize: 14,
      color: Colors(theme).text,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 12,
      marginBottom: 4,
      gap: 6,
    },
    actionRow: {
      flexDirection: "row",
      marginTop: 8,
      justifyContent: "space-around",
      alignItems: "center",
    },
  });

import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: 10,
      backgroundColor: Colors(theme).card,
      shadowColor: Colors(theme).transparent,
    },
    bottomSheetContent: {
      position: "absolute",
      bottom: 0,
      padding: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    collabName: {
      fontSize: 18,
      fontWeight: "bold",
      flex: 1,
      color: Colors(theme).text,
    },
    brandName: {
      fontSize: 14,
      color: Colors(theme).text,
      marginTop: 4,
    },
    shortDescription: {
      fontSize: 14,
      color: Colors(theme).text,
      marginTop: 8,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      width: "100%",
    },
    infoText: {
      fontSize: 12,
      color: Colors(theme).text,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 12,
      gap: 16,
    },
    actionRow: {
      flexDirection: "row",
      marginTop: 8,
      justifyContent: "space-around",
      alignItems: "center",
    },
  });

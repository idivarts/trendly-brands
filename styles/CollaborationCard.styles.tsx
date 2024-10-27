import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      padding: 10,
      marginVertical: 8,
      marginHorizontal: 5,
      backgroundColor: Colors(theme).card,
      elevation: 2,
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
    bookmarkIcon: {
      marginLeft: "auto",
    },
    collabName: {
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 10,
      maxWidth: "80%",
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
      marginVertical: 8,
    },
    chip: {
      marginHorizontal: 4,
      marginBottom: 4,
    },
    divider: {
      marginVertical: 10,
    },
    actionRow: {
      flexDirection: "row",
      marginTop: 8,
      justifyContent: "space-around",
      alignItems: "center",
    },
  });

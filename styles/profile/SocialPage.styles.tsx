import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    card: {
      marginVertical: 10,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: Colors(theme).border,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderRadius: 8,
      justifyContent: "space-between",
    },
    leftSection: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    rightSection: {
      flex: 1,
      alignItems: "flex-end",
    },
    campaign: {
      flex: 1,
      alignItems: "center",
      flexDirection: "row",
    },
    campaignText: {
      fontSize: 12,
      color: Colors(theme).text,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
    },
    menuStyle: {
      backgroundColor: Colors(theme).background,
    },
    menuTitleStyle: {
      color: Colors(theme).text,
    },

    link: {
      marginTop: 5,
      color: Colors(theme).primary,
    },
    underline: {
      textDecorationLine: "underline",
      marginRight: 5,
    },
    owner: {
      fontSize: 14,
      fontWeight: "500",
    },
    platform: {
      fontSize: 12,
      color: Colors(theme).text,
    },
    iconButton: {
      marginHorizontal: 5,
    },
  });

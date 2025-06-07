import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      marginTop: 16
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      // gap: 16,
      // alignContent: "center",
      marginBottom: 16,
    },
    logoSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    titleSection: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: Colors(theme).text,
    },
    companyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    companyText: {
      fontSize: 14,
      color: Colors(theme).text,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
  });

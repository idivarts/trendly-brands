import { StyleSheet } from "react-native";
import { Theme } from "@react-navigation/native";
import Colors from "@/constants/Colors";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      maxWidth: 600,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    logoSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
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

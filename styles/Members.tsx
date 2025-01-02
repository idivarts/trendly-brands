import Colors from "@/constants/Colors";

import { Theme } from "@react-navigation/native";
import { StyleSheet, Dimensions } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: Colors(theme).background,
    },
    searchInput: {
      backgroundColor: Colors(theme).background,
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
    },
    subtitle: {
      fontSize: 16,
    },
    scrollView: {
      paddingBottom: 160,
      width: "100%",
    },
    scrollViewContent: {
      paddingBottom: 16,
    },
    actionsCell: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    modalContent: {
      padding: 20,
      borderRadius: 10,
      backgroundColor: Colors(theme).background,
      width: 300,
      gap: 12,
    },
    modalInputContainer: {
      marginBottom: 10,
      backgroundColor: Colors(theme).background,
    },
    input: {
      marginBottom: 10,
      backgroundColor: Colors(theme).background,
    },
    chipContainer: {
      backgroundColor: Colors(theme).background,
      flexDirection: "row",
      flexWrap: "wrap",
      marginVertical: 10,
    },
    chip: {
      margin: 4,
    },
    addButton: {
      marginTop: 10,
    },
    noDataContainer: {
      flex: 1,
      justifyContent: "center",
      marginTop: 16,
      alignItems: "center",
    },
    noDataText: {
      fontSize: 17,
    },
  });

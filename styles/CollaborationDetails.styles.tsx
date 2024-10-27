import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    scrollContainer: {
      padding: 16,
    },
    profileCard: {
      alignItems: "center",
      backgroundColor: Colors(theme).card,
      marginBottom: 16,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    profileImage: {
      height: 100,
      marginVertical: 5,
    },
    profileContent: {
      alignItems: "center",
    },
    name: {
      fontWeight: "bold",
      fontSize: 20,
      color: Colors(theme).text,
    },
    brandName: {
      fontSize: 16,
      color: Colors(theme).text,
      marginTop: 4,
    },
    shortDescription: {
      fontSize: 14,
      color: Colors(theme).text,
      textAlign: "center",
      marginVertical: 8,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 12,
    },
    applyButton: {
      marginVertical: 16,
      borderRadius: 25,
    },
    statChip: {
      marginHorizontal: 8,
      backgroundColor: Colors(theme).lightgray,
    },
    infoCard: {
      marginBottom: 16,
      backgroundColor: Colors(theme).card,
      borderRadius: 10,
      shadowColor: Colors(theme).black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 3,
    },
    cardName: {
      fontSize: 16,
      fontWeight: "bold",
      color: Colors(theme).text,
      margin: 16,
    },
    paragraph: {
      color: Colors(theme).text,
    },
  });

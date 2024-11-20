import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: Colors(theme).card,
      shadowColor: Colors(theme).white,
      borderRadius: 10,
      paddingVertical: 16,
    },
    header: {
      paddingBottom: 16,
      paddingHorizontal: 16,
      gap: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    content: {
      paddingTop: 8,
      paddingHorizontal: 16,
    },
    statItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: 2,
    },
    statsText: {
      marginLeft: 5,
      color: Colors(theme).text,
      fontSize: 12,
    },

    nameContainer: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontWeight: "bold",
      color: Colors(theme).text,
    },
    handle: {
      color: "gray",
    },
    carouselContainer: {
      backgroundColor: Colors(theme).card,
      width: "100%",
    },
    indicatorContainer: {
      backgroundColor: Colors(theme).card,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      marginTop: 10,
    },
    indicatorDot: {
      height: 8,
      width: 8,
      borderRadius: 4,
      backgroundColor: "#cccccc",
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: "#333333",
    },
    media: {
      alignSelf: "center",
    },
    stats: {
      marginVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statsContainer: {
      gap: 20,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    bio: {
      fontSize: 14,
      color: Colors(theme).text,
    },
    jobHistory: {
      color: Colors(theme).primary,
      textDecorationLine: "underline",
      marginTop: 10,
    },
  });

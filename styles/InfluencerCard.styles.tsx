import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: Colors(theme).card,
      shadowColor: Colors(theme).transparent,
      borderRadius: 10,
    },
    header: {
      padding: 16,
      paddingRight: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    content: {
      padding: 16,
    },
    statItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: 2,
    },
    statsText: {
      marginLeft: 5, // Adds spacing between the icon and the text
      color: Colors(theme).text,
      fontSize: 12,
    },

    nameContainer: {
      flex: 1,
      marginLeft: 10,
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
      paddingHorizontal: 8,
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
      borderRadius: 10,
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

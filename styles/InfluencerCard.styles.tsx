import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    card: {
      marginVertical: 10,
      padding: 10,
      backgroundColor: Colors(theme).card,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    statItem: {
      flexDirection: "column",
      alignItems: "center",
    },
    statsText: {
      marginLeft: 5, // Adds spacing between the icon and the text
      color: Colors(theme).text,
      fontSize: 16,
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
      marginVertical: 10,
      width: "100%",
    },
    indicatorContainer: {
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
      flexDirection: "row",
      justifyContent: "space-around",
      marginVertical: 10,
      gap: 10,
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

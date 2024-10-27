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
      width: "50%",
    },
    media: {
      height: 250,
      borderRadius: 10,
    },
    statsText: {
      color: Colors(theme).text,
    },
    stats: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginVertical: 10,
    },
    bio: {
      fontSize: 14,
      color: Colors(theme).text,
    },
    jobHistory: {
      color: Colors(theme).text,
      marginTop: 10,
    },
  });

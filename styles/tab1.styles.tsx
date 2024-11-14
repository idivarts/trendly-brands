import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const styles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: Colors(theme).background,
    },
    slide: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Colors(theme).background,
    },
    skipButton: {
      position: "absolute",
      top: 10,
      right: 20,
      backgroundColor: Colors(theme).black,
      paddingHorizontal: 20,
      paddingVertical: 5,
      borderRadius: 10,
    },
    skipButtonText: {
      color: Colors(theme).white,
      fontSize: 16,
    },
    imageContainer: {
      borderRadius: 100,
      overflow: "hidden",
      marginBottom: 20,
    },
    image: {
      width: 200,
      height: 200,
      resizeMode: "contain",
    },
    title: {
      fontSize: 24,
      marginBottom: 10,
      textAlign: "center",
    },
    paragraph: {
      fontSize: 16,
      textAlign: "center",
      paddingHorizontal: 20,
      color: Colors(theme).gray100,
    },
    socialContainer: {
      flexDirection: "column",
      gap: 10,
      justifyContent: "space-between",
      marginTop: 20,
    },
    socialButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors(theme).background,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 25,
      marginHorizontal: 10,
      shadowColor: Colors(theme).black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    icon: {
      marginRight: 10,
    },
    socialButtonText: {
      color: Colors(theme).text,
      fontWeight: "bold",
    },
    pagination: {
      bottom: 30,
    },
    dotStyle: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: Colors(theme).eerieBlack,
      marginHorizontal: 5,
    },
  });

export default styles;

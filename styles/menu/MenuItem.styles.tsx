import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    backgroundImage: {
      width: "100%",
      height: 100,
    },
    brandAvatar: {
      bottom: 36,
      marginBottom: -72,
      left: 20,
      zIndex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors(theme).primary,
    },
    brandName: {
      fontSize: 24,
      textAlign: "center",
    },
    menuItemsContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingVertical: 10,
      justifyContent: "space-between",
    },
    topRow: {
      gap: 20,
      alignItems: "center",
      paddingVertical: 20,
    },
    middleRow: {
      flex: 1,
    },
    bottomRow: {
      gap: 14,
    },
    menuRow: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors(theme).aliceBlue,
      paddingVertical: 14,
    },
    menuRowText: {
      fontSize: 16,
    },
    userProfileContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
    },
    avatar: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors(theme).primary,
    },
    avatarBrandImage: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors(theme).primary,
      width: 200,
      height: 200,
      borderRadius: 20,
    },

    textContainer: {
      flex: 1,
    },
    titleText: {
      fontSize: 16,
    },
    chevron: {
      backgroundColor: Colors(theme).background,
      color: Colors(theme).primary,
    },
    menuButton: {
      backgroundColor: Colors(theme).primary,
    },
  });

export default stylesFn;

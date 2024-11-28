import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    modal: {
      flex: 1,
      justifyContent: "center",
      alignItems: "flex-end",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: Colors(theme).transparent,
      gap: 12,
    },
    uploadContainer: {
      backgroundColor: Colors(theme).aliceBlue,
      height: 200,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      shadowColor: Colors(theme).backdrop,
      shadowOffset: {
        width: 2,
        height: 2,
      },
      gap: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    uploadInnerContainer: {
      flexDirection: "row",
      gap: 8,
      backgroundColor: Colors(theme).transparent,
    },
    modalButton: {
      backgroundColor: Colors(theme).lightgray,
      borderRadius: 100,
      justifyContent: "center",
      alignItems: "center",
      width: 50,
      height: 50,
    },
    container: {
      flex: 1,
      padding: 16,
    },
    contentContainer: {
      paddingVertical: 16,
      flexGrow: 1,
    },
    container3: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
      paddingHorizontal: 24,
    },
    iconButton: {
      backgroundColor: Colors(theme).primary,
      borderRadius: 10,
      marginHorizontal: 0,
      color: Colors(theme).white,
      padding: 12,
    },
    iconButtonContent: {
      paddingHorizontal: 16,
    },
    selectContainer: {
      gap: 8,
    },
    title: {
      color: Colors(theme).text,
    },
    input: {
      backgroundColor: Colors(theme).background,
    },
    budgetContainer: {
      flexDirection: "row",
      gap: 16,
    },
    budgetInput: {
      flex: 1,
      backgroundColor: Colors(theme).background,
    },
    paragraph: {
      color: Colors(theme).text,
    },
    counter: {
      flexDirection: "row",
      alignItems: "center",
    },
    checkIcon: {
      marginBottom: 16,
    },
    button: {
      marginTop: 16,
      paddingVertical: 6,
      width: "100%",
    },
    mapContainer: {
      height: 200,
      marginBottom: 16,
    },
    description: {
      fontSize: 16,
      color: "#555",
      marginBottom: 24,
      textAlign: "center",
    },
    map: {
      flex: 1,
    },
    modalContainer: {
      backgroundColor: Colors(theme).background,
      zIndex: 100,
      padding: 20,
      gap: 16,
      margin: 16,
      borderRadius: 8,
    },
  });

export default stylesFn;

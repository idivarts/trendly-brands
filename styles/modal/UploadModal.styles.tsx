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
    title: {
      marginBottom: 16,
      color: Colors(theme).text,
    },
    input: {
      marginBottom: 16,
      backgroundColor: Colors(theme).background,
    },
    budgetContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    budgetInput: {
      width: "48%",
      backgroundColor: Colors(theme).background,
    },
    paragraph: {
      marginVertical: 8,
      color: Colors(theme).text,
    },
    counter: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    mapContainer: {
      height: 200,
      marginBottom: 16,
    },
    map: {
      flex: 1,
    },
    modalContainer: {
      backgroundColor: Colors(theme).background,
      zIndex: 100,
      padding: 20,
      margin: 16,
      borderRadius: 8,
    },
  });

export default stylesFn;

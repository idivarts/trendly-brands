import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) =>
  StyleSheet.create({
    scrollContainer: {
      padding: 16,
      flex: 1,
    },
    chipContainer: {
      flexDirection: "row",
    },
    chip: {
      marginHorizontal: 5,
      height: 30,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 10,
    },
    profileImage: {
      height: 160,
      marginBottom: 10,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
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
      flexWrap: "wrap",
      gap: 8,
    },
    applyButton: {
      marginVertical: 16,
      borderRadius: 25,
    },
    infoCard: {
      minWidth: "100%",
      backgroundColor: Colors(theme).card,
      borderRadius: 10,
      shadowColor: Colors(theme).transparent,
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
    messageModalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    messageModalContent: {
      width: "80%",
      padding: 20,
      borderRadius: 10,
      alignItems: "center",
      maxWidth: 600,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      alignSelf: "flex-start",
    },
    messageInput: {
      width: "100%",
      height: 100,
      borderColor: Colors(theme).border,
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
      marginBottom: 15,
      textAlignVertical: "top",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      width: "100%",
      gap: 16,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingBottom: 20,
    },
    cardWrapper: {
      width: "48%",
      marginBottom: 12,
      
    },
  });

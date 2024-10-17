import Colors from "@/constants/Themes/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const fnStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: Colors(theme).background,
    },
    headline: {
      fontSize: 30,
      fontWeight: "bold",
      marginBottom: 40,
      color: Colors(theme).text,
    },
    input: {
      marginBottom: 20,
      backgroundColor: Colors(theme).inputBackground,
    },
    uploadButton: {
      marginBottom: 20,
      borderWidth: 1,
    },
    logoImage: {
      width: 100,
      height: 100,
      alignSelf: "center",
      marginBottom: 20,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: Colors(theme).text,
    },
    pickerContainer: {
      marginBottom: 20,
      zIndex: 1,
    },
    pickerLabel: {
      fontSize: 16,
      color: Colors(theme).text,
      marginBottom: 5,
    },
    dropdownButton: {
      width: "100%",
      backgroundColor: Colors(theme).inputBackground,
      borderWidth: 1,
      borderRadius: 5,
      height: 50,
      justifyContent: "center",
    },
    submitButton: {
      paddingVertical: 5,
      borderRadius: 5,
    },
  });

export default fnStyles;

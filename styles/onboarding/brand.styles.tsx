import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const fnStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors(theme).background,
    },
    autocompleteContainer: {
      marginBottom: 20,
      zIndex: 1,
      backgroundColor: Colors(theme).inputBackground,
    },
    autocompleteInputContainer: {
      borderWidth: 1,
      borderColor: Colors(theme).primary,
      borderRadius: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      zIndex: 1,
    },
    autocompleteListContainer: {
      borderWidth: 1,
      borderColor: Colors(theme).border,
      borderTopWidth: 0,
    },
    itemText: {
      fontSize: 16,
      padding: 10,
      color: Colors(theme).text,
    },
    input: {
      marginBottom: 20,
      backgroundColor: Colors(theme).inputBackground,
    },
  });

export default fnStyles;

import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingVertical: 16,
    flexGrow: 1,
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

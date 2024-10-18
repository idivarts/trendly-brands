import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors(theme).aliceBlue,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  text: {
    textAlign: "center",
    fontSize: 16,
  },
});

export default stylesFn;

import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors(theme).aliceBlue,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 12,
  },
  innerContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center"
  },
  text: {
    textAlign: "center",
    fontSize: 16,
  },
});

export default stylesFn;

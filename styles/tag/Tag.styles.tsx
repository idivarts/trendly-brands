import { StyleSheet } from "react-native";
import { Theme } from "@react-navigation/native";
import Colors from "@/constants/Colors";

export const stylesFn = (theme: Theme) => StyleSheet.create({
  tag: {
    backgroundColor: Colors(theme).tag,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    color: Colors(theme).tagForeground,
  },
});

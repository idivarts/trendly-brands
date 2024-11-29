import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) => StyleSheet.create({
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors(theme).background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
    shadowColor: Colors(theme).black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  socialButtonIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    color: Colors(theme).text,
    fontWeight: "bold",
  },
});

export default stylesFn;

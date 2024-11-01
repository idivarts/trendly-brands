import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors(theme).background,
  },
  card: {
    marginVertical: 8,
    padding: 10,
    backgroundColor: Colors(theme).card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    marginLeft: 10,
    flex: 1,
    color: Colors(theme).text,
  },
  title: {
    fontWeight: "bold",
    color: Colors(theme).text,
  },
  time: {
    color: Colors(theme).text,
    marginTop: 5,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  markAsReadButton: {
    marginLeft: 10,
  },
});

import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
    backgroundColor: Colors(theme).background,
  },
  card: {
    padding: 16,
    backgroundColor: Colors(theme).card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    marginLeft: 16,
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
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
    marginTop: 10,
  },
});

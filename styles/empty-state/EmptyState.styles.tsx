import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  contentContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  image: {
    borderRadius: 10,
    maxWidth: 256,
    maxHeight: 256,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center'
  },
});

export default stylesFn;

import { StyleSheet } from "react-native";
import { Theme } from "@react-navigation/native";

const styles = (theme: Theme) => StyleSheet.create({
  settingsContainer: {
    flex: 1,
    alignItems: "center",
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 20,
  },
  settingsLabel: {
    fontSize: 18,
  },
});

export default styles;

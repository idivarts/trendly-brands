import { Theme } from "@react-navigation/native";

const tintColorLight = "#ff6d2d";
const tintColorDark = "#fff";

export default (theme: Theme) => ({
  ...theme.colors,
  ...(theme.dark
    ? {
        text: "#fff",
        background: "#000",
        tint: tintColorDark,
        tabIconDefault: "#ccc",
        tabIconSelected: tintColorDark,
      }
    : {
        text: "#000",
        background: "#fff",
        tint: tintColorLight,
        tabIconDefault: "#ccc",
        tabIconSelected: tintColorLight,
      }),
  aliceBlue: "#E9F1F7",
  backdrop: "rgba(0, 0, 0, 0.5)",
  black: "#000",
  lightgray: "lightgray",
  notificationDot: "red",
  platinum: "#DBDBDB",
  primary: "#1976d2",
  white: "#ffffff",
  transparent: "transparent",
});

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
        inputBackground: "#1b1b1b",
      }
    : {
        text: "#000",
        background: "#fff",
        tint: tintColorLight,
        tabIconDefault: "#ccc",
        tabIconSelected: tintColorLight,
        inputBackground: "#fff",
      }),
  aliceBlue: "#E9F1F7",
  amber: "#FFBF00",
  unicornSilver: "#e8e8e8",
  eerieBlack: "#1b1b1b",
  whiteSmoke: "#f5f5f5",
  success: "#d4edda",
  successForeground: "#28a745",
  pink: "#f8d7da",
  pinkForeground: "#dc3545",
  backdrop: "rgba(0, 0, 0, 0.5)",
  black: "#000",
  lightgray: "lightgray",
  modalBackground: "rgba(0, 0, 0, 0.5)",
  onSurface: "#1976d2",
  orange: "#F64740",
  platinum: "#DBDBDB",
  primary: "#1976d2",
  red: "red",
  gray100: "#555",
  surface: "#ffffff",
  surfaceVariant: "#ffffff",
  white: "#ffffff",
});

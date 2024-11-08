import { useColorScheme as useColorSchemeRN } from "react-native";

const useColorScheme = () => {
  return useColorSchemeRN() === "dark" ? "dark" : "light";
};

export { useColorScheme };

import { Platform } from "react-native"
import useStreamThemeWeb from "./use-stream-theme.web";
import useStreamThemeNative from "./use-stream-theme.native";

const useStreamTheme = (
  theme: any
) => {
  if (Platform.OS === 'web') {
    return useStreamThemeWeb(theme);
  }

  return useStreamThemeNative(theme);
};

export default useStreamTheme;

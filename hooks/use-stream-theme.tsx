import { Platform } from "react-native";
import useStreamThemeNative from "./use-stream-theme.native";
import useStreamThemeWeb from "./use-stream-theme.web";

const useStreamTheme = (
    theme: any
) => {
    if (Platform.OS === 'web') {
        return useStreamThemeWeb(theme);
    }

    return useStreamThemeNative(theme);
};

export default useStreamTheme;

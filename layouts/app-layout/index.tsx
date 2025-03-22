import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { PropsWithChildren, useMemo } from "react";
import { Platform, SafeAreaView, StatusBar, StyleSheet } from "react-native";

import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { useTheme } from "@react-navigation/native";
import Toast from "react-native-toast-message";

interface AppLayoutProps extends PropsWithChildren<Record<string, unknown>> {
  withWebPadding?: boolean;
  setInvisible?: boolean
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, withWebPadding = true, setInvisible }) => {
  const theme = useTheme();
  const isAndroid = useMemo(() => Platform.OS === "android", []);
  const { xl } = useBreakpoints()
  return (
    <SafeAreaView
      style={[
        styles.container,
        setInvisible && { display: "none" },
        {
          backgroundColor: Colors(theme).background,
          paddingTop: isAndroid ? StatusBar.currentHeight : 0,
        },
        Platform.OS === "web" && withWebPadding && xl && { paddingHorizontal: 120 },
      ]}
    >
      {children}
      <ExpoStatusBar style={!theme.dark ? "dark" : "light"} />
      <Toast />
    </SafeAreaView>
  );
};

export default AppLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

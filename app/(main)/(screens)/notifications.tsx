import AppLayout from "@/layouts/app-layout";
import { useNavigation } from "expo-router";
import React from "react";
import { Appbar } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import Notifications from "@/components/notifications";

const NotificationsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <AppLayout>
      <Appbar.Header
        style={{
          backgroundColor: Colors(theme).background,
          elevation: 0,
        }}
        statusBarHeight={0}
      >
        <Appbar.Action
          icon="arrow-left"
          color={Colors(theme).text}
          onPress={() => {
            navigation.goBack();
          }}
        />

        <Appbar.Content
          title="Notifications"
          color={Colors(theme).text}
        />
      </Appbar.Header>
      <Notifications />
    </AppLayout>
  );
};

export default NotificationsScreen;

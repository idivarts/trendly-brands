import React from "react";
import { router, Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useBreakpoints } from "@/hooks";
import { useTheme } from "@react-navigation/native";
import NotificationIcon from "@/components/notifications/notification-icon";
import MenuIcon from "@/components/ui/menu-icon";
import { View } from "@/components/theme/Themed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faComment,
  faFileLines,
  faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
  faComment as faCommentSolid,
  faFileLines as faFileLinesSolid,
  faHouseUser,
  faPlusCircle,
  faStar as faStarSolid,
} from "@fortawesome/free-solid-svg-icons";
import Header from "@/components/explore-influencers/header";

const TabLayout = () => {
  const { xl } = useBreakpoints();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors(theme).primary,
        headerShown: useClientOnlyValue(false, true),
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: xl ? "none" : "flex", // Hide the tab bar on desktop screens
          paddingHorizontal: 8,
        },
        headerTitleAlign: "left",
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen
        name="explore-influencers"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon
              color={color}
              icon={faHouseUser}
              size={28}
            />
          ),
          headerTitle() {
            return (
              <Header />
            )
          },
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <NotificationIcon />
              <MenuIcon />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="collaborations"
        options={{
          title: "Collaborations",
          tabBarIcon: ({ color, focused }) => (
            <FontAwesomeIcon
              color={color}
              icon={focused ? faStarSolid : faStar}
              size={24}
            />
          ),
          headerRight: () => <NotificationIcon />,
        }}
      />
      <Tabs.Screen
        name="create-collaboration"
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push("/(modal)/create-collaboration");
          },
        })}
        options={{
          headerShown: false,
          title: "Create Collaborations",
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon
              color={color}
              icon={faPlusCircle}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <FontAwesomeIcon
              color={color}
              icon={focused ? faCommentSolid : faComment}
              size={24}
            />
          ),
          title: "Messages",
          headerTitleAlign: "left",
          headerRight: () => <NotificationIcon />,
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: "Contracts",
          tabBarIcon: ({ color, focused }) => (
            <FontAwesomeIcon
              color={color}
              icon={focused ? faFileLinesSolid : faFileLines}
              size={24}
            />
          ),
          headerRight: () => <NotificationIcon />,
        }}
      />
    </Tabs>
  );
};

export default TabLayout;

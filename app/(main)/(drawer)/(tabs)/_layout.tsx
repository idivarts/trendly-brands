import React from "react";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useBreakpoints } from "@/hooks";
import { useTheme } from "@react-navigation/native";
import NotificationIcon from "@/components/notifications/notification-icon";
import { View } from "@/components/theme/Themed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faComment,
  faFileLines,
  faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
  faComment as faCommentSolid,
  faHouseUser as faHouseUserSolid,
  faFileLines as faFileLinesSolid,
  faStar as faStarSolid,
} from "@fortawesome/free-solid-svg-icons";
import Header from "@/components/explore-influencers/header";
import ProfileIcon from "@/components/explore-influencers/profile-icon";
import HomeIcon from "@/assets/icons/home.svg";

const TabLayout = () => {
  const { xl } = useBreakpoints();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors(theme).primary,
        tabBarInactiveTintColor: Colors(theme).text,
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
          title: "Explore",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <FontAwesomeIcon
                color={color}
                icon={faHouseUserSolid}
                size={24}
              />
            ) : (
              <HomeIcon width={24} height={24} fill={Colors(theme).text} />
            ),
          headerTitle() {
            return <Header />;
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
            </View>
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
      <Tabs.Screen
        name="menu"
        options={{
          title: "My Brand",
          tabBarIcon: () => <ProfileIcon />,
        }}
      />
    </Tabs>
  );
};

export default TabLayout;

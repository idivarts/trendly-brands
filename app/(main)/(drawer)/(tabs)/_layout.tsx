import { Tabs } from "expo-router";
import React from "react";

import Header from "@/components/explore-influencers/header";
import ProfileIcon from "@/components/explore-influencers/profile-icon";
import NotificationIcon from "@/components/notifications/notification-icon";
import { View } from "@/components/theme/Themed";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import {
  faComment,
  faFileLines,
  faHeart,
  faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
  faComment as faCommentSolid,
  faFileLines as faFileLinesSolid,
  faHeart as faHeartSolid,
  faStar as faStarSolid,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";

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
          display: xl ? "none" : "flex",
          paddingHorizontal: 12,
          paddingVertical: 6,
          height: 70,
          borderTopWidth: 1,
          borderTopColor: Colors(theme).border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          backgroundColor: Colors(theme).background,
        },
        headerTitleAlign: "left",
        headerTitleStyle: {
          fontSize: 22,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: Colors(theme).background,
          borderBottomWidth: 1,
          borderBottomColor: Colors(theme).border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
      }}
    >
      <Tabs.Screen
        name="explore-influencers"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <FontAwesomeIcon
              color={color}
              icon={focused ? faHeartSolid : faHeart}
              size={22}
            />
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
              size={22}
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
              size={22}
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
              size={22}
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

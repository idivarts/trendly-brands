import React from "react";
import { router, Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useBreakpoints } from "@/hooks";
import { useTheme } from "@react-navigation/native";
import NotificationIcon from "@/components/notifications/notification-icon";
import MenuIcon from "@/components/ui/menu-icon";
import { View } from "@/components/theme/Themed";
import DrawerToggleButton from "@/components/ui/drawer-toggle-button/DrawerToggleButton";
import BrandSwitcher from "@/components/ui/brand-switcher";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faHandshake,
  faComment,
  faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
  faFileSignature,
  faPlusCircle,
  faRightLeft,
} from "@fortawesome/free-solid-svg-icons";

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
          title: "Explore Influencers",
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon
              color={color}
              icon={faHandshake}
              size={28}
            />
          ),
          headerLeft: () =>
            xl ? (
              <BrandSwitcher />
            ) : (
              <DrawerToggleButton
                icon={
                  <FontAwesomeIcon
                    color={Colors(theme).text}
                    icon={faRightLeft}
                    size={24}
                    style={{
                      marginLeft: 14,
                      color: Colors(theme).text,
                      marginBottom: -2,
                    }}
                  />
                }
              />
            ),
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
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon
              color={color}
              icon={faStar}
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
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon
              color={color}
              icon={faComment}
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
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon
              color={color}
              icon={faFileSignature}
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

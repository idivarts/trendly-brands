import { Tabs } from "expo-router";
import React from "react";

import ProfileIcon from "@/components/explore-influencers/profile-icon";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCalendarDays,
    faFileLines,
    faInbox,
    faPenRuler,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";

const TabLayout = () => {
    const { xl } = useBreakpoints();
    const theme = useTheme();

    const menuTabButton = () => <ProfileIcon />;

    return (
        <Tabs
            backBehavior="history"
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
            {/* Tab 1: Content Strategy (index) */}
            <Tabs.Screen
                name="(content)/content-strategies/index"
                options={{
                    title: "Strategy",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={faPenRuler}
                            size={22}
                        />
                    ),
                }}
            />

            {/* Hidden: content-strategies detail route */}
            <Tabs.Screen
                name="(content)/content-strategies/[strategyId]"
                options={{
                    tabBarItemStyle: { display: "none" },
                    headerShown: false,
                }}
                getId={({ params }) => params?.strategyId as string}
            />

            {/* Tab 2: Content Calendar */}
            <Tabs.Screen
                name="(content)/content-calendar"
                options={{
                    title: "Calendar",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={faCalendarDays}
                            size={22}
                        />
                    ),
                }}
            />

            {/* Tab 3 (center): Content — the contents list. */}
            <Tabs.Screen
                name="(content)/contents/index"
                options={{
                    title: "Content",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={faFileLines}
                            size={22}
                        />
                    ),
                }}
            />

            {/* Tab 4: Inbox — unified messages & comments */}
            <Tabs.Screen
                name="inbox"
                options={{
                    title: "Inbox",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={faInbox}
                            size={22}
                        />
                    ),
                }}
            />

            {/* Tab 5: Brand Menu */}
            <Tabs.Screen
                name="menu"
                options={{
                    title: "My Brand",
                    headerShown: false,
                    tabBarIcon: () => menuTabButton(),
                }}
            />

            {/* Hidden: content detail (not in tab bar) */}
            <Tabs.Screen
                name="(content)/contents/[contentId]"
                options={{
                    tabBarItemStyle: { display: "none" },
                    headerShown: false,
                }}
                getId={({ params }) => params?.contentId as string}
            />

            {/* Hidden: gallery-only content library pages (triple-dot menu) */}
            <Tabs.Screen
                name="(content)/contents/scheduled"
                options={{ tabBarItemStyle: { display: "none" }, headerShown: false }}
            />
            <Tabs.Screen
                name="(content)/contents/posted"
                options={{ tabBarItemStyle: { display: "none" }, headerShown: false }}
            />
            <Tabs.Screen
                name="(content)/contents/archived"
                options={{ tabBarItemStyle: { display: "none" }, headerShown: false }}
            />
        </Tabs>
    );
};

export default TabLayout;

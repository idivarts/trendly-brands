import { Tabs } from "expo-router";
import React from "react";

import ProfileIcon from "@/components/explore-influencers/profile-icon";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useInboxUnread } from "@/contexts/inbox-unread-context.provider";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabLayout = () => {
    const { xl } = useBreakpoints();
    const theme = useTheme();
    const { unreadConversations } = useInboxUnread();
    // Android is edge-to-edge (targetSdk 35), so the system nav bar paints over
    // the app. React Navigation only adds insets.bottom to the tab bar when
    // tabBarStyle has no numeric `height` — and any `paddingVertical` here would
    // overwrite the paddingBottom it applies. So we fold the inset in ourselves.
    const insets = useSafeAreaInsets();

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
                    paddingTop: 6,
                    paddingBottom: insets.bottom + 6,
                    height: 70 + insets.bottom,
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

            {/* Hidden: content-strategies detail route. On mobile this is a
                focused, full-screen editing surface — hide the bottom tab bar
                entirely so the floating "Push to Calendar" CTA owns the bottom.
                (On xl the tab bar is already hidden via screenOptions.) */}
            <Tabs.Screen
                name="(content)/content-strategies/[strategyId]"
                options={{
                    tabBarItemStyle: { display: "none" },
                    tabBarStyle: { display: "none" },
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
                    tabBarBadge: unreadConversations > 0 ? unreadConversations : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: Colors(theme).red,
                        color: Colors(theme).white,
                    },
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

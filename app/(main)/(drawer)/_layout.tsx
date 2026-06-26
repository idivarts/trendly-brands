import AccountLockedBanner from "@/components/billing/AccountLockedBanner";
import DrawerMenuContent from "@/components/drawer-layout/DrawerMenuContent";
import {
    SidebarCollapsedProvider,
    useSidebarCollapsed,
} from "@/components/drawer-layout/sidebar-collapsed-context";
import { InboxUnreadProvider } from "@/contexts/inbox-unread-context.provider";
import { useBreakpoints } from "@/hooks";
import { BrandProtectedScreen } from "@/layouts/protected";
import CustomDrawerWrapper from "@/shared-uis/components/CustomDrawer";
import { Stack } from "expo-router";
import React from "react";

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 56;
// Kept in sync with SUB_DRAWER_WIDTH in DrawerMenuContentWeb.tsx
const SUB_DRAWER_WIDTH = 248;

const DrawerLayoutInner = () => {
    const { xl, width: screenWidth } = useBreakpoints();
    const { isCollapsed, subDrawerOpen } = useSidebarCollapsed();

    const drawerWidth = xl
        ? isCollapsed
            ? subDrawerOpen
                ? COLLAPSED_WIDTH + SUB_DRAWER_WIDTH
                : COLLAPSED_WIDTH
            : EXPANDED_WIDTH
        : screenWidth * 0.75;

    return (
        <BrandProtectedScreen>
            <CustomDrawerWrapper
                DrawerContent={<DrawerMenuContent />}
                isFixed={xl}
                drawerWidth={drawerWidth}
            >
                <AccountLockedBanner />
                <Stack screenOptions={{ headerShown: false }} />
            </CustomDrawerWrapper>
        </BrandProtectedScreen>
    );
};

const DrawerLayout = () => (
    <SidebarCollapsedProvider>
        <InboxUnreadProvider>
            <DrawerLayoutInner />
        </InboxUnreadProvider>
    </SidebarCollapsedProvider>
);

export default DrawerLayout;

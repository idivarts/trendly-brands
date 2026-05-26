import DrawerMenuContent from "@/components/drawer-layout/DrawerMenuContent";
import {
    SidebarCollapsedProvider,
    useSidebarCollapsed,
} from "@/components/drawer-layout/sidebar-collapsed-context";
import { useBreakpoints } from "@/hooks";
import { BrandProtectedScreen } from "@/layouts/protected";
import CustomDrawerWrapper from "@/shared-uis/components/CustomDrawer";
import { Stack } from "expo-router";
import React from "react";

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 56;

const DrawerLayoutInner = () => {
    const { xl, width: screenWidth } = useBreakpoints();
    const { isCollapsed } = useSidebarCollapsed();

    const drawerWidth = xl
        ? isCollapsed
            ? COLLAPSED_WIDTH
            : EXPANDED_WIDTH
        : screenWidth * 0.75;

    return (
        <BrandProtectedScreen>
            <CustomDrawerWrapper
                DrawerContent={<DrawerMenuContent />}
                isFixed={xl}
                drawerWidth={drawerWidth}
            >
                <Stack screenOptions={{ headerShown: false }} />
            </CustomDrawerWrapper>
        </BrandProtectedScreen>
    );
};

const DrawerLayout = () => (
    <SidebarCollapsedProvider>
        <DrawerLayoutInner />
    </SidebarCollapsedProvider>
);

export default DrawerLayout;

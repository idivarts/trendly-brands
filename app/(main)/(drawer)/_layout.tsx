// import DrawerMenuContent from "@/components/drawer-layout/DrawerMenuContent";
// import BackButton from "@/components/ui/back-button/BackButton";
import DrawerMenuContent from "@/components/drawer-layout/DrawerMenuContent";
import { useBreakpoints } from "@/hooks";
import { BrandProtectedScreen } from "@/layouts/protected";
import CustomDrawerWrapper from "@/shared-uis/components/CustomDrawer";
import { Stack } from "expo-router";
import React from "react";
// import { Drawer } from "expo-router/drawer";



const DrawerLayout = () => {
  const { xl } = useBreakpoints();

  return (
    <BrandProtectedScreen>
      <CustomDrawerWrapper DrawerContent={<DrawerMenuContent />} isFixed={xl}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(secondary)"
            options={{
              headerShown: false,
            }}
          /> */}
        </Stack>
      </CustomDrawerWrapper>
    </BrandProtectedScreen>
  );
};

export default DrawerLayout;

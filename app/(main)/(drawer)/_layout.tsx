import { Drawer } from "expo-router/drawer";
import DrawerMenuContent from "@/components/drawer-layout/DrawerMenuContent";
import BackButton from "@/components/ui/back-button/BackButton";
import { useBreakpoints } from "@/hooks";
import { BrandProtectedScreen } from "@/layouts/protected";

const DrawerLayout = () => {
  const { xl } = useBreakpoints();

  return (
    <BrandProtectedScreen>
      <Drawer
        backBehavior="history"
        drawerContent={() => <DrawerMenuContent />}
        screenOptions={{
          drawerType: xl ? "permanent" : "slide",
          headerShown: false,
          headerLeft: () => xl ? null : <BackButton />,
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Drawer>
    </BrandProtectedScreen>
  );
};

export default DrawerLayout;

import { Drawer } from "expo-router/drawer";
import DrawerMenuContent from "@/components/drawer-layout/DrawerMenuContent";
import BackButton from "@/components/ui/back-button/BackButton";
import { useBreakpoints } from "@/hooks";

const DrawerLayout = () => {
  const { xl } = useBreakpoints();

  return (
    <Drawer
      backBehavior="history"
      drawerContent={() => <DrawerMenuContent />}
      screenOptions={{
        drawerType: "permanent",
        headerShown: false,
        drawerStyle: {
          display: xl ? 'flex' : 'none', // Hide the drawer on tablet, and mobile screens
        },
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
  );
};

export default DrawerLayout;

import AppLayout from "@/layouts/app-layout";
import React from "react";
import Menu from "@/components/menu";
import ScreenHeader from "@/components/ui/screen-header";

const MenuScreen = () => {
  return (
    <AppLayout>
      <ScreenHeader
        title="Menu"
      />
      <Menu />
    </AppLayout>
  );
};

export default MenuScreen;

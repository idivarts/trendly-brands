import AppLayout from "@/layouts/app-layout";
import React from "react";
import Settings from "@/components/settings";
import ScreenHeader from "@/components/ui/screen-header";

const SettingsScreen = () => {
  return (
    <AppLayout>
      <ScreenHeader
        title="Settings"
      />
      <Settings />
    </AppLayout>
  );
};

export default SettingsScreen;

import AppLayout from "@/layouts/app-layout";
import React from "react";
import Settings from "@/components/settings";
import ScreenHeader from "@/components/ui/screen-header";
import { View } from "@/components/theme/Themed";

const SettingsScreen = () => {
  return (
    <AppLayout>
      <Settings />
    </AppLayout>
  );
};

export default SettingsScreen;

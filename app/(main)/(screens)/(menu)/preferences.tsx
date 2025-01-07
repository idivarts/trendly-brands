import AppLayout from "@/layouts/app-layout";
import React from "react";
import Preferences from "@/components/preferences";
import ScreenHeader from "@/components/ui/screen-header";

const PreferencesScreen = () => {
  return (
    <AppLayout>
      <ScreenHeader title="Members" />
      <Preferences />
    </AppLayout>
  );
};

export default PreferencesScreen;

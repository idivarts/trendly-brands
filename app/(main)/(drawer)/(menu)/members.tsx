import Preferences from "@/components/preferences";
import ScreenHeader from "@/components/ui/screen-header";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const PreferencesScreen = () => {
  return (
    <AppLayout withWebPadding={false}>
      <ScreenHeader title="Members" />
      <AppLayout>
        <Preferences />
      </AppLayout>
    </AppLayout>
  );
};

export default PreferencesScreen;

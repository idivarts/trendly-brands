import AppLayout from "@/layouts/app-layout";
import React from "react";
import Profile from "@/components/profile";
import ScreenHeader from "@/components/ui/screen-header";

const ProfileScreen = () => {
  return (
    <AppLayout>
      <ScreenHeader
        title="Profile"
      />
      <Profile />
    </AppLayout>
  );
};

export default ProfileScreen;

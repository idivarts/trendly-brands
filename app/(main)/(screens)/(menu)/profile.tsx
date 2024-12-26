import AppLayout from "@/layouts/app-layout";
import React from "react";
import Profile from "@/components/profile";
import ScreenHeader from "@/components/ui/screen-header";

const ProfileScreen = () => {
  return (
    <AppLayout>
      <Profile />
    </AppLayout>
  );
};

export default ProfileScreen;

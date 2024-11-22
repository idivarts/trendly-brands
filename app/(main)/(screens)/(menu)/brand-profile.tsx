import AppLayout from "@/layouts/app-layout";
import React from "react";
import BrandProfile from "@/components/brand-profile";
import ScreenHeader from "@/components/ui/screen-header";

const BrandProfileScreen = () => {
  return (
    <AppLayout>
      <ScreenHeader
        title="Brand Profile"
      />
      <BrandProfile />
    </AppLayout>
  );
};

export default BrandProfileScreen;

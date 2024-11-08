import AppLayout from "@/layouts/app-layout";
import React from "react";
import CreateBrand from "@/components/brand/CreateBrand";
import ScreenHeader from "@/components/ui/screen-header";

const CreateBrandScreen = () => {
  return (
    <AppLayout>
      <ScreenHeader
        title="Create New Brand"
      />
      <CreateBrand />
    </AppLayout>
  );
};

export default CreateBrandScreen;

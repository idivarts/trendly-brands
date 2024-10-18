import AppLayout from "@/layouts/app-layout";
import React from "react";
import Billing from "@/components/billing";
import ScreenHeader from "@/components/ui/screen-header";

const BillingScreen = () => {
  return (
    <AppLayout>
      <ScreenHeader
        title="Billing"
      />
      <Billing />
    </AppLayout>
  );
};

export default BillingScreen;

import Billing from "@/components/billing";
import ScreenHeader from "@/components/ui/screen-header";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const BillingScreen = () => {
  return (
    <AppLayout withWebPadding={false}>
      <ScreenHeader
        title="Billing"
      />
      <Billing />
    </AppLayout>
  );
};

export default BillingScreen;

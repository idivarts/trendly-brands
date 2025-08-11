import PayWallComponent from "@/components/paywall";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const BillingScreen = () => {
  return (
    <AppLayout withWebPadding={false}>
      {/* <ScreenHeader
        title="Billing"
      /> */}
      <PayWallComponent />
      {/* <Billing /> */}
    </AppLayout>
  );
};

export default BillingScreen;

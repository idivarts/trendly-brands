import PayWallComponent from "@/components/paywall";
import ScreenHeader from "@/components/ui/screen-header";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const BillingScreen = () => {
    const { xl } = useBreakpoints()
    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["top", "right", "bottom", "left"]}>
            {!xl && <ScreenHeader title="" />}
            <PayWallComponent />
        </AppLayout>
    );
};

export default BillingScreen;

import Members from "@/components/members";
import ScreenHeader from "@/components/ui/screen-header";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const PreferencesScreen = () => {
    return (
        <AppLayout withWebPadding={false}>
            <ScreenHeader title="Members" />
            <AppLayout safeAreaEdges={["bottom", "left", "right"]}>
                <Members />
            </AppLayout>
        </AppLayout>
    );
};

export default PreferencesScreen;

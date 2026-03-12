import Settings from "@/components/settings";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const SettingsScreen = () => {
    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["top", "right", "bottom", "left"]}>
            <Settings />
        </AppLayout>
    );
};

export default SettingsScreen;

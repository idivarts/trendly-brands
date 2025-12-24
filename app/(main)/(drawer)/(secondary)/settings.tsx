import Settings from "@/components/settings";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const SettingsScreen = () => {
    return (
        <AppLayout withWebPadding={false}>
            <Settings />
        </AppLayout>
    );
};

export default SettingsScreen;

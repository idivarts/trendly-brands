import PreferencesTabContent from "@/components/preferences/PreferencesTabContent";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const PreferencesScreen = () => {
    return (
        <AppLayout withWebPadding={false}>
            <AppLayout>
                <PreferencesTabContent />
            </AppLayout>
        </AppLayout>
    );
};

export default PreferencesScreen;

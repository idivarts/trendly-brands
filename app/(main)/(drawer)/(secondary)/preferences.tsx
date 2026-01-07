import PreferencesTabContent from "@/components/preferences/PreferencesTabContent";
import ScreenHeader from "@/components/ui/screen-header";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const PreferencesScreen = () => {
    return (
        <AppLayout withWebPadding={false}>
            <ScreenHeader title="Brand Preferences" />
            <AppLayout>
                <PreferencesTabContent />
            </AppLayout>
        </AppLayout>
    );
};

export default PreferencesScreen;

import Profile from "@/components/profile";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const ProfileScreen = () => {
    return (
        <AppLayout withWebPadding={false}>
            <Profile />
        </AppLayout>
    );
};

export default ProfileScreen;

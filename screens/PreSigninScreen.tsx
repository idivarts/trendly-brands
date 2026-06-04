import AuthCard from "@/components/pre-signin/AuthCard";
import React from "react";

/**
 * The /pre-signin route. Renders the shared auth card (social providers) inside
 * the split-screen AuthPageLayout, matching the email auth screens exactly.
 */
const PreSigninScreen = () => {
    return <AuthCard />;
};

export default PreSigninScreen;

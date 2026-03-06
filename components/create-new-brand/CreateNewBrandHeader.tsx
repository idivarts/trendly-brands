import PageHeader from "@/components/ui/page-header";
import React from "react";

export interface CreateNewBrandHeaderProps {
    title: string;
    /** When true (e.g. first-time onboarding), hide back button. Default false. */
    showBackButton?: boolean;
}

/**
 * Header for Create New Brand / Onboarding screen.
 * Back button + title only; no action buttons or right-side content.
 */
const CreateNewBrandHeader: React.FC<CreateNewBrandHeaderProps> = ({
    title,
    showBackButton = true,
}) => {
    return (
        <PageHeader
            title={title}
            showBackButton={showBackButton}
        />
    );
};

export default CreateNewBrandHeader;

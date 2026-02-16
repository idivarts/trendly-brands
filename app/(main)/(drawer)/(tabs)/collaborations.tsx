import Collaborations from "@/components/collaborations";
import AICampaignCreation from "@/components/create-collaboration/AICampaignCreation";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useState } from "react";

const CollaborationsScreen = () => {
    const router = useMyNavigation();
    const [showAICreation, setShowAICreation] = useState(true);
    const { selectedBrand } = useBrandContext();

    // Always show AI creation interface first
    if (showAICreation) {
        return (
            <AICampaignCreation
                onSkip={() => {
                    setShowAICreation(false);
                }}
            />
        );
    }

    return <Collaborations />;
};

export default CollaborationsScreen;

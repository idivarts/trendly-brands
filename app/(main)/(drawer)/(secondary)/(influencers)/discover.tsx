import DiscoverComponent from "@/components/discover/Discover";
import NonIndiaDiscoverLanding from "@/components/discover/NonIndiaDiscoverLanding";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useLocalSearchParams } from "expo-router";
import React from "react";

const DiscoverInfluencersScreen = () => {
    const { influencerId } = useLocalSearchParams<{ influencerId?: string }>();
    const { isIndiaBased } = useBrandContext();

    // In-app influencer discovery is India-only. Non-India brands get a managed
    // sourcing landing page (CTA -> Hire Us) instead of the discovery grid.
    if (!isIndiaBased) {
        return <NonIndiaDiscoverLanding />;
    }

    return (
        <DiscoverComponent
            showRightPanel={true}
            initialInfluencerId={influencerId?.toString()}
        />
    );
};

export default DiscoverInfluencersScreen;


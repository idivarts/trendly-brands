import DiscoverComponent from "@/components/discover/Discover";
import { useLocalSearchParams } from "expo-router";
import React from "react";

const DiscoverInfluencersScreen = () => {
    const { influencerId } = useLocalSearchParams<{ influencerId?: string }>();
    console.log("[Discover Route] influencerId param:", influencerId);
    return (
        <DiscoverComponent
            showRightPanel={true}
            topPanel={true}
            initialInfluencerId={influencerId?.toString()}
        />
    );
};

export default DiscoverInfluencersScreen;


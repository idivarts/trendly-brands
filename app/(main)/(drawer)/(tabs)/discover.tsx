import InviteToCampaignButton from "@/components/collaboration/InviteToCampaignButton";
import InfluencerCard from "@/components/explore-influencers/InfluencerCard";
import BottomSheetScrollContainer from "@/components/ui/bottom-sheet/BottomSheetWithScroll";
import PageHeader from "@/components/ui/page-header";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useMyGrowthBook } from "@/contexts/growthbook-context-provider";
import { useNicheSearch } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import DiscoverComponent from "@/shared-uis/components/discover/Discover";
import { useLocalSearchParams } from "expo-router";
import React from "react";

const DiscoverInfluencersScreen = () => {
    const { influencerId } = useLocalSearchParams<{ influencerId?: string }>();
    const { manager } = useAuthContext();
    const { selectedBrand, updateBrand, isOnFreeTrial, isProfileLocked } = useBrandContext();
    const { features } = useMyGrowthBook();
    const { handleSearch, getAllNiches, isLoading: isLoadingNiches, niches } = useNicheSearch();

    console.log("[Discover Route] influencerId param:", influencerId);

    return (
        <DiscoverComponent
            showRightPanel={true}
            initialInfluencerId={influencerId?.toString()}
            config={{
                managerId: manager?.id ?? null,
                isAdmin: false,
                selectedBrand: selectedBrand ?? null,
                updateBrand,
                isOnFreeTrial: isOnFreeTrial ?? false,
                isProfileLocked,
                niches,
                searchNiches: handleSearch,
                getAllNiches,
                isLoadingNiches,
                demoLink: features?.demoLink,
                components: {
                    AppLayout,
                    PageHeader,
                    InfluencerCard,
                    InviteToCampaignButton,
                    BottomSheetScrollContainer,
                },
            }}
        />
    );
};

export default DiscoverInfluencersScreen;

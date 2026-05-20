import CampaignDetails from "@/components/campaigns/campaign-details";
import { useLocalSearchParams } from "expo-router";

const CampaignDetailsScreen = () => {
    const { pageID } = useLocalSearchParams<{ pageID: string }>();
    return <CampaignDetails campaignId={pageID} />;
};

export default CampaignDetailsScreen;

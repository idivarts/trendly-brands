import CreateCampaign from "@/components/campaigns/create-campaign";
import AppLayout from "@/layouts/app-layout";

const CreateCampaignScreen = () => (
    <AppLayout safeAreaEdges={["top", "right", "bottom", "left"]}>
        <CreateCampaign />
    </AppLayout>
);

export default CreateCampaignScreen;

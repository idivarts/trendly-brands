import HireAgency from "@/components/hire-agency/create";
import AppLayout from "@/layouts/app-layout";

const HireAgencyScreen = () => (
    <AppLayout safeAreaEdges={["top", "right", "bottom", "left"]}>
        <HireAgency />
    </AppLayout>
);

export default HireAgencyScreen;

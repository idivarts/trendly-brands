import DiscoverAdPlaceholder from "@/components/discover/DiscoverAdPlaceholder";
import DiscoverInfluencer from "@/components/discover/DiscoverInfluencer";
import RightPanelDiscover from "@/components/discover/RightPanelDiscover";
import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import React, { useState } from "react";
import { ActivityIndicator } from "react-native-paper";

const DiscoverInfluencersScreen = () => {
    const { manager } = useAuthContext()
    const { selectedBrand } = useBrandContext()
    const preferences = selectedBrand?.preferences

    const { xl } = useBreakpoints()

    if (!manager && !preferences)
        return <ActivityIndicator />

    const planKey = selectedBrand?.billing?.planKey
    if (planKey != "enterprise" && planKey != "pro") {
        return <DiscoverAdPlaceholder />
    }

    const [selectedDb, setSelectedDb] = useState<'trendly' | 'phyllo' | 'modash'>('trendly')

    // Make sure to load the component only when ready
    if (!selectedBrand || !selectedBrand.id)
        return null

    if (xl) {
        return (
            <AppLayout>
                <View style={{ width: "100%", flexDirection: "row", gap: 24, height: "100%" }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <ScreenHeader title="Influencer Discovery" hideAction={true} />
                        <DiscoverInfluencer selectedDb={selectedDb} />
                    </View>
                    <RightPanelDiscover selectedDb={selectedDb} setSelectedDb={setSelectedDb} />
                </View>
            </AppLayout>
        );
    }

    return null
};

export default DiscoverInfluencersScreen;

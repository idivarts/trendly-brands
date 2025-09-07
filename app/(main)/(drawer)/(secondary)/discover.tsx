import DiscoverInfluencer from "@/components/discover/DiscoverInfluencer";
import RightPanelDiscover, { DB_TYPE } from "@/components/discover/RightPanelDiscover";
import { View } from "@/components/theme/Themed";
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

    if (!manager || !preferences || !selectedBrand || !selectedBrand.id)
        return <ActivityIndicator />

    const [selectedDb, setSelectedDb] = useState<DB_TYPE>('trendly')

    if (xl) {
        return (
            <AppLayout>
                <View style={{ width: "100%", flexDirection: "row", gap: 24, height: "100%" }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
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

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
    const [connectedInfluencer, setConnectedInfluencer] = useState(false)

    const { xl } = useBreakpoints()

    if (!manager && !preferences)
        return <ActivityIndicator />

    if (xl) {
        return (
            <AppLayout>
                <View style={{ width: "100%", flexDirection: "row", gap: 24, height: "100%" }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <ScreenHeader title="Discover" hideAction={true} />
                        <DiscoverInfluencer />
                    </View>
                    <RightPanelDiscover />
                </View>
            </AppLayout>
        );
    }

    return null
};

export default DiscoverInfluencersScreen;

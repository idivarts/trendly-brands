import DiscoverInfluencer from "@/components/discover/DiscoverInfluencer";
import RightPanelDiscover, { DB_TYPE } from "@/components/discover/RightPanelDiscover";
import FullInformationalIllustration from "@/components/FullScreenIllustration";
import { View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { Subject } from "rxjs";

export const OpenFilterRightPanel = new Subject()

const DiscoverInfluencersScreen = () => {
    const { manager } = useAuthContext()
    const { selectedBrand } = useBrandContext()
    const [rightPanel, setRightPanel] = useState(true)

    const { xl } = useBreakpoints()

    const [selectedDb, setSelectedDb] = useState<DB_TYPE>("trendly")

    useEffect(() => {
        const unsubs = OpenFilterRightPanel.subscribe(() => {
            setRightPanel(true)
        })
        return () => unsubs.unsubscribe()
    }, [])

    const b = true;
    if (b)
        return <FullInformationalIllustration />

    if (!manager || !selectedBrand || !selectedBrand.id)
        return <ActivityIndicator />

    return (
        <AppLayout>
            <View style={{ width: "100%", flexDirection: "row", gap: 24, height: "100%" }}>
                <DiscoverInfluencer selectedDb={selectedDb} setSelectedDb={setSelectedDb} rightPanel={rightPanel} setRightPanel={setRightPanel} />
                <RightPanelDiscover selectedDb={selectedDb} setSelectedDb={setSelectedDb} style={(!xl) && {
                    width: "100%",
                    maxWidth: "auto",
                    display: rightPanel ? "flex" : "none"
                }} rightPanel={rightPanel} setRightPanel={setRightPanel} />
            </View>
        </AppLayout>
    );
};

export default DiscoverInfluencersScreen;

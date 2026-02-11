import type { DB_TYPE } from "@/components/discover/discover-types";
import DiscoverInfluencer from "@/components/discover/DiscoverInfluencer";
import DiscoverSurvey from "@/components/discover/DiscoverSurvey";
import {
    DiscoveryProvider,
    OpenFilterRightPanel,
    type DiscoverCommunication,
    type PageSortCommunication,
} from "@/components/discover/discovery-context";
import RightPanelDiscover from "@/components/discover/RightPanelDiscover";
import { View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import SlowLoader from "@/shared-uis/components/SlowLoader";
import React, { useEffect, useRef, useState } from "react";

const DiscoverComponent = ({
    showRightPanel = true,
    topPanel = true,
    showTopPanel,
    advanceFilter = false,
    statusFilter = false,
    isStatusCard = false,
    onStatusChange,
    defaultAdvanceFilters,
    /**
     * If false -> ignore the brand-saved persisted filters and only honour defaultAdvanceFilters.
     * Useful when Discover is used inside another screen (e.g., InvitationsTabContent) and you want
     * to show the collaboration's preferences only.
     */
    useStoredFilters = true,
    initialInfluencerId,
}: {
    showRightPanel?: boolean;
    topPanel?: boolean;
    showTopPanel?: boolean;
    advanceFilter?: boolean;
    statusFilter?: boolean;
    isStatusCard?: boolean;
    onStatusChange?: (status: string) => void;
    defaultAdvanceFilters?: IAdvanceFilters;
    useStoredFilters?: boolean;
    initialInfluencerId?: string;
}) => {
    const { manager } = useAuthContext();
    const { selectedBrand } = useBrandContext();
    const [rightPanel, setRightPanel] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const discoverCommunication =
        useRef<(action: DiscoverCommunication) => any>();
    const pageSortCommunication =
        useRef<(action: PageSortCommunication) => any>();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [storedFilters, setStoredFilters] = useState<IAdvanceFilters | null>(
        null
    );

    useEffect(() => {
        if (!selectedBrand) return;
        if (!useStoredFilters) {
            setStoredFilters(null);
            return;
        }

        (async () => {
            const key = `defaultFilter-${selectedBrand.id}`;
            const saved = await PersistentStorage.get(key);

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    console.log(" Loaded last-applied filter from storage:", parsed);
                    setStoredFilters(parsed);
                } catch (e) {
                    console.log(" Failed to parse saved filter:", saved);
                }
            }
        })();
    }, [selectedBrand, useStoredFilters]);

    const { xl } = useBreakpoints();

    useEffect(() => {

        setRightPanel(Boolean(xl));
    }, [xl]);

    const [selectedDb, setSelectedDb] = useState<DB_TYPE>("trendly");

    useEffect(() => {
        const unsubs = OpenFilterRightPanel.subscribe(() => {

            setRightPanel(true);
            setShowFilters(true);
            setIsCollapsed(false);
        });

        return () => unsubs.unsubscribe();
    }, []);

    // Always show survey on login
    const [showSurvey, setShowSurvey] = useState(true);

    // Determine which filter source to use:
    // If collaboration passed defaultAdvanceFilters → use only that.
    // Else → use stored persistent filters.
    const hasMeaningfulDefaults =
        defaultAdvanceFilters &&
        Object.values(defaultAdvanceFilters).some(
            (v) =>
                v !== undefined &&
                v !== null &&
                v !== "" &&
                !(Array.isArray(v) && v.length === 0)
        );
    const filtersToUse = hasMeaningfulDefaults
        ? defaultAdvanceFilters
        : useStoredFilters
            ? storedFilters || undefined
            : undefined;

    const handleSurveyComplete = async (filters: IAdvanceFilters) => {
        // Save the filters for this session and future logins
        if (selectedBrand) {
            const key = `defaultFilter-${selectedBrand.id}`;
            await PersistentStorage.set(key, JSON.stringify(filters));
            setStoredFilters(filters);
        }

        // Hide survey for current session
        setShowSurvey(false);
    };

    if (showSurvey)
        return (
            <AppLayout safeAreaEdges={["left", "right"]}>
                <DiscoverSurvey onComplete={handleSurveyComplete} />
            </AppLayout>
        );

    if (!manager || !selectedBrand || !selectedBrand.id)
        return <SlowLoader messages={["Loading brand information...", "Preparing discovery...", "Almost ready..."]} />;

    return (
        <DiscoveryProvider
            value={{
                selectedDb,
                setSelectedDb,
                rightPanel,
                setRightPanel,
                showFilters,
                setShowFilters,
                discoverCommunication,
                pageSortCommunication,
                isCollapsed,
                showTopPanel:
                    typeof showTopPanel === "boolean" ? showTopPanel : topPanel,
                setIsCollapsed,
            }}
        >
            <AppLayout safeAreaEdges={["left", "right"]}>
                <View style={{ width: "100%", flexDirection: "row", height: "100%" }}>
                    <DiscoverInfluencer
                        advanceFilter={advanceFilter}
                        statusFilter={statusFilter}
                        onStatusChange={onStatusChange}
                        isStatusCard={isStatusCard}
                        defaultAdvanceFilters={filtersToUse}
                        initialInfluencerId={initialInfluencerId}
                    />
                    <RightPanelDiscover
                        defaultAdvanceFilters={filtersToUse}
                        onClearStoredFilters={() => setStoredFilters(null)}
                        style={[
                            (!showRightPanel || (!rightPanel && !xl)) && { display: "none" },
                            !xl && {
                                width: "100%",
                                maxWidth: "auto",
                                position: "absolute",
                                right: 0,
                                top: 0,
                                bottom: 0,
                                zIndex: 100,
                            },
                        ]}
                    />
                </View>
            </AppLayout>
        </DiscoveryProvider>
    );
};

export default DiscoverComponent;

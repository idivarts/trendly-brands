import type { DB_TYPE } from "@/components/discover/discover-types";
import AdvancedFilterOverlay from "@/components/discover/AdvancedFilterOverlay";
import DiscoverInfluencer from "@/components/discover/DiscoverInfluencer";
import DiscoverSurvey from "@/components/discover/DiscoverSurvey";
import {
    DiscoveryProvider,
    OpenFilterRightPanel,
    type DiscoverCommunication,
    type PageSortCommunication,
} from "@/components/discover/discovery-context";
import { View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import SlowLoader from "@/shared-uis/components/SlowLoader";
import Toaster from "@/shared-uis/components/toaster/Toaster";
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
    const { selectedBrand, updateBrand } = useBrandContext();
    const [rightPanel, setRightPanel] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterOverlayVisible, setFilterOverlayVisible] = useState(false);
    const discoverCommunication =
        useRef<((action: DiscoverCommunication) => any) | undefined>(undefined);
    const pageSortCommunication =
        useRef<((action: PageSortCommunication) => any) | undefined>(undefined);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [storedFilters, setStoredFilters] = useState<IAdvanceFilters | null>(
        null
    );
    const [isFiltersCleared, setIsFiltersCleared] = useState(false);
    const [hasLoadedStoredFilters, setHasLoadedStoredFilters] = useState(false);

    useEffect(() => {
        if (!selectedBrand) return;
        if (!useStoredFilters) {
            setStoredFilters(null);
            setHasLoadedStoredFilters(true);
            return;
        }

        (async () => {
            const key = `defaultFilter-${selectedBrand.id}`;
            const saved = await PersistentStorage.get(key);

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setStoredFilters(parsed);
                    setIsFiltersCleared(false);
                } catch (e) {
                    setStoredFilters(null);
                }
            } else {
                setStoredFilters(null);
            }

            setHasLoadedStoredFilters(true);
        })();
    }, [selectedBrand, useStoredFilters]);

    const { xl } = useBreakpoints();

    useEffect(() => {

        setRightPanel(Boolean(xl));
    }, [xl]);

    const [selectedDb, setSelectedDb] = useState<DB_TYPE>("trendly");

    useEffect(() => {
        const unsubs = OpenFilterRightPanel.subscribe(() => {
            if (!showRightPanel) return;
            setFilterOverlayVisible(true);
            setShowFilters(true);
            setIsCollapsed(false);
        });

        return () => unsubs.unsubscribe();
    }, [showRightPanel]);

    const hasBrandPreferences = selectedBrand?.discoverPreferences &&
        Object.values(selectedBrand.discoverPreferences).some(
            (v) =>
                v !== undefined &&
                v !== null &&
                v !== "" &&
                !(Array.isArray(v) && v.length === 0)
        );
    const [showSurvey, setShowSurvey] = useState(!hasBrandPreferences);

    useEffect(() => {
        setShowSurvey(!hasBrandPreferences);
    }, [hasBrandPreferences]);

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
        : useStoredFilters && hasLoadedStoredFilters
            ? storedFilters !== null
                ? storedFilters
                : isFiltersCleared
                    ? undefined
                    : selectedBrand?.discoverPreferences
            : undefined;

    const filtersForChildren = hasMeaningfulDefaults
        ? defaultAdvanceFilters
        : useStoredFilters && hasLoadedStoredFilters && storedFilters !== null
            ? storedFilters
            : undefined;

    const handleSurveyComplete = async (filters: IAdvanceFilters) => {
        try {
            if (selectedBrand?.id) {
                const cleanFilters = (obj: any): any => {
                    const cleaned: Record<string, any> = {};
                    for (const [key, value] of Object.entries(obj)) {
                        if (value !== undefined && value !== null) {
                            if (Array.isArray(value)) {
                                const cleanedArray = value.filter(v => v !== undefined && v !== null);
                                if (cleanedArray.length > 0) {
                                    cleaned[key] = cleanedArray;
                                }
                            } else {
                                cleaned[key] = value;
                            }
                        }
                    }
                    return cleaned;
                };

                const cleanedFilters = cleanFilters(filters);

                await updateBrand(selectedBrand.id, {
                    discoverPreferences: cleanedFilters,
                });

                const surveyKey = `survey-completed-${selectedBrand.id}`;
                await PersistentStorage.set(surveyKey, "true");

                Toaster.success("Preferences saved!");
            }
        } catch (error) {
            Toaster.error("Failed to save preferences. Please try again");
            return;
        }

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
                <View style={{ width: "100%", flexDirection: "row", height: "100%", }}>
                    <DiscoverInfluencer
                        advanceFilter={advanceFilter}
                        statusFilter={statusFilter}
                        onStatusChange={onStatusChange}
                        isStatusCard={isStatusCard}
                        defaultAdvanceFilters={filtersToUse}
                        initialInfluencerId={initialInfluencerId}
                    />
                </View>
                {showRightPanel && (
                    <AdvancedFilterOverlay
                        visible={filterOverlayVisible}
                        onClose={() => setFilterOverlayVisible(false)}
                        defaultAdvanceFilters={filtersForChildren}
                        onClearStoredFilters={() => {
                            setStoredFilters(null);
                            setIsFiltersCleared(true);
                        }}
                        onFiltersApplied={(filters) => {
                            setStoredFilters(filters);
                            setIsFiltersCleared(false);
                        }}
                    />
                )}
            </AppLayout>
        </DiscoveryProvider>
    );
};

export default DiscoverComponent;

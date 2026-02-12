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
import Colors from "@/shared-uis/constants/Colors";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, type ViewStyle } from "react-native";

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
    const theme = useTheme();
    const colors = Colors(theme);
    const [rightPanel, setRightPanel] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterSheetIndex, setFilterSheetIndex] = useState(-1);
    const filterSheetRef = useRef<BottomSheet>(null);
    const filterSnapPoints = React.useMemo(() => ["40%", "92%"], []);
    const isWeb = Platform.OS === "web";
    const sheetStyles = React.useMemo(() => createSheetStyles(colors), [colors]);
    const discoverCommunication =
        useRef<((action: DiscoverCommunication) => any) | undefined>(undefined);
    const pageSortCommunication =
        useRef<((action: PageSortCommunication) => any) | undefined>(undefined);
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
            console.log("[Discover] Filter icon pressed", {
                showRightPanel,
                filterSheetIndex,
                selectedDb,
            });
            if (!showRightPanel) return;
            setFilterSheetIndex(0);
            if (!isWeb) {
                filterSheetRef.current?.snapToIndex(0);
                filterSheetRef.current?.expand?.();
            }
            setShowFilters(true);
            setIsCollapsed(false);
        });

        return () => unsubs.unsubscribe();
    }, [showRightPanel, filterSheetIndex, selectedDb, isWeb]);

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
                {showRightPanel && !isWeb && (
                    <BottomSheet
                        ref={filterSheetRef}
                        index={filterSheetIndex}
                        snapPoints={filterSnapPoints}
                        enablePanDownToClose
                        onChange={setFilterSheetIndex}
                        backdropComponent={(props) => (
                            <BottomSheetBackdrop
                                {...props}
                                appearsOnIndex={0}
                                disappearsOnIndex={-1}
                            />
                        )}
                    >
                        <RightPanelDiscover
                            defaultAdvanceFilters={filtersToUse}
                            onClearStoredFilters={() => setStoredFilters(null)}
                            disableCollapse
                            style={{
                                maxWidth: "100%",
                                width: "100%",
                                borderLeftWidth: 0,
                            }}
                        />
                    </BottomSheet>
                )}
                {showRightPanel && isWeb && filterSheetIndex >= 0 && (
                    <Pressable
                        style={sheetStyles.overlay}
                        onPress={() => setFilterSheetIndex(-1)}
                    />
                )}
                {showRightPanel && isWeb && (
                    <View
                        style={[
                            sheetStyles.sheet,
                            filterSheetIndex < 0 && sheetStyles.sheetHidden,
                        ]}
                    >
                        <ScrollView style={sheetStyles.sheetScroll}>
                            <RightPanelDiscover
                                defaultAdvanceFilters={filtersToUse}
                                onClearStoredFilters={() => setStoredFilters(null)}
                                disableCollapse
                                style={{
                                    maxWidth: "100%",
                                    width: "100%",
                                    borderLeftWidth: 0,
                                }}
                            />
                        </ScrollView>
                    </View>
                )}
            </AppLayout>
        </DiscoveryProvider>
    );
};

const createSheetStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create<{
        overlay: ViewStyle;
        sheet: ViewStyle;
        sheetScroll: ViewStyle;
        sheetHidden: ViewStyle;
    }>({
        overlay: {
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            zIndex: 9998,
        },
        sheet: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "88%",
            backgroundColor: colors.background,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            zIndex: 9999,
            paddingTop: 8,
        },
        sheetScroll: {
            flex: 1,
        },
        sheetHidden: {
            display: "none",
        },
    });

export default DiscoverComponent;

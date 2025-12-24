import { InfluencerInviteUnit } from "@/components/discover/DiscoverInfluencer";
import InfluencerCard from "@/components/explore-influencers/InfluencerCard";
import EmptyState from "@/components/ui/empty-state";
import Colors from "@/constants/Colors";
import { useCollapseContext } from "@/contexts/CollapseContext";
import { useBreakpoints } from "@/hooks";
import useInvitedInfluencers from "@/hooks/request/use-invited-influencers";
import { MAX_WIDTH_WEB } from "@/shared-uis/components/carousel/carousel-util";
import { stylesFn } from "@/styles/collaboration-details/CollaborationDetails.styles";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Dimensions, FlatList, RefreshControl, View } from "react-native";
import { ActivityIndicator, Chip, Menu } from "react-native-paper";
//  import Discover from "@/components/discover/Discover"; // unused

const InvitedMemberTabContent = (props: any) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = stylesFn(theme);

    const { isCollapsed, setIsCollapsed } = useCollapseContext();
    const collaborationId = props.pageID;
    const { influencers: rawInfluencers, loading: isLoading, refresh, loadMore, nextAvailable, setStatusFilter } = useInvitedInfluencers({
        collaborationId,
    });

    const { xl } = useBreakpoints();


    const influencers = (rawInfluencers || []) as InfluencerInviteUnit[];

    // Status menu states must be declared unconditionally (can't be after an early return)
    const [statusMenuVisible, setStatusMenuVisible] = React.useState(false);
    const [currentStatus, setCurrentStatus] = React.useState<string | undefined>(undefined);

    // if (influencers.length === 0 && isLoading) {
    //   return (
    //     <View
    //       style={{
    //         flex: 1,
    //         justifyContent: "center",
    //         alignItems: "center",
    //         gap: 40,
    //       }}
    //     >
    //       <SlowLoader />
    //     </View>
    //   );
    // }

    const width = Math.min(MAX_WIDTH_WEB, Dimensions.get("window").width);


    const statusOptions = [
        { label: "All", value: undefined },
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "accepted" },
        { label: "Denied", value: "denied" },
    ];

    const onSelectStatus = (val?: string) => {
        setCurrentStatus(val);
        setStatusFilter(val as string | undefined);
    };

    const renderItem = ({ item }: { item: InfluencerInviteUnit }) => (
        <View style={{ width: "50%", paddingHorizontal: isCollapsed ? 12 : 8, paddingVertical: isCollapsed ? 12 : 8 }}>
            <InfluencerCard
                item={item}
                isCollapsed={isCollapsed}
                isStatusCard={true}
                onPress={() => { }}
            />
        </View>
    );

    return (
        <View style={{ flex: 1, minWidth: 0 }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                }}
            >
                <Menu
                    visible={statusMenuVisible}
                    onDismiss={() => setStatusMenuVisible(false)}
                    anchor={
                        <Chip compact onPress={() => setStatusMenuVisible(true)} icon="filter">
                            {statusOptions.find((o) => o.value === currentStatus)?.label || "Status"}
                        </Chip>
                    }
                >
                    {statusOptions.map((opt) => (
                        <Menu.Item key={opt.label} onPress={() => { setStatusMenuVisible(false); onSelectStatus(opt.value); }} title={opt.label} />
                    ))}
                </Menu>
            </View>

            <FlatList
                data={influencers}
                keyExtractor={(i: InfluencerInviteUnit) => i.id}
                renderItem={renderItem}
                numColumns={2}
                onEndReached={() => loadMore()}
                onEndReachedThreshold={0.5}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
                contentContainerStyle={{
                    paddingTop: 12,
                    paddingBottom: 24,
                    paddingRight: isCollapsed ? 120 : 16,
                    paddingLeft: isCollapsed ? 120 : 4,
                    flexGrow: influencers.length === 0 ? 1 : undefined,
                }}
                ListEmptyComponent={
                    !isLoading ? (
                        <EmptyState
                            subtitle="No invited members found."
                            image={require("@/assets/images/illustration5.png")}
                            hideAction
                        />
                    ) : null
                }
                ListFooterComponent={
                    isLoading ? (
                        <View style={{ paddingVertical: 20 }}>
                            <ActivityIndicator />
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

export default InvitedMemberTabContent;

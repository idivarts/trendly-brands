import BottomSheetActions from "@/components/BottomSheetActions";
import { DiscoveryProvider } from "@/components/discover/discovery-context";
import { View } from "@/components/theme/Themed";
import TopTabNavigation from "@/components/ui/top-tab-navigation";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { CollapseProvider, useCollapseContext } from "@/contexts/CollapseContext";
import { useBreakpoints } from "@/hooks";
import usePublishCollaboration from "@/hooks/usePublishCollaboration";
import { IBrands } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import ApplicationsTabContent from "./ApplicationsTabContent";
import InvitationsTabContent from "./InvitationsTabContent";
import InvitedMemberTabContent from "./InvitedMemberTabContent";
import OverviewTabContent from "./OverviewTabContent";

export interface CollaborationDetail extends ICollaboration {
    id: string;
    brandDescription: string;
    brandName: string;
    logo: string;
    paymentVerified: boolean;
    brandWebsite: string;
    brandCategory: string[];
}

interface CollaborationDetailsProps {
    pageID: string;
}

function CampaignDetailsHeader({
    isDraft,
    onNavigateBack,
    ...headerProps
}: React.ComponentProps<typeof PageHeader> & {
    isDraft: boolean;
    onNavigateBack: () => void;
}) {
    const { xl } = useBreakpoints();
    const { isCollapsed, toggleCollapse } = useCollapseContext();
    const handleBack = () => {
        if (xl && !isDraft && isCollapsed) {
            toggleCollapse();
        } else {
            onNavigateBack();
        }
    };
    return <PageHeader {...headerProps} onBackPress={handleBack} />;
}

const CollaborationDetails: React.FC<CollaborationDetailsProps> = ({
    pageID,
}) => {
    const [collaboration, setCollaboration] = useState<
        CollaborationDetail | undefined
    >(undefined);
    const [actionsVisible, setActionsVisible] = useState(false);
    const theme = useTheme();
    const colors = Colors(theme);
    const [loading, setLoading] = useState(true);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(theme), [theme]);
    const { isOnFreeTrial } = useBrandContext();
    const { openModal } = useConfirmationModel();
    const nav = useMyNavigation();
    const expoRouter = useRouter();
    const { pageID: paramPageID } = useLocalSearchParams<{ pageID?: string }>();

    const { publish } = usePublishCollaboration();

    const fetchCollaboration = async () => {
        if (!pageID) return;
        try {
            console.log("[CollaborationDetails] Fetching collaboration:", pageID);
            const collabRef = doc(FirestoreDB, "collaborations", pageID);
            const snapshot = await getDoc(collabRef);
            const data = snapshot.data() as ICollaboration;

            console.log("[CollaborationDetails] Fetched data:", {
                exists: snapshot.exists(),
                status: data?.status,
                hasData: !!data
            });

            if (!data) {
                console.warn("[CollaborationDetails] No data found for:", pageID);
                return;
            }

            const brandRef = doc(FirestoreDB, "brands", data.brandId);
            const brandSnapshot = await getDoc(brandRef);
            const brandData = brandSnapshot.data() as IBrands;

            setCollaboration({
                id: snapshot.id,
                ...data,
                logo: brandData?.image || "",
                brandName: brandData?.name || "Unknown Brand",
                paymentVerified: brandData?.paymentMethodVerified || false,
                brandDescription: brandData?.profile
                    ? brandData?.profile?.about || ""
                    : "",
                brandWebsite: brandData?.profile
                    ? brandData?.profile?.website || ""
                    : "",
                brandCategory: brandData?.profile
                    ? brandData?.profile?.industries || []
                    : [],
            });

            console.log("[CollaborationDetails] Collaboration set successfully");
        } catch (e) {
            Console.error(e, "[CollaborationDetails] Error:");
        } finally {
            setLoading(false);
        }
    };

    const tabs = (xl: boolean) => [
        {
            id: "Overview",
            title: "Overview",
            component: (
                <OverviewTabContent
                    collaboration={collaboration as CollaborationDetail}
                />
            ),
        },
        ...(xl
            ? [
                {
                    id: "d2",
                    title: "---",
                    href: "/" as Href,
                },
            ]
            : []),
        ...(xl
            ? [
                {
                    id: "Applications-Pending",
                    title: "Pending/New Applications",
                    component: (
                        <ApplicationsTabContent
                            key={"applications-pending"}
                            pageID={pageID}
                            filter="pending"
                            collaboration={{
                                id: pageID,
                                name: collaboration?.name || "",
                                questionsToInfluencers:
                                    collaboration?.questionsToInfluencers || [],
                            }}
                        />
                    ),
                },
                {
                    id: "Applications-Shortlisted",
                    title: "Shortlisted Applications",
                    component: (
                        <ApplicationsTabContent
                            key={"applications-shortlisted"}
                            pageID={pageID}
                            filter="shortlisted"
                            collaboration={{
                                id: pageID,
                                name: collaboration?.name || "",
                                questionsToInfluencers:
                                    collaboration?.questionsToInfluencers || [],
                            }}
                        />
                    ),
                },
                {
                    id: "Applications-Accepted",
                    title: "Accepted Applications",
                    component: (
                        <ApplicationsTabContent
                            key={"applications-accepted"}
                            filter="accepted"
                            pageID={pageID}
                            collaboration={{
                                id: pageID,
                                name: collaboration?.name || "",
                                questionsToInfluencers:
                                    collaboration?.questionsToInfluencers || [],
                            }}
                        />
                    ),
                },
                {
                    id: "Applications-Rejected",
                    title: "Rejected Applications",
                    component: (
                        <ApplicationsTabContent
                            filter="rejected"
                            key={"applications-rejected"}
                            pageID={pageID}
                            collaboration={{
                                id: pageID,
                                name: collaboration?.name || "",
                                questionsToInfluencers:
                                    collaboration?.questionsToInfluencers || [],
                            }}
                        />
                    ),
                },
                {
                    id: "d1",
                    title: "---",
                    href: "/" as Href,
                },
            ]
            : [
                {
                    id: "Applications",
                    title: "Applications",
                    component: (
                        <ApplicationsTabContent
                            key={"applications"}
                            pageID={pageID}
                            collaboration={{
                                id: pageID,
                                name: collaboration?.name || "",
                                questionsToInfluencers:
                                    collaboration?.questionsToInfluencers || [],
                            }}
                        />
                    ),
                },
            ]),
        {
            id: "Invitations",
            title: "Send Invitations",
            component: (
                <DiscoveryProvider
                    value={{
                        selectedDb: "trendly",
                        setSelectedDb: () => { },
                        rightPanel: false,
                        setRightPanel: () => { },
                        showFilters: false,
                        setShowFilters: () => { },
                        isCollapsed: false,
                        setIsCollapsed: () => { },
                        discoverCommunication: { current: undefined },
                        pageSortCommunication: { current: undefined },
                        totalCount: "0",
                        currentSort: "followers",
                        setTotalCount: () => { },
                        setCurrentSort: () => { },
                    }}
                >
                    <InvitationsTabContent key={"invitations"} pageID={pageID} />
                </DiscoveryProvider>
            ),
        },
        {
            id: "Invitations-Sent",
            title: "Invited Members",
            component: (
                <InvitedMemberTabContent
                    key={"invited-members"}
                    pageID={pageID}
                />
            ),
        },
    ];

    useEffect(() => {
        fetchCollaboration();
    }, [pageID]);

    if (loading)
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator />
            </View>
        );

    console.log("[CollaborationDetails] Rendering:", {
        hasCollaboration: !!collaboration,
        status: collaboration?.status,
        id: collaboration?.id
    });

    if (!collaboration) {
        console.warn("[CollaborationDetails] No collaboration data available");
        return null;
    }

    const isDraft = collaboration.status === "draft";
    const campaignHeaderActions = isDraft
        ? [
              <Button
                  key="edit"
                  mode="contained"
                  onPress={() => {
                      nav.push({
                          pathname: "/edit-collaboration",
                          params: { id: pageID },
                      });
                  }}
                  size="small"
                  style={styles.draftActionButton}
                  textColor={colors.text}
              >
                  Edit
              </Button>,
              <Button
                  key="publish"
                  mode="contained"
                  onPress={() => publish(pageID, { onSuccess: fetchCollaboration })}
                  size="small"
                  style={styles.publishActionButton}
              >
                  Publish
              </Button>,
          ]
        : [];

    return (
        <View style={styles.column}>
            <CollapseProvider>
                <CampaignDetailsHeader
                    title="Campaign Details"
                    subtitle={collaboration.name}
                    showBackButton
                    isDraft={isDraft}
                    onNavigateBack={() => {
                        if (expoRouter.canGoBack()) expoRouter.back();
                        else nav.push("/collaborations");
                    }}
                    actionButtons={campaignHeaderActions}
                    rightComponent={
                        <Pressable
                            onPress={() => setActionsVisible(true)}
                            style={styles.iconButton}
                        >
                            <FontAwesomeIcon
                                icon={faEllipsisH}
                                size={24}
                                color={colors.text}
                            />
                        </Pressable>
                    }
                />
            {collaboration.status !== "draft" && (
                <View style={styles.tabContainer}>
                    <TopTabNavigation
                        tabs={tabs(xl)}
                        size="compact"
                        mobileFullWidth={true}
                        splitTwoColumns={true}
                    />
                </View>
            )}
            </CollapseProvider>
            <BottomSheetActions
                cardId={(paramPageID || pageID) as string}
                cardType="activeCollab"
                isVisible={actionsVisible}
                snapPointsRange={["20%", "50%"]}
                onClose={() => setActionsVisible(false)}
            />

            {collaboration.status === "draft" && (
                <OverviewTabContent
                    collaboration={collaboration}
                    onEditPress={() => {
                        nav.push({
                            pathname: "/edit-collaboration",
                            params: { id: pageID },
                        });
                    }}
                    onPublishPress={() =>
                        publish(pageID, { onSuccess: fetchCollaboration })
                    }
                />
            )}
        </View>
    );
};

function useStyles(theme: ReturnType<typeof useTheme>) {
    const colors = Colors(theme);
    return StyleSheet.create({
        loadingContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        },
        column: {
            flex: 1,
            flexDirection: "column",
        },
        tabContainer: {
            flex: 1,
            width: "100%",
            minHeight: 0,
        },
        iconButton: {
            padding: 8,
        },
        draftActionButton: {
            backgroundColor: colors.background,
            borderWidth: 0.3,
            borderColor: colors.outline,
            borderRadius: 16,
            paddingVertical: 4,
            paddingHorizontal: 10,
            minHeight: 32,
        },
        publishActionButton: {
            borderRadius: 16,
            paddingVertical: 4,
            paddingHorizontal: 10,
            minHeight: 32,
        },
    });
}

export default CollaborationDetails;

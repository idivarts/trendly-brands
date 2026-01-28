import { DiscoveryProvider } from "@/components/discover/discovery-context";
import { View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TopTabNavigation from "@/components/ui/top-tab-navigation";
import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { CollapseProvider } from "@/contexts/CollapseContext";
import { useBreakpoints } from "@/hooks";
import usePublishCollaboration from "@/hooks/usePublishCollaboration";
import { IBrands } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import { useTheme } from "@react-navigation/native";
import { Href } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import CollaborationHeader from "../CollaborationHeader";
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

const CollaborationDetails: React.FC<CollaborationDetailsProps> = ({
    pageID,
}) => {
    const [collaboration, setCollaboration] = useState<
        CollaborationDetail | undefined
    >(undefined);
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const { xl } = useBreakpoints();
    const { isOnFreeTrial } = useBrandContext();
    const { openModal } = useConfirmationModel();
    const router = useMyNavigation();

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
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
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

    return (
        <View
            style={{
                flex: 1,
                flexDirection: "column",
            }}
        >
            {/* <View
        style={{
          zIndex: 1000,
        }}
      >
        <Toast />
      </View> */}
            <CollaborationHeader collaboration={collaboration} />

            {collaboration.status === "draft" && (
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        gap: 16,
                        marginBottom: 16,
                    }}
                >
                    <Button
                        mode="contained"
                        onPress={() => {
                            router.push({
                                pathname: "/edit-collaboration",
                                params: {
                                    id: pageID,
                                },
                            });
                        }}
                        style={{
                            flex: 1,
                            backgroundColor: Colors(theme).background,
                            borderWidth: 0.3,
                            borderColor: Colors(theme).outline,
                        }}
                        textColor={Colors(theme).text}
                    >
                        Edit Draft
                    </Button>
                    <Button
                        mode="contained"
                        onPress={() => publish(pageID, { onSuccess: fetchCollaboration })}
                        style={{
                            flex: 1,
                        }}
                    >
                        Publish Now
                    </Button>
                </View>
            )}
            {collaboration.status === "draft" && (
                <OverviewTabContent collaboration={collaboration} />
            )}
            {collaboration.status !== "draft" && (() => {
                console.log("[CollaborationDetails] Rendering TopTabNavigation for status:", collaboration.status);
                return (
                    <CollapseProvider>
                        <View style={{ flex: 1, width: "100%", minHeight: 0 }}>
                            <TopTabNavigation
                                tabs={tabs(xl)}
                                size="compact"
                                mobileFullWidth={true}
                                splitTwoColumns={true}
                            />
                        </View>
                    </CollapseProvider>
                );
            })()}
        </View>
    );
};

export default CollaborationDetails;

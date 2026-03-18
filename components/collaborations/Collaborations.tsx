import BottomSheetActions from "@/components/BottomSheetActions";
import { Text, View } from "@/components/theme/Themed";
import { MAX_WIDTH_WEB } from "@/constants/Container";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import ScrollMedia from "@/shared-uis/components/carousel/scroll-media";
import Colors from "@/shared-uis/constants/Colors";
import { stylesFn } from "@/styles/Proposal.styles";
import { MediaItem } from "@/types/Media";
import { processRawAttachment } from "@/utils/attachments";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import {
    collection,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
} from "react-native";
import CollaborationDetails from "../collaboration-card/card-components/CollaborationDetails";
import CollaborationStats from "../collaboration-card/card-components/CollaborationStats";
import CustomDivider from "../CustomDivider";
import Button from "../ui/button";
import EmptyState from "../ui/empty-state";


const CollaborationList = ({ active }: { active: boolean }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [proposals, setProposals] = useState<any[]>([]);
    const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
    const [selectedCollabStatus, setSelectedCollabStatus] = useState<string | undefined>(undefined);
    const { selectedBrand } = useBrandContext();

    const openBottomSheet = (id: string, status?: string) => {
        setIsVisible(true);
        setSelectedCollabId(id);
        setSelectedCollabStatus(status);
    };
    const closeBottomSheet = () => setIsVisible(false);

    const theme = useTheme();
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(theme, xl), [theme, xl]);
    const stylesFromFn = stylesFn(theme);
    const user = AuthApp.currentUser;

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchProposals();
        setRefreshing(false);
    };

    const fetchProposals = async () => {
        try {
            if (!selectedBrand) {
                return;
            }

            const collaborationCol = collection(FirestoreDB, "collaborations");
            const q = query(
                collaborationCol,
                where("brandId", "==", selectedBrand?.id),
                (active ? where("status", "in", ["active", "draft", "stopped"]) : where("status", "in", ["inactive"])),
                orderBy("timeStamp", "desc")
            );

            const unsubscribe = onSnapshot(q, async (querySnapshot) => {
                const proposals = await Promise.all(
                    querySnapshot.docs.map(async (doc) => {
                        const data = {
                            ...doc.data(),
                            id: doc.id,
                        };

                        // Fetch applications
                        const applicationCol = collection(
                            FirestoreDB,
                            "collaborations",
                            data.id,
                            "applications"
                        );
                        const applicationSnapshot = await getDocs(applicationCol);
                        const applications = applicationSnapshot.docs.map((appDoc) =>
                            appDoc.data()
                        );
                        const acceptedApplications = applications.filter(
                            (application) => application.status === "accepted"
                        ).length;

                        // Fetch invitations
                        const invitationCol = collection(
                            FirestoreDB,
                            "collaborations",
                            data.id,
                            "invitations"
                        );
                        const invitationSnapshot = await getDocs(invitationCol);
                        const invitations = invitationSnapshot.docs.map((invDoc) =>
                            invDoc.data()
                        );

                        return {
                            ...data,
                            applications: applications.length,
                            invitations: invitations.length,
                            acceptedApplications,
                        };
                    })
                );
                setProposals(proposals);
                setIsLoading(false);
            }, (error) => {
                setIsLoading(false);
            }, () => {
                setIsLoading(false);
            });

            return () => {
                unsubscribe();
            };
        } catch (error) {
            Console.error(error, "Error fetching proposals");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, [user, selectedBrand]);

    useEffect(() => {
        const checkAndRedirectIfNoCampaigns = async () => {
            if (!isLoading && proposals.length === 0 && selectedBrand) {
                const collaborationCol = collection(FirestoreDB, "collaborations");
                const countQuery = query(
                    collaborationCol,
                    where("brandId", "==", selectedBrand.id),
                    limit(1)
                );
                const snapshot = await getDocs(countQuery);
                if (snapshot.empty) {
                    router.replace("/create-collaboration");
                }
            }
        };
        checkAndRedirectIfNoCampaigns();
    }, [isLoading, proposals, selectedBrand]);

    const filteredProposals = proposals;

    if (isLoading) {
        return (
            <AppLayout>
                <View style={stylesFromFn.container}>
                    <ActivityIndicator size="large" color={Colors(theme).primary} />
                </View>
            </AppLayout>
        );
    }

    return (
        <View style={styles.root}>
            {filteredProposals.length === 0 ? (
                <EmptyState
                    image={require("@/assets/images/illustration6.png")}
                    subtitle="You have posted no collaborations yet! Your journey begins here"
                    title="No Collaborations posted"
                    action={() => router.push("/create-collaboration")}
                    actionLabel="Create Collaboration"
                />
            ) : (
                <View style={styles.listWrapper}>
                    <FlatList
                        data={filteredProposals}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={styles.cardOuter}>
                                <View style={[styles.cardInner, item.status === "draft" && styles.cardInnerDraft]}>
                                    <View key={item.id} style={styles.cardContent}>


                                        {item.attachments && item.attachments?.length > 0 && (
                                            <ScrollMedia
                                                theme={theme}
                                                MAX_WIDTH_WEB={MAX_WIDTH_WEB}
                                                media={item.attachments?.map(
                                                    //@ts-ignore
                                                    (attachment: MediaItem) =>
                                                        processRawAttachment(attachment)
                                                ) || []}
                                                xl={xl}
                                            />
                                        )}
                                        <Pressable style={styles.cardPressable} onPress={() =>
                                            router.push(`/collaboration-details/${item.id}`)
                                        }>

                                            {item.status === "draft" && (
                                                <View style={styles.draftBadge}>
                                                    <Text style={styles.draftBadgeText}>Draft</Text>
                                                </View>
                                            )}

                                            <View style={styles.detailsWrapper}>
                                                <CollaborationDetails
                                                    collabDescription={item.description || ""}
                                                    name={item.name || ""}
                                                    contentType={item.contentFormat}
                                                    location={item.location}
                                                    platform={item.platform}
                                                    promotionType={item.promotionType}
                                                    onOpenBottomSheet={(id) => openBottomSheet(id, item.status)}
                                                    collabId={item.id}
                                                />
                                            </View>

                                            <View>
                                                <CustomDivider thickness={2} />

                                                <CollaborationStats
                                                    budget={item.budget}
                                                    collabID={item.id}
                                                    influencerCount={item.numberOfInfluencersNeeded}
                                                />
                                            </View>
                                        </Pressable>

                                    </View>
                                </View>
                            </View>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        style={styles.flatList}
                        contentContainerStyle={styles.flatListContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={[Colors(theme).primary]}
                            />
                        }
                        numColumns={xl ? 2 : 1}
                        {...(xl && {
                            columnWrapperStyle: styles.columnWrapper,
                        })}
                    />
                </View>
            )}
            {isVisible && (
                <BottomSheetActions
                    cardId={selectedCollabId || ""}
                    cardType="activeCollab"
                    data={{ status: selectedCollabStatus }}
                    isVisible={isVisible}
                    onClose={closeBottomSheet}
                    snapPointsRange={["25%", "50%"]}
                    key={selectedCollabId}
                />
            )}
            {filteredProposals.length !== 0 && !xl && (
                <View style={styles.fabContainer}>
                    <Button
                        onPress={() => {
                            router.push({
                                pathname: "/create-collaboration",
                            });
                        }}
                        icon={({ size, color }) => (
                            <FontAwesomeIcon
                                icon={faPlus}
                                color={color}
                                size={size ?? 16}
                            />
                        )}
                    >
                        Create Collaboration
                    </Button>
                </View>
            )}
        </View>
    );
};

function useStyles(theme: ReturnType<typeof useTheme>, xl: boolean) {
    return StyleSheet.create({
        root: {
            width: "100%",
            flex: 1,
            position: "relative",
        },
        listWrapper: {
            flex: 1,
        },
        cardOuter: {
            flex: xl ? 1 : undefined,
            maxWidth: xl ? "50%" : undefined,
            width: xl ? undefined : "100%",
            backgroundColor: Colors(theme).primary,
            borderRadius: 14,
            shadowColor: Colors(theme).primary,
            shadowOffset: { width: 2, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
        },
        cardInner: {
            flex: 1,
            borderWidth: 2,
            borderColor: Colors(theme).primary,
            borderRadius: 12,
            backgroundColor: Colors(theme).card,
            borderStyle: "solid",
        },
        cardInnerDraft: {
            borderStyle: "dashed",
        },
        cardContent: {
            flex: 1,
            gap: 8,
            overflow: "hidden",
            borderRadius: 10,
        },
        cardPressable: {
            borderRadius: 10,
            overflow: "hidden",
            flex: 1,
            justifyContent: "space-between",
        },
        draftBadge: {
            position: "absolute",
            right: 10,
            top: 28,
            backgroundColor: Colors(theme).backdrop,
            padding: 4,
            borderRadius: 4,
            zIndex: 1,
        },
        draftBadgeText: {
            color: Colors(theme).white,
        },
        detailsWrapper: {
            flex: 1,
        },
        flatList: {
            flexGrow: 1,
            paddingBottom: 16,
            paddingHorizontal: 16,
            paddingTop: 8,
        },
        flatListContent: {
            gap: 16,
            paddingBottom: 64,
        },
        columnWrapper: {
            justifyContent: "space-between",
            gap: 16,
        },
        fabContainer: {
            position: "absolute",
            bottom: 0,
            right: 0,
            left: 0,
            paddingTop: 16,
            paddingHorizontal: 16,
        },
    });
}

export default CollaborationList;

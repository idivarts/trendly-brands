import InvitationCard from "@/components/card/collaboration-details/invitation-card";
import { InvitationCard as ProfileInvitationCard } from "@/components/card/profile-modal/invitation-card";
import Discover from "@/components/discover/Discover";
import InfluencerActionModal from "@/components/explore-influencers/InfluencerActionModal";
import { Text, View } from "@/components/theme/Themed";
import BottomSheetScrollContainer from "@/components/ui/bottom-sheet/BottomSheetWithScroll";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import TextInput from "@/components/ui/text-input";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useCollaborationContext } from "@/contexts/collaboration-context.provider";
import { useCollapseContext } from "@/contexts/CollapseContext";
import { useBreakpoints } from "@/hooks";
import { useInfluencers } from "@/hooks/request";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { APPROX_CARD_HEIGHT } from "@/shared-uis/components/carousel/carousel-util";
import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import { CarouselInViewProvider } from "@/shared-uis/components/scroller/CarouselInViewContext";
import CarouselScroller from "@/shared-uis/components/scroller/CarouselScroller";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { stylesFn } from "@/styles/collaboration-details/CollaborationDetails.styles";
import { User } from "@/types/User";
import { processRawAttachment } from "@/utils/attachments";
import { useTheme } from "@react-navigation/native";
import { collection, doc, setDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Platform, ScrollView, StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const InvitationsTabContent = (props: any) => {
    const theme = useTheme();
    const stylesFromFn = stylesFn(theme);
    const { isCollapsed } = useCollapseContext();
    const styles = useMemo(() => useLocalStyles(theme, isCollapsed), [theme, isCollapsed]);
    const [isActionModalVisible, setIsActionModalVisible] = useState(false);
    const [selectedInfluencer, setSelectedInfluencer] = useState<
        (User & { documentId: string }) | null
    >(null);
    const [isInvitationModalVisible, setIsInvitationModalVisible] =
        useState(false);
    const [message, setMessage] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const { getCollaborationById } = useCollaborationContext();
    const collaborationId = props.pageID;
    const [collaboration, setCollaboration] = useState<ICollaboration | null>(
        null
    );

    const {
        checkIfAlreadyInvited,
        influencers: rawInfluencers,
        isLoading,
        loadMore,
        onScrollEvent,
    } = useInfluencers({
        collaborationId,
    });

    const { xl, width: bpWidth, height: bpHeight } = useBreakpoints();
    const { manager } = useAuthContext();
    const { isOnFreeTrial, isProfileLocked } = useBrandContext();

    // const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    // const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
    const [openProfileModal, setOpenProfileModal] = useState(false);

    const insets = useSafeAreaInsets();
    const containerOffset = useSharedValue({
        top: insets.top,
        bottom: insets.bottom,
        left: insets.left,
        right: insets.right,
    });

    useEffect(() => {
        async function load() {
            const result = await getCollaborationById(collaborationId);
            setCollaboration(result);
        }
        load();
    }, [collaborationId]);

    const toggleActionModal = () => {
        setIsActionModalVisible(!isActionModalVisible);
    };

    const handleCollaborationInvite = async () => {
        try {
            if (!selectedInfluencer) return;

            setIsInviting(true);
            const invitationColRef = collection(
                FirestoreDB,
                "collaborations",
                collaborationId,
                "invitations"
            );

            const invitationPayload = {
                userId: selectedInfluencer.id,
                managerId: AuthApp.currentUser?.uid,
                collaborationId,
                status: "pending",
                message: message,
                timeStamp: Date.now(),
            };

            // Invitation Id as influencer id
            const invitationDocRef = doc(invitationColRef, selectedInfluencer.id);
            await setDoc(invitationDocRef, invitationPayload)
                .then(() => {
                    setIsInvitationModalVisible(false);
                    Toaster.success("Invitation sent successfully");
                })
                .then(() => {
                    HttpWrapper.fetch(
                        `/api/collabs/collaborations/${collaborationId}/invitations/${selectedInfluencer.id}`,
                        {
                            method: "POST",
                        }
                    );
                });
        } catch (error) {
            Console.error(error);
            Toaster.error("Failed to send invitation");
        } finally {
            setMessage("");
            setIsInviting(false);
        }
    };

    const influencers = rawInfluencers.filter((i) => {
        return !(manager?.moderations?.blockedInfluencers || []).includes(i.id);
    });

    // view mode: 'discover' shows the brand-matched influencer grid
    // 'invitations' shows the existing carousel of invitation candidates
    const [viewMode, setViewMode] = useState<"discover" | "invitations">(
        "discover"
    );
    const [statusFilter, setStatusFilter] = useState<string>("pending");

    const handleStatusChange = (status: string) => {
        setStatusFilter(status);
        // You can add logic here to filter the influencers list based on status
        // For example, call an API or filter the rawInfluencers array
    };

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

    if (influencers.length === 0 && !isLoading) {
        return (
            <EmptyState
                subtitle="No invitations yet. Check back later."
                image={require("@/assets/images/illustration5.png")}
                hideAction
            />
        );
    }

    const width = bpWidth;
    const height = Math.min(APPROX_CARD_HEIGHT, bpHeight);

    console.log("Default Advance Filters", collaboration?.preferences);


    return (
        <View style={styles.root}>
            {/* Toggle Bar */}
            {/* <View
        style={{
          paddingHorizontal: 16,
          maxWidth: 800,
          width: "100%",
          alignSelf: "center",
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          <Button mode="outlined" onPress={() => router.push("/discover")}>
            Advance Filter
          </Button>
        </View>

        <ToggleBar
          options={[
            { key: "discover", label: "Suggested Spotlight" },
            { key: "invitations", label: "Spotlight Influencer" },
          ]}
          value={viewMode}
          onChange={(k) => setViewMode(k as "discover" | "invitations")}
          style={{
            height: 40,
            backgroundColor: Colors(theme).border,
            borderRadius: 12,
            overflow: "hidden",
            shadowColor: Colors(theme).modalBackground,
            shadowOpacity: 0.2,
          }}
        />
      </View> */}

            {viewMode === "discover" ? (
                collaboration ? (
                    <View
                        style={[styles.discoverWrapper, Platform.OS === "web" && styles.discoverWrapperWeb]}
                    >
                        {Platform.OS === "web" ? (
                            <ScrollView
                                style={styles.webScrollView}
                                contentContainerStyle={styles.webScrollContent}
                                showsVerticalScrollIndicator={true}
                                keyboardShouldPersistTaps="handled"
                            >
                                <Discover
                                    showRightPanel={false}
                                    showTopPanel={false}
                                    isStatusCard={false}
                                    defaultAdvanceFilters={collaboration?.preferences}
                                    useStoredFilters={false}
                                    skipGuideTour={true}
                                />
                            </ScrollView>
                        ) : (
                            <Discover
                                showRightPanel={false}
                                showTopPanel={false}
                                isStatusCard={false}
                                defaultAdvanceFilters={collaboration?.preferences}
                                useStoredFilters={false}
                                skipGuideTour={true}
                            />
                        )}
                    </View>
                ) : (
                    <View style={styles.loadingCenter}>
                        <ActivityIndicator />
                    </View>
                )
            ) : (
                <CarouselInViewProvider>
                    <CarouselScroller
                        data={influencers}
                        height={height}
                        width={width}
                        vertical={true}
                        onLoadMore={() => loadMore()}
                        renderItem={({ item }) => (
                            <InvitationCard
                                checkIfAlreadyInvited={checkIfAlreadyInvited}
                                // @ts-ignore
                                data={item}
                                profileModalAction={() => {
                                    // @ts-ignore
                                    setSelectedInfluencer(item);
                                    setOpenProfileModal(true);
                                }}
                                bottomSheetAction={() => {
                                    // @ts-ignore
                                    setSelectedInfluencer(item);
                                    setIsActionModalVisible(true);
                                }}
                                inviteInfluencer={() => {
                                    // @ts-ignore
                                    setSelectedInfluencer(item);
                                    setIsInvitationModalVisible(true);
                                }}
                            />
                        )}
                        objectKey="id"
                    />
                </CarouselInViewProvider>
            )}

            <Modal
                visible={isInvitationModalVisible}
                transparent
                animationType="slide"
                onDismiss={() => setIsInvitationModalVisible(false)}
                onRequestClose={() => setIsInvitationModalVisible(false)}
            >
                <View style={stylesFromFn.messageModalContainer}>
                    <View style={stylesFromFn.messageModalContent}>
                        <Text style={stylesFromFn.modalTitle}>Enter Invitation Message</Text>
                        <TextInput
                            style={stylesFromFn.messageInput}
                            placeholder="Type your message here"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                        />
                        <View style={stylesFromFn.buttonContainer}>
                            <Button
                                mode="outlined"
                                onPress={() => setIsInvitationModalVisible(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => {
                                    handleCollaborationInvite();
                                }}
                                loading={isInviting}
                            >
                                Send Invitation
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <InfluencerActionModal
                influencerId={selectedInfluencer?.id}
                isModalVisible={isActionModalVisible}
                openProfile={() => setOpenProfileModal(true)}
                toggleModal={toggleActionModal}
            />
            <BottomSheetScrollContainer
                isVisible={openProfileModal}
                snapPointsRange={["90%", "90%"]}
                onClose={() => {
                    setOpenProfileModal(false);
                }}
            >
                <ProfileBottomSheet
                    closeModal={() => setOpenProfileModal(false)}
                    isOnFreePlan={isOnFreeTrial}
                    lockProfile={isProfileLocked(selectedInfluencer?.id || "")}
                    actionCard={
                        <View style={styles.actionCardWrapper}>
                            <ProfileInvitationCard
                                checkIfAlreadyInvited={checkIfAlreadyInvited}
                                influencerId={selectedInfluencer?.id}
                                onInvite={() => {
                                    if (!selectedInfluencer) return;
                                    setOpenProfileModal(false);
                                    setIsInvitationModalVisible(true);
                                }}
                            />
                        </View>
                    }
                    carouselMedia={selectedInfluencer?.profile?.attachments?.map(
                        (attachment: Attachment) => processRawAttachment(attachment)
                    )}
                    FireStoreDB={FirestoreDB}
                    influencer={selectedInfluencer as User}
                    isBrandsApp={true}
                    theme={theme}
                />
            </BottomSheetScrollContainer>
        </View>
    );
};

function useLocalStyles(theme: ReturnType<typeof useTheme>, isCollapsed: boolean) {
    return StyleSheet.create({
        root: {
            alignSelf: "stretch",
            flex: 1,
            height: "100%",
            minHeight: 0,
            ...(Platform.OS === "web" && { overflow: "hidden" as const }),
        },
        discoverWrapper: {
            flex: 1,
            minHeight: 0,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            paddingTop: 12,
            paddingBottom: 24,
            gap: isCollapsed ? 20 : 8,
            paddingRight: isCollapsed ? 120 : 8,
            paddingLeft: isCollapsed ? 120 : 8,
        },
        discoverWrapperWeb: {
            flexDirection: "column" as const,
            flexWrap: "nowrap" as const,
        },
        webScrollView: {
            flex: 1,
            minHeight: 0,
        },
        webScrollContent: {
            flexGrow: 1,
        },
        loadingCenter: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 16,
        },
        actionCardWrapper: {
            backgroundColor: Colors(theme).transparent,
            marginHorizontal: 16,
        },
    });
}

export default InvitationsTabContent;

import InvitationCard from "@/components/card/collaboration-details/invitation-card";
import {
  InvitationCard as ProfileInvitationCard
} from "@/components/card/profile-modal/invitation-card";
import InfluencerActionModal from "@/components/explore-influencers/InfluencerActionModal";
import { Text, View } from "@/components/theme/Themed";
import BottomSheetScrollContainer from "@/components/ui/bottom-sheet/BottomSheetWithScroll";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import TextInput from "@/components/ui/text-input";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { useInfluencers } from "@/hooks/request";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { APPROX_CARD_HEIGHT, MAX_WIDTH_WEB } from "@/shared-uis/components/carousel/carousel-util";
import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import { CarouselInViewProvider } from "@/shared-uis/components/scroller/CarouselInViewContext";
import CarouselScroller from "@/shared-uis/components/scroller/CarouselScroller";
import SlowLoader from "@/shared-uis/components/SlowLoader";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { stylesFn } from "@/styles/collaboration-details/CollaborationDetails.styles";
import { User } from "@/types/User";
import { processRawAttachment } from "@/utils/attachments";
import { useTheme } from "@react-navigation/native";
import { collection, doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Dimensions,
  Modal
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const InvitationsTabContent = (props: any) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<(User & { documentId: string }) | null>(null);
  const [isInvitationModalVisible, setIsInvitationModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const collaborationId = props.pageID;

  const {
    checkIfAlreadyInvited,
    influencers: rawInfluencers,
    isLoading,
    loadMore,
    onScrollEvent
  } = useInfluencers({
    collaborationId,
  });

  const {
    xl,
  } = useBreakpoints();
  const { manager } = useAuthContext()
  const { isOnFreeTrial, isProfileLocked } = useBrandContext()

  // const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  // const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
  const [openProfileModal, setOpenProfileModal] = useState(false)

  const insets = useSafeAreaInsets();
  const containerOffset = useSharedValue({
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
  });

  const toggleActionModal = () => {
    setIsActionModalVisible(!isActionModalVisible);
  }

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
      };

      // Invitation Id as influencer id
      const invitationDocRef = doc(invitationColRef, selectedInfluencer.id);
      await setDoc(invitationDocRef, invitationPayload).then(() => {
        setIsInvitationModalVisible(false);
        Toaster.success("Invitation sent successfully");
      }).then(() => {
        HttpWrapper.fetch(`/api/collabs/collaborations/${collaborationId}/invitations/${selectedInfluencer.id}`, {
          method: "POST",
        })
      });
    } catch (error) {
      Console.error(error);
      Toaster.error("Failed to send invitation");
    } finally {
      setMessage("");
      setIsInviting(false);
    }
  };

  const influencers = rawInfluencers.filter(i => {
    return !(manager?.moderations?.blockedInfluencers || []).includes(i.id)
  })

  if (influencers.length === 0 && isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
        }}
      >
        <SlowLoader />
      </View>
    );
  }

  if (influencers.length === 0) {
    return (
      <EmptyState
        subtitle="No invitations yet. Check back later."
        image={require("@/assets/images/illustration5.png")}
        hideAction
      />
    );
  };

  const width = Math.min(MAX_WIDTH_WEB, Dimensions.get('window').width);
  const height = Math.min(APPROX_CARD_HEIGHT, Dimensions.get('window').height);

  return (
    <View style={{ alignSelf: "stretch", height: "100%" }}>
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
                setOpenProfileModal(true)
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

      <Modal
        visible={isInvitationModalVisible}
        transparent
        animationType="slide"
        onDismiss={() => setIsInvitationModalVisible(false)}
        onRequestClose={() => setIsInvitationModalVisible(false)}
      >
        <View style={styles.messageModalContainer}>
          <View style={styles.messageModalContent}>
            <Text style={styles.modalTitle}>Enter Invitation Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here"
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <View style={styles.buttonContainer}>

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

      <InfluencerActionModal influencerId={selectedInfluencer?.id} isModalVisible={isActionModalVisible} openProfile={() => setOpenProfileModal(true)} toggleModal={toggleActionModal} />
      <BottomSheetScrollContainer
        isVisible={openProfileModal}
        snapPointsRange={["90%", "90%"]}
        onClose={() => { setOpenProfileModal(false) }}
      >
        <ProfileBottomSheet
          closeModal={() => setOpenProfileModal(false)}
          isOnFreePlan={isOnFreeTrial}
          lockProfile={isProfileLocked(selectedInfluencer?.id || "")}
          actionCard={
            <View
              style={{
                backgroundColor: Colors(theme).transparent,
                marginHorizontal: 16,
              }}
            >
              <ProfileInvitationCard
                checkIfAlreadyInvited={checkIfAlreadyInvited}
                influencerId={selectedInfluencer?.id}
                onInvite={() => {
                  if (!selectedInfluencer) return;
                  setOpenProfileModal(false)
                  setIsInvitationModalVisible(true);
                }}
              />
            </View>
          }
          carouselMedia={selectedInfluencer?.profile?.attachments?.map((attachment: Attachment) => processRawAttachment(attachment))}
          FireStoreDB={FirestoreDB}
          influencer={selectedInfluencer as User}
          isBrandsApp={true}
          theme={theme}
        />
      </BottomSheetScrollContainer>
    </View>
  );
};

export default InvitationsTabContent;

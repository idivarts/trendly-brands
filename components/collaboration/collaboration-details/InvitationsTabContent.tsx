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
import { MAX_WIDTH_WEB } from "@/constants/Container";
import { useAuthContext } from "@/contexts";
import { useBreakpoints } from "@/hooks";
import { useInfluencers } from "@/hooks/request";
import { IOScroll } from "@/shared-libs/contexts/scroll-context";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { APPROX_CARD_HEIGHT } from "@/shared-uis/components/carousel/carousel-util";
import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { stylesFn } from "@/styles/collaboration-details/CollaborationDetails.styles";
import { User } from "@/types/User";
import { processRawAttachment } from "@/utils/attachments";
import { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { collection, doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
    onScrollEvent
  } = useInfluencers({
    collaborationId,
  });

  const {
    xl,
  } = useBreakpoints();
  const { manager } = useAuthContext()

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

  const renderBackdrop = (props: any) => {
    return (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    );
  };

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
        HttpWrapper.fetch(`/api/v1/collaborations/${collaborationId}/invitations/${selectedInfluencer.id}`, {
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
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

  return (
    <IOScroll onScroll={(ev) => {
      onScrollEvent(ev)
    }}>
      <FlashList
        refreshing={isLoading}
        data={influencers}
        estimatedItemSize={APPROX_CARD_HEIGHT}
        // initialNumToRender={5}
        // maxToRenderPerBatch={10}
        // windowSize={5}
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
        ListFooterComponent={
          isLoading ? (
            <ActivityIndicator
              size="large"
            />
          ) : null
        }
        // onEndReached={loadMore}
        // onEndReachedThreshold={0.1}
        keyExtractor={(item) => item.id}
        style={{
          paddingBottom: 16,
          width: xl ? MAX_WIDTH_WEB : '100%',
          marginHorizontal: "auto",
        }}
        ItemSeparatorComponent={
          () => (
            <View
              style={{
                height: 16,
                backgroundColor: !xl ? (theme.dark ? Colors(theme).background : Colors(theme).aliceBlue) : "unset",
              }}
            />
          )
        }
      />

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
                mode="contained"
                onPress={() => {
                  handleCollaborationInvite();
                }}
                loading={isInviting}
              >
                Send Invitation
              </Button>
              <Button
                mode="outlined"
                onPress={() => setIsInvitationModalVisible(false)}
              >
                Cancel
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
    </IOScroll >
  );
};

export default InvitationsTabContent;

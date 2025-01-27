import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import {
  List,
} from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import { stylesFn } from "@/styles/collaboration-details/CollaborationDetails.styles";
import { FirestoreDB } from "@/utils/firestore";
import { collection, doc, setDoc } from "firebase/firestore";
import { AuthApp } from "@/utils/auth";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useInfluencers } from "@/hooks/request";
import EmptyState from "@/components/ui/empty-state";
import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import BottomSheetContainer from "@/shared-uis/components/bottom-sheet";
import InvitationCard from "@/components/card/collaboration-details/invitation-card";
import {
  InvitationCard as ProfileInvitationCard
} from "@/components/card/profile-modal/invitation-card";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSharedValue } from "react-native-reanimated";
import { processRawAttachment } from "@/utils/attachments";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { User } from "@/types/User";
import { Text, View } from "@/components/theme/Themed";
import TextInput from "@/components/ui/text-input";
import Button from "@/components/ui/button";
import { MAX_WIDTH_WEB } from "@/constants/Container";

const InvitationsTabContent = (props: any) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<User | null>(null);
  const [isInvitationModalVisible, setIsInvitationModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const collaborationId = props.pageID;

  const {
    isInitialLoading,
    checkIfAlreadyInvited,
    fetchInitialInfluencers,
    setInfluencers,
    fetchMoreInfluencers,
    influencers,
    isLoading,
  } = useInfluencers({
    collaborationId,
  });

  const {
    xl,
  } = useBreakpoints();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

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

  const handleActionModalClose = () => {
    setIsActionModalVisible(false);
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
      });
    } catch (error) {
      console.error(error);
      Toaster.error("Failed to send invitation");
    } finally {
      setMessage("");
      setIsInviting(false);
    }
  };

  if (isInitialLoading) {
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
    <>
      <FlatList
        refreshing={isLoading}
        onRefresh={() => {
          setInfluencers([]);
          fetchInitialInfluencers();
        }}
        data={influencers}
        renderItem={({ item }) => (
          <InvitationCard
            checkIfAlreadyInvited={checkIfAlreadyInvited}
            data={item}
            profileModalAction={() => {
              setSelectedInfluencer(item);
              setTimeout(() => {
                bottomSheetModalRef.current?.present();
              }, 500);
            }}
            bottomSheetAction={() => {
              setSelectedInfluencer(item);
              setIsActionModalVisible(true);
            }}
            inviteInfluencer={() => {
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
        onEndReached={fetchMoreInfluencers}
        onEndReachedThreshold={0.1}
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
                backgroundColor: theme.dark ? Colors(theme).background : Colors(theme).aliceBlue,
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

      {
        isActionModalVisible && (
          <BottomSheetContainer
            isVisible={isActionModalVisible}
            onClose={toggleActionModal}
            snapPoints={["25%", "50%"]}
          >
            <List.Section
              style={{
                paddingBottom: 28
              }}
            >
              <List.Item
                title="Invite User"
                onPress={() => {
                  setIsActionModalVisible(false);
                  setTimeout(() => {
                    setIsInvitationModalVisible(true);
                  }, 200);
                }}
              />
              <List.Item
                title="Message User"
                onPress={() => {
                  console.log("Message User");
                }}
              />
            </List.Section>
          </BottomSheetContainer>
        )
      }

      <BottomSheetModal
        backdropComponent={renderBackdrop}
        containerOffset={containerOffset}
        enablePanDownToClose={true}
        index={2}
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        topInset={insets.top}
      >
        <BottomSheetScrollView>
          <ProfileBottomSheet
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
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
};

export default InvitationsTabContent;

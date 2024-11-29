import React, { useState } from "react";
import {
  View,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  Text,
  Button,
} from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import { stylesFn } from "@/styles/collaboration-details/CollaborationDetails.styles";
import InfluencerCard from "@/components/InfluencerCard";
import { FirestoreDB } from "@/utils/firestore";
import { addDoc, collection } from "firebase/firestore";
import BottomSheetActions from "@/components/BottomSheetActions";
import { AuthApp } from "@/utils/auth";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useInfluencers } from "@/hooks/request";
import EmptyState from "@/components/ui/empty-state";
import Colors from "@/constants/Colors";

const InvitationsTabContent = (props: any) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const {
    isInitialLoading,
    checkIfAlreadyInvited,
    fetchInitialInfluencers,
    setInfluencers,
    fetchMoreInfluencers,
    influencers,
    isLoading,
  } = useInfluencers({
    pageID: props.pageID,
  });

  const handleCollaborationInvite = async () => {
    try {
      setIsInviting(true);
      const invitationRef = collection(
        FirestoreDB,
        "collaborations",
        props.pageID,
        "invitations"
      );

      const invitationPayload = {
        userId: selectedInfluencer.influencerID,
        managerId: AuthApp.currentUser?.uid,
        collaborationId: selectedInfluencer.collaborationID,
        status: "pending",
        message: message,
      };

      await addDoc(invitationRef, invitationPayload).then(() => {
        setIsMessageModalVisible(false);
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
          <InfluencerCard
            type="invitation"
            alreadyInvited={checkIfAlreadyInvited}
            influencer={{
              id: item.id,
              profilePic: item.profileImage,
              name: item.name,
              handle: item.handle || "@handle",
              media: [
                {
                  type: "image",
                  url: item.profileImage,
                },
              ],
              followers: item.backend ? item.backend.followers : 1000,
              reach: item.backend ? item.backend.reach : 10000,
              rating: item.backend ? item.backend.rating : 4.5,
              bio: "I am a content creator",
              jobsCompleted: 12,
              successRate: 100,
            }}
            ToggleModal={() => {
              setIsVisible(true);
              setSelectedInfluencer({
                collaborationID: props.pageID,
                influencerID: item.id,
              });
            }}
            ToggleMessageModal={() => {
              setIsMessageModalVisible(true);
              setSelectedInfluencer({
                collaborationID: props.pageID,
                influencerID: item.id,
              });
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
        visible={isMessageModalVisible}
        transparent
        animationType="slide"
        onDismiss={() => setIsMessageModalVisible(false)}
        onRequestClose={() => setIsMessageModalVisible(false)}
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
                onPress={handleCollaborationInvite}
                loading={isInviting}
              >
                Send Invitation
              </Button>
              <Button
                mode="outlined"
                onPress={() => setIsMessageModalVisible(false)}
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      {
        isVisible && (
          <BottomSheetActions
            cardType="invitationCard"
            isVisible={isVisible}
            onClose={() => setIsVisible(false)}
            snapPointsRange={["30%", "80%"]}
            cardId={selectedInfluencer}
            key={selectedInfluencer.collaborationID}
          />
        )
      }
    </>
  );
};

export default InvitationsTabContent;

import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Button,
} from "react-native";
import {
  Text,
  Chip,
  Appbar,
  Card,
  Paragraph,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import { stylesFn } from "@/styles/CollaborationDetails.styles";
import InfluencerCard from "@/components/InfluencerCard";
import { FirestoreDB } from "@/utils/firestore";
import { collection, doc, getDoc, getDocs, addDoc } from "firebase/firestore";
import BottomSheetActions from "@/components/BottomSheetActions";
import Toast from "react-native-toast-message";
import { AuthApp } from "@/utils/auth";
import Toaster from "@/shared-uis/components/toaster/Toaster";

const CollaborationInvitationPage = (props: any) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [isVisible, setIsVisible] = useState(false);
  const [influencers, setInfluencers] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
  const [alreadyInvited, setAlreadyInvited] = useState<any>([]);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [message, setMessage] = useState("");

  const fetchInvitations = async () => {
    try {
      const invitationRef = collection(
        FirestoreDB,
        "collaborations",
        props.pageID,
        "invitations"
      );
      const invitationFetch = await getDocs(invitationRef);
      const invitations = invitationFetch.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id,
        } as any;
      });

      const influencers = await Promise.all(
        invitations.map(async (invitation) => {
          const userRef = doc(FirestoreDB, "users", invitation.userId);
          const userFetch = await getDoc(userRef);
          return {
            ...userFetch.data(),
            id: userFetch.id,
          } as any;
        })
      );

      const alreadyInvited = influencers.map((influencer) => influencer.id);
      setAlreadyInvited(alreadyInvited);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInfluencers = async () => {
    const influencerRef = collection(FirestoreDB, "users");
    const influencerFetch = await getDocs(influencerRef);
    const influencers = influencerFetch.docs.map((doc) => {
      return {
        ...doc.data(),
        id: doc.id,
      } as any;
    });
    setInfluencers(influencers);
  };

  const filterInfluencers = () => {
    if (alreadyInvited.length === 0) return influencers;
    return influencers.map((influencer: any) => {
      if (alreadyInvited.includes(influencer.id)) {
        return {
          ...influencer,
          alreadyInvited: true,
        };
      } else {
        return {
          ...influencer,
          alreadyInvited: false,
        };
      }
    });
  };

  useEffect(() => {
    fetchInvitations();
    fetchInfluencers();
  }, []);

  const handleInviteCollaboration = async () => {
    try {
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
        fetchInfluencers();
        fetchInvitations();
      });
    } catch (error) {
      console.log(error);
      Toaster.error("Failed to send invitation");
    } finally {
      setMessage("");
    }
  };

  if (loading) {
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

  return influencers.length !== 0 ? (
    <>
      <Toast />
      <FlatList
        data={filterInfluencers()}
        renderItem={({ item }) => (
          <InfluencerCard
            type="invitation"
            alreadyInvited={item.alreadyInvited}
            influencer={{
              profilePic: item.profileImage,
              name: item.name,
              handle: item.handle || "@handle",
              media: [
                {
                  type: "image",
                  uri: item.profileImage,
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
        keyExtractor={(item) => item.id}
        style={{
          padding: 16,
          paddingBottom: 100,
        }}
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
                title="Send Invitation"
                onPress={handleInviteCollaboration}
              />
              <Button
                title="Cancel"
                color="red"
                onPress={() => setIsMessageModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
      {isVisible && (
        <BottomSheetActions
          cardType="invitationCard"
          isVisible={isVisible}
          onClose={() => setIsVisible(false)}
          snapPointsRange={["30%", "80%"]}
          cardId={selectedInfluencer}
          key={selectedInfluencer.collaborationID}
        />
      )}
    </>
  ) : (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 40,
      }}
    >
      <Image
        source={{
          uri:
            props.logo ||
            "https://cdni.iconscout.com/illustration/premium/thumb/connection-lost-illustration-download-in-svg-png-gif-file-formats--404-error-empty-state-page-not-found-pack-design-development-illustrations-6632144.png?f=webp",
        }}
        style={{
          height: 200,
          width: 200,
        }}
      />
      <Text
        style={{
          fontSize: 16,
          color: theme.colors.text,
        }}
      >
        No invitations yet. Check back later.
      </Text>
    </View>
  );
};

export default CollaborationInvitationPage;

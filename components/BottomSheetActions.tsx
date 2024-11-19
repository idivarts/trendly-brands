import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { List } from "react-native-paper";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useChatContext, useNotificationContext } from "@/contexts";
import { FirestoreDB } from "@/utils/firestore";
import { doc, updateDoc } from "firebase/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";

interface BottomSheetActionsProps {
  cardType:
  | "influencerType"
  | "promotionType"
  | "influencerCard"
  | "applicationCard"
  | "invitationCard"
  | "activeCollab";
  data?: any; // TODO: Update with the correct type
  cardId?: any;
  isVisible: boolean;
  snapPointsRange: [string, string];
  onClose: () => void;
}

const BottomSheetActions = ({
  cardType,
  cardId,
  data,
  isVisible,
  snapPointsRange,
  onClose,
}: BottomSheetActionsProps) => {
  const sheetRef = React.useRef<BottomSheet>(null);
  const [isMessageModalVisible, setIsMessageModalVisible] =
    React.useState(false);

  const {
    createGroupWithMembers,
    client,
  } = useChatContext();
  const {
    createNotification,
  } = useNotificationContext();

  // Adjust snap points for the bottom sheet height
  const snapPoints = React.useMemo(
    () => [snapPointsRange[0], snapPointsRange[1]],
    []
  );

  const handleClose = () => {
    if (sheetRef.current) {
      sheetRef.current.close();
    }
    onClose(); // Close the modal after the bottom sheet closes
  };

  const handleAcceptApplication = async () => {
    try {
      const applicationRef = doc(
        FirestoreDB,
        "collaborations",
        cardId.collaborationID,
        "applications",
        cardId.applicationID
      );
      await updateDoc(applicationRef, {
        status: "accepted",
      }).then(() => {
        // @ts-ignore
        createGroupWithMembers(client, data.collaboration.name, [
          // @ts-ignore
          client.user?.id as string,
          cardId.influencerID,
        ]).then(() => {
          createNotification(
            cardId.influencerID,
            {
              data: {
                collaborationId: data.collaboration.id,
              },
              title: "Application Accepted",
              description: `Your application for ${data.collaboration.name} has been accepted`,
              timeStamp: Date.now(),
              isRead: false,
              type: "application-accepted",
            },
            "users"
          );
        });

        handleClose();

        Toaster.success("Application accepted successfully");
      });
    } catch (error) {
      console.error(error);
      handleClose();
      Toaster.error("Failed to accept application");
    }
  };

  const handleRejectApplication = async () => {
    try {
      const applicationRef = doc(
        FirestoreDB,
        "collaborations",
        cardId.collaborationID,
        "applications",
        cardId.applicationID
      );
      await updateDoc(applicationRef, {
        status: "rejected",
      }).then(() => {
        handleClose();
        Toaster.success("Application rejected successfully");
      });
    } catch (error) {
      console.error(error);
      handleClose();
      Toaster.error("Failed to reject application");
    }
  };

  const delistCollaboration = async () => {
    try {
      const collaborationRef = doc(FirestoreDB, "collaborations", cardId);
      await updateDoc(collaborationRef, {
        status: "inactive",
      }).then(() => {
        handleClose();
        Toaster.success("Collaboration delisted successfully");
      });
    } catch (error) {
      console.error(error);
      handleClose();
      Toaster.error("Failed to delist collaboration");
    }
  };

  const renderContent = () => {
    switch (cardType) {
      case "influencerType":
        return (
          <View style={{ padding: 20 }}>
            <Text>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem optio
              possimus asperiores ad adipisci quo architecto quibusdam quaerat,
              fugiat, et quae dignissimos consequuntur itaque sint accusamus
              animi error saepe aperiam, doloremque quasi.
            </Text>
          </View>
        );
      case "promotionType":
        return (
          <View style={{ padding: 20 }}>
            <Text>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem optio
              possimus asperiores ad adipisci quo architecto quibusdam quaerat,
              fugiat, et quae dignissimos consequuntur itaque sint accusamus
              animi error saepe aperiam, doloremque quasi.
            </Text>
          </View>
        );

      case "influencerCard":
        return (
          <List.Section style={{ paddingBottom: 20 }}>
            <List.Item
              title="View Profile"
              onPress={() => {
                handleClose();
              }}
            />
            <List.Item
              title="Send Message"
              onPress={() => {
                handleClose();
              }}
            />
            <List.Item
              title="Block Influencer"
              onPress={() => {
                handleClose();
              }}
            />
          </List.Section>
        );

      case "applicationCard":
        return (
          <List.Section style={{ paddingBottom: 20 }}>
            <List.Item
              title="Send Message"
              onPress={() => {
                handleClose();
              }}
            />
            <List.Item
              title="Accept Application"
              onPress={() => {
                handleAcceptApplication();
              }}
            />
            <List.Item
              title="Reject Application"
              onPress={() => {
                handleRejectApplication();
              }}
            />
          </List.Section>
        );

      case "invitationCard":
        return (
          <List.Section style={{ paddingBottom: 20 }}>
            <List.Item
              title="View Profile"
              onPress={() => {
                handleClose();
              }}
            />
            <List.Item
              title="Send Message"
              onPress={() => {
                handleClose();
              }}
            />
            <List.Item
              title="Invite to Collaboration"
              onPress={() => {
                setIsMessageModalVisible(true);
              }}
            />
          </List.Section>
        );
      case "activeCollab":
        return (
          <List.Section style={{ paddingBottom: 20 }}>
            <List.Item
              title="View Collaboration"
              onPress={() => {
                handleClose();
              }}
            />
            <List.Item
              title="Delist Collaboration"
              onPress={() => {
                delistCollaboration();
              }}
            />
          </List.Section>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose} // Closes when Android back button is pressed
    >
      {/* Bottom Sheet */}
      <View style={styles.bottomSheetContainer}>
        <BottomSheet
          ref={sheetRef}
          index={0} // Snap to the first point when opened
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={() => {
            // Dismiss when tapping outside
            return <Pressable style={styles.overlay} onPress={handleClose} />;
          }}
          onClose={handleClose}
          style={styles.bottomSheet} // Ensure it's on top of everything
        >
          <BottomSheetView>{renderContent()}</BottomSheetView>
        </BottomSheet>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
    zIndex: 2,
  },
  bottomSheet: {
    zIndex: 9999,
  },
});

export default BottomSheetActions;

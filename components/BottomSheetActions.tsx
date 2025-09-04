import { useChatContext } from "@/contexts";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { List } from "react-native-paper";

interface BottomSheetActionsProps {
  cardType:
  | "influencerType"
  | "promotionType"
  | "influencerCard"
  | "applicationCard"
  | "invitationCard"
  | "activeCollab"
  | "contract";
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
  const router = useRouter();
  const { openModal } = useConfirmationModel()

  const { connectUser } = useChatContext();

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(
      "https://creators.trendly.now/collaboration/" + cardId
    );
  };

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
        HttpWrapper.fetch(`/api/collabs/collaborations/${cardId.collaborationID}/applications/${cardId.influencerID}/accept`, {
          method: "POST",
        }).then(async (res) => {
          Toaster.success("Application accepted successfully");
          const body = await res.json()
          await connectUser();
          router.navigate(`/channel/${body.channel.cid}`);
        })
        handleClose();

        Toaster.success("Application accepted successfully");
      });
    } catch (error) {
      Console.error(error);
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
        HttpWrapper.fetch(`/api/collabs/collaborations/${cardId.collaborationID}/applications/${cardId.influencerID}/reject`, {
          method: "POST",
        })
        handleClose();
        Toaster.success("Application rejected successfully");
      });
    } catch (error) {
      Console.error(error);
      handleClose();
      Toaster.error("Failed to reject application");
    }
  };

  const deleteCollaboration = async () => {
    handleClose();
    openModal({
      title: "Delist Collaboration",
      description: "This would completely delete the collaboration and you would no longer be able to recover this",
      confirmText: "Delete Collaboration",
      confirmAction: async () => {
        try {
          const collaborationRef = doc(FirestoreDB, "collaborations", cardId);
          await updateDoc(collaborationRef, {
            status: "deleted",
          }).then(() => {
            Toaster.success("Collaboration delisted successfully");
          });
        } catch (error) {
          Console.error(error);
          Toaster.error("Failed to delist collaboration");
        }
      }
    })

  };
  const stopCollaboration = async () => {
    handleClose();
    openModal({
      title: "Stop Collaboration",
      description: "This means you have either already hired or changed your mind and hence no longer want to receive new applications",
      confirmText: "Stop Collaboration",
      confirmAction: async () => {
        try {
          const collaborationRef = doc(FirestoreDB, "collaborations", cardId);
          await updateDoc(collaborationRef, {
            status: "stopped",
          }).then(() => {
            Toaster.success("Collaboration Stopped successfully");
          });
        } catch (error) {
          Console.error(error);
          Toaster.error("Failed to delist collaboration");
        }
      }
    })

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
          <List.Section style={{ paddingBottom: 28 }}>
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
          <List.Section style={{ paddingBottom: 28 }}>
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
          <List.Section style={{ paddingBottom: 28 }}>
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
          <List.Section style={{ paddingBottom: 28 }}>
            <List.Item
              title="View Collaboration"
              onPress={() => {
                handleClose();
                router.push(`/collaboration-details/${cardId}`);
              }}
            />
            <List.Item
              title="Edit Collaboration"
              onPress={() => {
                handleClose();
                router.push({
                  pathname: "/edit-collaboration",
                  params: {
                    id: cardId,
                  },
                });
              }}
            />
            <List.Item
              title="Copy Link"
              onPress={async () => {
                await copyToClipboard();
                Toaster.success("Link copied to clipboard");
              }}
            />
            <List.Item
              title="Delete Collaboration"
              onPress={() => {
                deleteCollaboration();
              }}
            />
            <List.Item
              title="Stop Collaboration"
              onPress={() => {
                stopCollaboration();
              }}
            />
          </List.Section>
        );
      case "contract":
        return (
          <List.Section style={{ paddingBottom: 28 }}>
            <List.Item
              title="View Collaboration"
              onPress={() => {
                handleClose();
                router.push(`/collaboration-details/${cardId}`);
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
          index={1} // Snap to the first point when opened
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

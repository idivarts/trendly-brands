import Colors from "@/shared-uis/constants/Colors";
import { useChatContext, useCollaborationContext } from "@/contexts";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
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
    const { updateCollaboration } = useCollaborationContext();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = React.useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: colors.backdrop,
                },
                bottomSheetContainer: {
                    flex: 1,
                    justifyContent: "flex-end",
                    zIndex: 2,
                },
                bottomSheet: {
                    zIndex: 9999,
                },
                /** Gorhom default surface is light on web; must match theme for title contrast. */
                sheetSurface: {
                    backgroundColor: colors.card,
                },
                sheetHandle: {
                    backgroundColor: colors.secondaryBorder,
                },
                sheetContent: {
                    flex: 1,
                    backgroundColor: colors.card,
                },
                listSection: {
                    paddingBottom: 28,
                    backgroundColor: colors.card,
                },
                actionTitle: {
                    color: colors.text,
                    fontSize: 16,
                },
                placeholderBox: {
                    padding: 20,
                    backgroundColor: colors.card,
                },
                placeholderText: {
                    color: colors.text,
                    fontSize: 15,
                    lineHeight: 22,
                },
            }),
        [colors]
    );

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

    const delistCollaboration = async () => {
        handleClose();
        openModal({
            title: "Delist Collaboration",
            description: "This would delist the collaboration and you can still access the campaign in the past campaigns section",
            confirmText: "Delist Collaboration",
            confirmAction: async () => {
                try {
                    await updateCollaboration(cardId, { status: "inactive" }, { skipEvaluation: true });
                    Toaster.success("Collaboration delisted successfully");
                } catch (error) {
                    Console.error(error);
                    Toaster.error("Failed to delist collaboration");
                }
            }
        })

    };
    const deleteCollaboration = async () => {
        handleClose();
        openModal({
            title: "Delist Collaboration",
            description: "This would completely delete the collaboration and you would no longer be able to recover this",
            confirmText: "Delete Collaboration",
            confirmAction: async () => {
                try {
                    await updateCollaboration(cardId, { status: "deleted" }, { skipEvaluation: true });
                    Toaster.success("Collaboration deleted successfully");
                } catch (error) {
                    Console.error(error);
                    Toaster.error("Failed to delete collaboration");
                }
            }
        })

    };
    const stopCollaboration = async () => {
        handleClose();
        openModal({
            title: "Stop Receiving Applications",
            description: "This means you would still be shown to the influencers but they would no longer be able to apply to this collaboration",
            confirmText: "Stop!",
            confirmAction: async () => {
                try {
                    await updateCollaboration(cardId, { status: "stopped" }, { skipEvaluation: true });
                    Toaster.success("Collaboration Stopped successfully");
                } catch (error) {
                    Console.error(error);
                    Toaster.error("Failed to stop collaboration");
                }
            }
        })

    };

    const startReceivingApplications = async () => {
        handleClose();
        openModal({
            title: "Start Receiving Applications",
            description: "Influencers will be able to apply to this collaboration again.",
            confirmText: "Start Receiving",
            confirmAction: async () => {
                try {
                    await updateCollaboration(cardId, { status: "active" }, { skipEvaluation: true });
                    Toaster.success("Collaboration is now accepting applications");
                } catch (error) {
                    Console.error(error);
                    Toaster.error("Failed to start receiving applications");
                }
            }
        });
    };

    const reactivateCollaboration = async () => {
        handleClose();
        openModal({
            title: "Reactivate Collaboration",
            description: "This will move the collaboration back to Active campaigns and influencers will be able to apply again.",
            confirmText: "Reactivate",
            confirmAction: async () => {
                try {
                    await updateCollaboration(cardId, { status: "active" }, { skipEvaluation: true });
                    Toaster.success("Collaboration reactivated successfully");
                } catch (error) {
                    Console.error(error);
                    Toaster.error("Failed to reactivate collaboration");
                }
            }
        });
    };

    const renderContent = () => {
        switch (cardType) {
            case "influencerType":
                return (
                    <View style={styles.placeholderBox}>
                        <Text style={styles.placeholderText}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem optio
                            possimus asperiores ad adipisci quo architecto quibusdam quaerat,
                            fugiat, et quae dignissimos consequuntur itaque sint accusamus
                            animi error saepe aperiam, doloremque quasi.
                        </Text>
                    </View>
                );
            case "promotionType":
                return (
                    <View style={styles.placeholderBox}>
                        <Text style={styles.placeholderText}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem optio
                            possimus asperiores ad adipisci quo architecto quibusdam quaerat,
                            fugiat, et quae dignissimos consequuntur itaque sint accusamus
                            animi error saepe aperiam, doloremque quasi.
                        </Text>
                    </View>
                );

            case "influencerCard":
                return (
                    <List.Section style={styles.listSection}>
                        <List.Item
                            title="View Profile"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                handleClose();
                            }}
                        />
                        <List.Item
                            title="Send Message"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                handleClose();
                            }}
                        />
                        <List.Item
                            title="Block Influencer"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                handleClose();
                            }}
                        />
                    </List.Section>
                );

            case "applicationCard":
                return (
                    <List.Section style={styles.listSection}>
                        <List.Item
                            title="Send Message"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                handleClose();
                            }}
                        />
                        <List.Item
                            title="Accept Application"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                handleAcceptApplication();
                            }}
                        />
                        <List.Item
                            title="Reject Application"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                handleRejectApplication();
                            }}
                        />
                    </List.Section>
                );

            case "invitationCard":
                return (
                    <List.Section style={styles.listSection}>
                        <List.Item
                            title="View Profile"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                handleClose();
                            }}
                        />
                        <List.Item
                            title="Send Message"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                handleClose();
                            }}
                        />
                        <List.Item
                            title="Invite to Collaboration"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                setIsMessageModalVisible(true);
                            }}
                        />
                    </List.Section>
                );
            case "activeCollab": {
                const status = data?.status as string | undefined;
                const isPast = status === "inactive"; // only delisted; "stopped" stays in active tab with Start Receiving option
                const isStopped = status === "stopped";

                return (
                    <List.Section style={styles.listSection}>
                        <List.Item
                            title="View Collaboration"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                handleClose();
                                router.push(`/collaboration-details/${cardId}`);
                            }}
                        />
                        <List.Item
                            title="Edit Collaboration"
                            titleStyle={styles.actionTitle}
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
                            titleStyle={styles.actionTitle}
                            onPress={async () => {
                                await copyToClipboard();
                                Toaster.success("Link copied to clipboard");
                            }}
                        />
                        {!isPast && (
                            <List.Item
                                title={isStopped ? "Start Receiving Applications" : "Stop Receiving Applications"}
                                titleStyle={styles.actionTitle}
                                onPress={() => {
                                    isStopped ? startReceivingApplications() : stopCollaboration();
                                }}
                            />
                        )}
                        {isPast ? (
                            <List.Item
                                title="Reactivate Collaboration"
                                titleStyle={styles.actionTitle}
                                onPress={() => {
                                    reactivateCollaboration();
                                }}
                            />
                        ) : (
                            <List.Item
                                title="Delist Collaboration"
                                titleStyle={styles.actionTitle}
                                onPress={() => {
                                    delistCollaboration();
                                }}
                            />
                        )}
                        <List.Item
                            title="Delete Collaboration"
                            titleStyle={styles.actionTitle}
                            onPress={() => {
                                deleteCollaboration();
                            }}
                        />
                    </List.Section>
                );
            }
            case "contract":
                return (
                    <List.Section style={styles.listSection}>
                        <List.Item
                            title="View Collaboration"
                            titleStyle={styles.actionTitle}
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
                    backgroundStyle={styles.sheetSurface}
                    handleIndicatorStyle={styles.sheetHandle}
                    backdropComponent={() => {
                        // Dismiss when tapping outside
                        return <Pressable style={styles.overlay} onPress={handleClose} />;
                    }}
                    onClose={handleClose}
                    style={[styles.bottomSheet, styles.sheetSurface]}
                >
                    <BottomSheetView style={styles.sheetContent}>
                        {renderContent()}
                    </BottomSheetView>
                </BottomSheet>
            </View>
        </Modal>
    );
};

export default BottomSheetActions;

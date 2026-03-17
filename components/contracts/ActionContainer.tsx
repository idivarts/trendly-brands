import Colors from "@/shared-uis/constants/Colors";
import { ContractStatus, isContractBlockedByKYC } from "@/shared-constants/contract-status";
import {
    ContractActionsWithMessage,
    type ContractActionButton,
    type ContractActionsMessage,
} from "@/shared-uis/components/contract-actions-with-message";
import { useChatContext } from "@/contexts";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import {
    faCircleInfo,
    faStar,
    faStarHalfStroke,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { Posting, Shipment } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import React, { FC, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import BottomSheetScrollContainer from "@/shared-uis/components/bottom-sheet/scroll-view";
import ChangeReleaseDateSheet from "./ChangeReleaseDateSheet";
import ReleaseOptionsBottomSheet from "./ReleaseOptionsBottomSheet";
import RequestRevisionModal from "./RequestRevisionModal";
import ShippingAddressModal from "./ShippingAddressModal";
import ViewInfluencerAddressModal from "./ViewInfluencerAddressModal";
import { Text, View } from "../theme/Themed";

/** Pass through 0–10 (Firestore). Legacy: 2 = feedback → DeliverableSent, 3 = completed → Settled. */
function normalizeStatus(status: number): number {
    if (status >= 0 && status <= 10) return status;
    if (status === 2) return ContractStatus.DeliverableSent;
    if (status === 3) return ContractStatus.Settled;
    return ContractStatus.Pending;
}

/** True if collaboration requires product shipping (→ states 6, 7). */
function isProductShipping(collab?: ICollaboration | null): boolean {
    return collab?.promotionSubject === "physical_product" ?? false;
}

interface ActionContainerProps {
    contract: IContracts;
    refreshData: () => void;
    feedbackModalVisible: () => void;
    userData: IUsers;
    collaborationData?: ICollaboration | null;
    paymentStatus?: "pending" | "processing" | "completed" | "failed";
    slot?: "all" | "buttons" | "feedback-and-info";
    /** Dev only: override status for UI testing (no Firestore write) */
    devOverrideStatus?: number | null;
}

const ActionContainer: FC<ActionContainerProps> = ({
    contract,
    refreshData,
    feedbackModalVisible,
    userData,
    collaborationData = null,
    paymentStatus = "pending",
    slot = "all",
    devOverrideStatus = null,
}) => {
    const theme = useTheme();
    const [manager, setManager] = useState<IManagers>();
    const { fetchChannelCid, sendMessageToChannel } = useChatContext();

    const [showShippingModal, setShowShippingModal] = useState(false);
    const [showViewAddressModal, setShowViewAddressModal] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [showReleaseSheet, setShowReleaseSheet] = useState(false);
    const [showChangeDateSheet, setShowChangeDateSheet] = useState(false);

    const status =
        devOverrideStatus != null ? normalizeStatus(devOverrideStatus) : normalizeStatus(contract.status);
    const productShipping = isProductShipping(collaborationData);
    /** KYC is a gate: block Make Payment / Start Contract until influencer KYC is done. Not a contract state. */
    const kycBlocked = (status === ContractStatus.Pending || contract.status === ContractStatus.Pending) && isContractBlockedByKYC(userData);
    const isLegacyFlow =
        devOverrideStatus == null &&
        contract.status <= 1 &&
        contract.status >= 0 &&
        !collaborationData;

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        return (
            <>
                {Array.from({ length: fullStars }, (_, i) => (
                    <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        size={16}
                        color={Colors(theme).yellow}
                    />
                ))}
                {hasHalfStar && (
                    <FontAwesomeIcon
                        icon={faStarHalfStroke}
                        size={16}
                        color={Colors(theme).yellow}
                    />
                )}
            </>
        );
    };

    /** Legacy: start contract (status 0 → 1). */
    const startContract = async () => {
        const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
        const timeStarted = new Date().getTime();
        await updateDoc(contractRef, {
            status: 1,
            contractTimestamp: {
                startedOn: timeStarted,
            },
        });
        await HttpWrapper.fetch(`/api/collabs/contracts/${contract.streamChannelId}`, {
            method: "POST",
        }).then(() => {
            Toaster.success("Your Contract has started");
        });
        refreshData();
    };

    /** New flow: after payment success, move to Shipped (4) or DeliverableSent (7). */
    const startContractAfterPayment = async () => {
        const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
        const timeStarted = new Date().getTime();
        const nextStatus = productShipping ? ContractStatus.Shipped : ContractStatus.DeliverableSent;
        await updateDoc(contractRef, {
            status: nextStatus,
            contractTimestamp: {
                ...contract.contractTimestamp,
                startedOn: timeStarted,
            },
        });
        await HttpWrapper.fetch(`/api/collabs/contracts/${contract.streamChannelId}`, {
            method: "POST",
        }).then(() => {
            Toaster.success("Contract started successfully");
        });
        refreshData();
    };

    const handleShippingSubmit = async (data: Partial<Shipment>) => {
        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            await updateDoc(contractRef, {
                status: ContractStatus.Shipped,
                shipment: { ...data, status: "shipped" },
            });
            Toaster.success("Shipment marked as shipped");
            refreshData();
        } catch (e) {
            Toaster.error("Failed to update shipment");
        }
    };

    const handleMarkAsDelivered = async () => {
        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            await updateDoc(contractRef, { status: ContractStatus.Received });
            refreshData();
            Toaster.success("Marked as delivered.");
            sendMessageToChannel(
                contract.streamChannelId,
                "Product has been marked as delivered. You can now upload your collaboration video."
            ).catch(() => {});
        } catch (e) {
            Toaster.error("Failed to update status");
        }
    };

    const handleRevisionSend = async (revisionNotes: string) => {
        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            await updateDoc(contractRef, { status: ContractStatus.DeliverableSent });
            Toaster.success("Revision request sent (notes can be sent via chat)");
            refreshData();
        } catch (e) {
            Toaster.error("Failed to send revision request");
        }
    };

    const handleReleaseConfirm = async (
        option: "brand_and_influencer_post" | "influencer_posts_alone" | "brand_posts_alone",
        scheduledReleaseAt: number
    ) => {
        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            const posting: Partial<Posting> = {
                ...contract.posting,
                scheduledDate: scheduledReleaseAt,
                postingScenario: option,
            };
            await updateDoc(contractRef, {
                status: ContractStatus.PostScheduled,
                posting,
            });
            Toaster.success("Release scheduled");
            refreshData();
        } catch (e) {
            Toaster.error("Failed to schedule release");
        }
    };

    const handleChangeDateConfirm = async (scheduledReleaseAt: number) => {
        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            const posting: Partial<Posting> = {
                ...contract.posting,
                scheduledDate: scheduledReleaseAt,
            };
            await updateDoc(contractRef, { posting });
            Toaster.success("Release date updated");
            refreshData();
        } catch (e) {
            Toaster.error("Failed to update date");
        }
    };

    const fetchManager = async () => {
        if (!contract.feedbackFromBrand?.managerId) return;
        const managerRef = doc(
            FirestoreDB,
            "managers",
            contract.feedbackFromBrand?.managerId
        );
        const manager = await getDoc(managerRef);
        setManager(manager.data() as IManagers);
    };

    useEffect(() => {
        fetchManager();
    }, [contract.feedbackFromBrand?.managerId]);

    const { openModal } = useConfirmationModel();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const showButtons = slot === "all" || slot === "buttons";
    const showFeedbackAndInfo = slot === "all" || slot === "feedback-and-info";

    const goToMessages = async () => {
        if (Platform.OS === "web")
            router.navigate(`/messages?channelId=${contract.streamChannelId}`);
        else {
            const channelCid = await fetchChannelCid(contract.streamChannelId);
            router.navigate(`/channel/${channelCid}`);
        }
    };

    const actionsConfig = useMemo((): {
        buttons: [] | [ContractActionButton] | [ContractActionButton, ContractActionButton];
        message: ContractActionsMessage;
    } => {
        const infoIcon = <FontAwesomeIcon icon={faCircleInfo} size={18} color={colors.primary} />;
        const messageForStatus = (): ContractActionsMessage => {
            if (!isLegacyFlow && kycBlocked)
                return {
                    variant: "warning",
                    text: "You cannot start the contract with the influencer unless they are verified with us. You can nudge them for the same in the chat.",
                    icon: infoIcon,
                };
            if (status === ContractStatus.Pending)
                return {
                    variant: "info",
                    text: "Use the chat to align with the influencer, then proceed with payment and contract steps.",
                    icon: infoIcon,
                };
            if (status <= ContractStatus.PostScheduled)
                return {
                    variant: "warning",
                    text: "Complete the current step to move the contract forward. Use chat for any coordination.",
                    icon: infoIcon,
                };
            return {
                variant: "success",
                text: "You can create a new collaboration and invite this influencer again.",
                icon: infoIcon,
            };
        };

        if (isLegacyFlow && contract.status === 0) {
            return {
                buttons: [
                    {
                        label: "Ask To Revise Quote",
                        variant: "outlined",
                        onPress: () => {
                            HttpWrapper.fetch(
                                `/api/collabs/collaborations/${contract.collaborationId}/applications/${contract.userId}/revise`,
                                { method: "POST" }
                            ).then(() => {
                                Toaster.success("Successfully notified influencer to revise quotation");
                            });
                        },
                    },
                    {
                        label: "Start Contract",
                        variant: "contained",
                        onPress: () => {
                            openModal({
                                confirmAction: startContract,
                                confirmText: "Confirm",
                                title: "Start this Contract?",
                                description:
                                    "Are you sure? Make sure you discuss the pricing and final deliverable before starting the contract",
                            });
                        },
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (isLegacyFlow && contract.status === 1) {
            return {
                buttons: [
                    {
                        label: "End Contract",
                        variant: "contained-tonal",
                        onPress: () => {
                            openModal({
                                confirmAction: feedbackModalVisible,
                                confirmText: "End Contract",
                                title: "End your contract?",
                                description:
                                    "Are you sure you want to end the contract? This action cant be reversed.",
                            });
                        },
                    },
                    { label: "Go to Messages", variant: "contained", onPress: goToMessages },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && kycBlocked) {
            return { buttons: [], message: messageForStatus() };
        }
        if (!isLegacyFlow && status === ContractStatus.Pending) {
            return {
                buttons: [
                    {
                        label: "Make Payment",
                        variant: "contained",
                        onPress: () => Toaster.info("Razorpay integration: open checkout"),
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.PaymentFailed) {
            return {
                buttons: [
                    {
                        label: "Retry Payment",
                        variant: "contained",
                        onPress: () => Toaster.info("Razorpay integration: retry payment"),
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.Paid) {
            return {
                buttons: [
                    {
                        label: "Start Contract",
                        variant: "contained",
                        onPress: () => {
                            openModal({
                                confirmAction: startContractAfterPayment,
                                confirmText: "Start",
                                title: "Start contract?",
                                description:
                                    "Next step: " +
                                    (productShipping ? "add shipment details." : "influencer will upload video."),
                            });
                        },
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.Shipped) {
            return {
                buttons: [
                    {
                        label: "View Influencer Address",
                        variant: "outlined",
                        onPress: () => {
                            setShowShippingModal(false);
                            setShowViewAddressModal(true);
                        },
                    },
                    {
                        label: "Add Shipment Details",
                        variant: "contained",
                        onPress: () => {
                            setShowViewAddressModal(false);
                            setShowShippingModal(true);
                        },
                    },
                ],
                message: {
                    variant: "warning",
                    text: "Please get the shipping address and ship the product to the influencer. Don't forget to mark it as shipped once you have done.",
                    icon: infoIcon,
                },
            };
        }
        if (!isLegacyFlow && status === ContractStatus.Delivered) {
            return {
                buttons: [
                    { label: "Mark as Delivered", variant: "contained", onPress: handleMarkAsDelivered },
                    { label: "Go to Messages", variant: "outlined", onPress: goToMessages },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.Received) {
            return {
                buttons: [
                    {
                        label: "Nudge Influencer",
                        variant: "contained-tonal",
                        onPress: () => Toaster.info("Send nudge message in chat"),
                    },
                    { label: "Go to Messages", variant: "contained", onPress: goToMessages },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.DeliverableSent) {
            return {
                buttons: [
                    {
                        label: "Request Revision",
                        variant: "outlined",
                        onPress: () => setShowRevisionModal(true),
                    },
                    {
                        label: "Approve Video",
                        variant: "contained",
                        onPress: () => {
                            openModal({
                                confirmAction: async () => {
                                    const contractRef = doc(
                                        FirestoreDB,
                                        "contracts",
                                        contract.streamChannelId
                                    );
                                    await updateDoc(contractRef, {
                                        status: ContractStatus.PostScheduled,
                                    });
                                    Toaster.success("Video approved");
                                    refreshData();
                                },
                                confirmText: "Approve",
                                title: "Approve video?",
                                description:
                                    "The contract will move to Post Scheduled. You can then plan the release date.",
                            });
                        },
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.PostScheduled) {
            const postButtons: [ContractActionButton] | [ContractActionButton, ContractActionButton] =
                contract.posting?.scheduledDate
                    ? [
                          {
                              label: "Change Release Date",
                              variant: "outlined",
                              onPress: () => setShowChangeDateSheet(true),
                          },
                          {
                              label: "Plan Release",
                              variant: "contained",
                              onPress: () => setShowReleaseSheet(true),
                          },
                      ]
                    : [
                          {
                              label: "Plan Release",
                              variant: "contained",
                              onPress: () => setShowReleaseSheet(true),
                          },
                      ];
            return { buttons: postButtons, message: messageForStatus() };
        }
        return { buttons: [], message: messageForStatus() };
    }, [
        status,
        isLegacyFlow,
        kycBlocked,
        productShipping,
        contract.status,
        contract.collaborationId,
        contract.userId,
        contract.streamChannelId,
        contract.posting?.scheduledDate,
        colors.primary,
        openModal,
        startContract,
        startContractAfterPayment,
        feedbackModalVisible,
        goToMessages,
        handleMarkAsDelivered,
        handleRevisionSend,
        refreshData,
    ]);

    return (
        <View style={styles.root}>
            {(showButtons || showFeedbackAndInfo) && (
                <ContractActionsWithMessage
                    buttons={showButtons ? actionsConfig.buttons : []}
                    message={actionsConfig.message}
                />
            )}
            {showFeedbackAndInfo && (contract.feedbackFromBrand || contract.feedbackFromInfluencer) && (
                <Text style={styles.reviewsHeading}>Reviews & Ratings</Text>
            )}
            {showFeedbackAndInfo && contract.feedbackFromBrand && (
                <View style={styles.feedbackCard}>
                    <View style={styles.starsRow}>
                        {renderStars(contract.feedbackFromBrand.ratings || 0)}
                    </View>
                    <View style={styles.feedbackInner}>
                        <ImageComponent
                            url={manager?.profileImage || ""}
                            altText={manager?.name || ""}
                            initials={manager?.name || ""}
                            shape="circle"
                            size="small"
                            style={styles.avatar}
                        />
                        <View style={styles.feedbackTextWrap}>
                            <Text style={styles.feedbackLabel}>
                                From Brand ({manager?.name})
                            </Text>
                            <Text style={styles.feedbackReview}>
                                {contract.feedbackFromBrand.feedbackReview}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
            {showFeedbackAndInfo && contract.feedbackFromInfluencer && (
                <View style={styles.feedbackCard}>
                    <View style={styles.starsRow}>
                        {renderStars(contract.feedbackFromInfluencer.ratings || 0)}
                    </View>
                    <View style={styles.feedbackInner}>
                        <ImageComponent
                            url={userData.profileImage || ""}
                            altText={userData.name}
                            initials={userData.name}
                            shape="circle"
                            size="small"
                            style={styles.avatar}
                        />
                        <View style={styles.feedbackTextWrap}>
                            <Text style={styles.feedbackLabel}>
                                From Influencer ({userData.name})
                            </Text>
                            <Text style={styles.feedbackReview}>
                                {contract.feedbackFromInfluencer?.feedbackReview}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {showViewAddressModal && (
                <ViewInfluencerAddressModal
                    visible
                    onClose={() => setShowViewAddressModal(false)}
                    influencerName={userData.name}
                    address={userData.currentAddress}
                    onNudgeForAddress={() =>
                        sendMessageToChannel(
                            contract.streamChannelId,
                            "Please share your shipping address for this collaboration."
                        )
                    }
                />
            )}
            {showShippingModal && (
                <ShippingAddressModal
                    visible
                    onClose={() => setShowShippingModal(false)}
                    onSubmit={handleShippingSubmit}
                />
            )}
            <RequestRevisionModal
                visible={showRevisionModal}
                onClose={() => setShowRevisionModal(false)}
                onSend={handleRevisionSend}
            />
            <BottomSheetScrollContainer
                isVisible={showReleaseSheet}
                snapPointsRange={["50%", "90%"]}
                onClose={() => setShowReleaseSheet(false)}
            >
                <ReleaseOptionsBottomSheet
                    onClose={() => setShowReleaseSheet(false)}
                    onConfirm={handleReleaseConfirm}
                />
            </BottomSheetScrollContainer>
            <BottomSheetScrollContainer
                isVisible={showChangeDateSheet}
                snapPointsRange={["40%", "50%"]}
                onClose={() => setShowChangeDateSheet(false)}
            >
                <ChangeReleaseDateSheet
                    initialDate={contract.posting?.scheduledDate}
                    onClose={() => setShowChangeDateSheet(false)}
                    onConfirm={handleChangeDateConfirm}
                />
            </BottomSheetScrollContainer>
        </View>
    );
}

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        root: {
            width: "100%",
            flexDirection: "column",
            gap: 16,
            backgroundColor: "transparent",
        },
        reviewsHeading: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
        },
        feedbackCard: {
            width: "100%",
            borderWidth: 0.3,
            padding: 10,
            borderRadius: 10,
            gap: 10,
            borderColor: colors.gray300,
        },
        starsRow: { flexDirection: "row" },
        feedbackInner: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexGrow: 1,
        },
        avatar: { width: 40, height: 40, borderRadius: 20 },
        feedbackTextWrap: { flex: 1 },
        feedbackLabel: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
        },
        feedbackReview: {
            fontSize: 16,
            flexWrap: "wrap",
            overflow: "hidden",
            lineHeight: 22,
            color: colors.text,
        },
    });
}

export default ActionContainer;

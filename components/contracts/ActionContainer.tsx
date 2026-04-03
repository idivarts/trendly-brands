import Colors from "@/shared-uis/constants/Colors";
import { ContractStatus, isContractBlockedByKYC, type ReleasePlanOption } from "@/shared-constants/contract-status";
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
import { doc, getDoc } from "firebase/firestore";
import type { ShipmentFormInput } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import React, { FC, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import BottomSheetScrollContainer from "@/shared-uis/components/bottom-sheet/scroll-view";
import ChangeReleaseDateSheet from "./ChangeReleaseDateSheet";
import ReleaseOptionsBottomSheet from "./ReleaseOptionsBottomSheet";
import ApproveVideoReleaseBottomSheet from "./ApproveVideoReleaseBottomSheet";
import InfluencerUploadedVideo from "./InfluencerUploadedVideo";
import MarkAsDeliveredModal from "./MarkAsDeliveredModal";
import RequestRevisionModal from "./RequestRevisionModal";
import ShippingAddressModal from "./ShippingAddressModal";
import ViewInfluencerAddressBottomSheet from "./ViewInfluencerAddressBottomSheet";
import ViewInfluencerAddressModal from "./ViewInfluencerAddressModal";
import { Text, View } from "../theme/Themed";
import { markShipmentShipped } from "./api/State_3_api";
import { markShipmentDelivered } from "./api/State_4_api";
import { requestVideoRevision, approveVideoRelease } from "./api/State_6_api";
import {
    changeReleaseDate as changeReleaseDateState7,
} from "./api/State_7_api";
import {
    scheduleRelease,
    changeReleaseDate as changeReleaseDateState8,
} from "./api/State_8_api";
import { createContractOrder, getContractOrderStatus, reviseQuotation } from "./api/State_0_api";
import { requestDeliverable } from "./api/State_5_api";
import { openRazorpayCheckout } from "./RazorpayCheckout";

/** Pass through 0–10 (Firestore). Legacy: 2 = feedback → PlanRelease, 3 = completed → Settled. */
function normalizeStatus(status: number): number {
    if (status >= 0 && status <= 10) return status;
    if (status === 2) return ContractStatus.PlanRelease;
    if (status === 3) return ContractStatus.Settled;
    return ContractStatus.Pending;
}

/** True if collaboration requires product shipping (→ states 6, 7). */
function isProductShipping(collab?: ICollaboration | null): boolean {
    return collab?.promotionSubject === "physical_product";
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
    const [showViewAddressSheet, setShowViewAddressSheet] = useState(false);
    const [showMarkAsDeliveredModal, setShowMarkAsDeliveredModal] = useState(false);
    const [showApproveVideoSheet, setShowApproveVideoSheet] = useState(false);

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

    const handleShippingSubmit = async (data: ShipmentFormInput) => {
        try {
            const courierName = data.courierName?.trim();
            const trackingNumber = data.trackingNumber?.trim();
            const expectedDate = data.expectedDate ?? Date.now();

            if (!courierName || !trackingNumber) {
                Toaster.error("Courier name and tracking number are required");
                return;
            }

            await markShipmentShipped({
                contractId: contract.streamChannelId,
                shipmentProvider: courierName,
                trackingId: trackingNumber,
                expectedDate,
            });

            Toaster.success("Shipment marked as shipped");
            refreshData();
        } catch (e) {
            // Helps us debug the exact Firestore failure (security rules vs invalid payload, etc.)
            console.error("Failed to update shipment", e);
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(message ? `Failed to update shipment: ${message}` : "Failed to update shipment");
            throw e;
        }
    };

    const handleMarkAsDeliveredSubmit = async (data: {
        proofOfDeliveryUrl?: string;
        receivedNotes?: string;
    }) => {
        try {
            if (!data.proofOfDeliveryUrl) {
                Toaster.error("Please upload proof of delivery.");
                return;
            }

            await markShipmentDelivered({
                contractId: contract.streamChannelId,
                screenshotUrl: data.proofOfDeliveryUrl,
                notes: data.receivedNotes?.trim() || undefined,
            });

            refreshData();
            Toaster.success("Marked as delivered.");
            sendMessageToChannel(
                contract.streamChannelId,
                "Product has been marked as delivered. You can now upload your collaboration video."
            ).catch(() => {});
        } catch (e) {
            console.error("Failed to update delivered status", e);
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(message ? `Failed to update status: ${message}` : "Failed to update status");
            throw e;
        }
    };

    const handleRevisionSend = async (revisionNotes: string) => {
        try {
            await requestVideoRevision({
                contractId: contract.streamChannelId,
                notes: revisionNotes,
            });
            await sendMessageToChannel(
                contract.streamChannelId,
                `Revision request from brand: ${revisionNotes}`
            );
            Toaster.success("Revision request sent in chat");
            refreshData();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(message ? `Failed to send revision request: ${message}` : "Failed to send revision request");
            throw e;
        }
    };

    const handleReleaseConfirm = async (
        option: "brand_and_influencer_post" | "influencer_posts_alone" | "brand_posts_alone",
        scheduledReleaseAt: number
    ) => {
        try {
            await scheduleRelease({
                contractId: contract.streamChannelId,
                scheduledReleaseAt,
                option,
            });

            Toaster.success("Release scheduled");
            refreshData();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(
                message ? `Failed to schedule release: ${message}` : "Failed to schedule release"
            );
            throw e;
        }
    };

    const handleChangeDateConfirm = async (scheduledReleaseAt: number) => {
        try {
            if (status === ContractStatus.PlanRelease) {
                await changeReleaseDateState7({
                    contractId: contract.streamChannelId,
                    newScheduledDate: scheduledReleaseAt,
                });
            } else {
                await changeReleaseDateState8({
                    contractId: contract.streamChannelId,
                    scheduledReleaseAt,
                });
            }
            Toaster.success("Release date updated");
            refreshData();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(message ? `Failed to update date: ${message}` : "Failed to update date");
            throw e;
        }
    };

    const handleApproveVideoReleaseConfirm = async (data: {
        option: ReleasePlanOption;
        scheduledReleaseAt?: number;
        trendlyBoost: boolean;
    }) => {
        try {
            await approveVideoRelease({
                contractId: contract.streamChannelId,
                option: data.option,
                scheduledReleaseAt: data.scheduledReleaseAt,
            });

            Toaster.success("Video approved");
            refreshData();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(
                message ? `Failed to approve video: ${message}` : "Failed to approve video"
            );
            throw e;
        }
    };

    const handlePendingPayment = async () => {
        try {
            // Important for web: opening a new tab after an `await` is often popup-blocked.
            // Open a blank tab synchronously (user gesture), then redirect it once we have the URL.
            const paymentTab =
                Platform.OS === "web"
                    ? window.open("about:blank", "_blank", "noopener,noreferrer")
                    : null;

            const razorpayKeyId =
                process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RtPhjl6Q2YAk8S";
            if (!razorpayKeyId) {
                throw new Error("Missing Razorpay key. Set EXPO_PUBLIC_RAZORPAY_KEY_ID.");
            }

            const order = await createContractOrder({ contractId: contract.streamChannelId });
            if (!order.id) {
                throw new Error(
                    `Invalid order response from server (missing orderId)`
                );
            }

            // If backend returns a hosted payment link (common), use that.
            if (order.shortUrl) {
                if (Platform.OS === "web") {
                    if (paymentTab) {
                        paymentTab.location.href = order.shortUrl;
                    } else {
                        Toaster.info("Popup blocked. Opening Razorpay in this tab.");
                        window.location.href = order.shortUrl;
                    }
                } else {
                    await openRazorpayCheckout({ shortUrl: order.shortUrl });
                }
            } else {
                // No URL to redirect the opened tab to; close it to avoid leaving a blank page around.
                paymentTab?.close();
                // Web-only checkout.js flow.
                await openRazorpayCheckout({
                    key: razorpayKeyId,
                    orderId: order.id,
                    amount: order.amount > 0 ? order.amount : undefined,
                    currency: order.currency || undefined,
                    name: "Trendly",
                    description: "Contract pre-payment",
                    prefill: {
                        name: userData?.name,
                        email: userData?.email,
                        contact: userData?.phoneNumber,
                    },
                    themeColor: colors.primary,
                });
            }

            const latest = await getContractOrderStatus({
                contractId: contract.streamChannelId,
            });
            if (latest?.status === "paid") {
                Toaster.success("Payment completed successfully");
            } else {
                Toaster.info("Payment submitted. We'll update status shortly.");
            }
            refreshData();
        } catch (e) {
            // Close the blank tab if we opened one and then errored out.
            // (No-op if popup was blocked.)
            // eslint-disable-next-line no-undef
            // @ts-expect-error window.open tab may be undefined in non-web builds
            // (guarded by Platform.OS check above)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const message =
                e instanceof Error ? e.message : "Unable to complete payment";
            Toaster.error(message);
            refreshData();
        }
    };

    const handleReviseQuotation = async () => {
        try {
            const collabId = contract.collaborationId;
            const influencerUserId = contract.userId;
            if (!collabId || !influencerUserId) {
                throw new Error("Missing collaborationId or userId for revise request");
            }

            await reviseQuotation({ collabId, userId: influencerUserId });
            Toaster.success("Revision request sent");
        } catch (e) {
            const message = e instanceof Error ? e.message : "Unable to request revision";
            Toaster.error(message);
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
            if (status === ContractStatus.PaymentFailed)
                return {
                    variant: "error",
                    text: "Payment failed. You can retry payment using the button above.",
                    icon: infoIcon,
                };
            if (status === ContractStatus.PostDone)
                return {
                    variant: "info",
                    text: "Contract closed. Please submit feedback to finish.",
                    icon: infoIcon,
                };
            if (status === ContractStatus.PlanRelease) {
                const scheduledText = contract.posting?.scheduledDate
                    ? new Date(contract.posting.scheduledDate).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                      })
                    : "the scheduled date";
                return {
                    variant: "warning",
                    text: `Release pending until ${scheduledText}.`,
                    icon: infoIcon,
                };
            }
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
                        label: "Ask to Revise Quote",
                        variant: "outlined",
                        onPress: handleReviseQuotation,
                    },
                    {
                        label: "Payment",
                        variant: "contained",
                        onPress: handlePendingPayment,
                    },
                ],
                message: {
                    variant: "warning",
                    text: "The contract is still not funded. Once you communicate with the influencer and everything aligns you can fund and start the contract.",
                    icon: infoIcon,
                },
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
                        label: "Ask to Revise Quote",
                        variant: "outlined",
                        onPress: handleReviseQuotation,
                    },
                    {
                        label: "Payment",
                        variant: "contained",
                        onPress: handlePendingPayment,
                    },
                ],
                message: {
                    variant: "warning",
                    text: "The contract is still not funded. Once you communicate with the influencer and everything aligns you can fund and start the contract.",
                    icon: infoIcon,
                },
            };
        }
        if (!isLegacyFlow && status === ContractStatus.PaymentFailed) {
            return {
                buttons: [
                    {
                        label: "Retry Payment",
                        variant: "contained",
                        onPress: handlePendingPayment,
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.Started) {
            // Backend-owned flow: do not write state from UI.
            // If legacy/transitional `Started` appears, treat it as the next actionable state.
            return {
                buttons: productShipping
                    ? [
                          {
                              label: "View Influencer Address",
                              variant: "outlined",
                              onPress: () => {
                                  setShowShippingModal(false);
                                  setShowViewAddressSheet(true);
                              },
                          },
                          {
                              label: "Add Shipment Details",
                              variant: "contained",
                              onPress: () => {
                                  setShowViewAddressSheet(false);
                                  setShowShippingModal(true);
                              },
                          },
                      ]
                    : [
                          {
                              label: "Request for Video",
                              variant: "contained",
                              onPress: async () => {
                                  await requestDeliverable({ contractId: contract.streamChannelId });
                              },
                          },
                      ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.ShipmentPending) {
            return {
                buttons: [
                    {
                        label: "View Influencer Address",
                        variant: "outlined",
                        onPress: () => {
                            setShowShippingModal(false);
                            setShowViewAddressSheet(true);
                        },
                    },
                    {
                        label: "Add Shipment Details",
                        variant: "contained",
                        onPress: () => {
                            setShowViewAddressSheet(false);
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
        if (!isLegacyFlow && status === ContractStatus.DeliveryPending) {
            return {
                buttons: [
                    { label: "Go to Messages", variant: "outlined", onPress: goToMessages },
                    {
                        label: "Mark as Delivered",
                        variant: "contained",
                        onPress: () => setShowMarkAsDeliveredModal(true),
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.VideoPending) {
            return {
                buttons: [
                    {
                        label: "Request for Video",
                        variant: "contained",
                        onPress: async () => {
                            await requestDeliverable({ contractId: contract.streamChannelId });
                        },
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.ReviewPending) {
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
                        onPress: () => setShowApproveVideoSheet(true),
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.PlanRelease) {
            return {
                buttons: [
                    {
                        label: "Change Release Date",
                        variant: "outlined",
                        onPress: () => setShowChangeDateSheet(true),
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.PostScheduled) {
            return {
                buttons: contract.posting?.scheduledDate
                    ? [
                          {
                              label: "Change Release Date",
                              variant: "outlined",
                              onPress: () => setShowChangeDateSheet(true),
                          },
                      ]
                    : [],
                message: messageForStatus(),
            };
        }
        if (!isLegacyFlow && status === ContractStatus.PostDone) {
            return {
                buttons: [
                    {
                        label: "Give Feedback",
                        variant: "contained",
                        onPress: () => feedbackModalVisible(),
                    },
                ],
                message: messageForStatus(),
            };
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
        feedbackModalVisible,
        goToMessages,
        handleMarkAsDeliveredSubmit,
        handleRevisionSend,
        handlePendingPayment,
        handleReviseQuotation,
        contract.shipment,
        contract.deliverable,
        devOverrideStatus,
        refreshData,
    ]);

    return (
        <View style={styles.root}>
            {(showButtons || showFeedbackAndInfo) && (
                <ContractActionsWithMessage
                    buttons={showButtons ? actionsConfig.buttons : []}
                    message={actionsConfig.message}
                    customMessageContent={
                        showButtons && status === ContractStatus.ReviewPending ? (
                            <InfluencerUploadedVideo contract={contract} />
                        ) : undefined
                    }
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
            <BottomSheetScrollContainer
                isVisible={showViewAddressSheet}
                snapPointsRange={["35%", "50%"]}
                onClose={() => setShowViewAddressSheet(false)}
            >
                <ViewInfluencerAddressBottomSheet
                    influencerName={userData.name}
                    address={userData.currentAddress}
                />
            </BottomSheetScrollContainer>
            {showShippingModal && (
                <ShippingAddressModal
                    visible
                    onClose={() => setShowShippingModal(false)}
                    onSubmit={handleShippingSubmit}
                />
            )}
            {showMarkAsDeliveredModal && (
                <MarkAsDeliveredModal
                    visible
                    onClose={() => setShowMarkAsDeliveredModal(false)}
                    onSubmit={handleMarkAsDeliveredSubmit}
                    contractId={contract.streamChannelId}
                />
            )}
            <RequestRevisionModal
                visible={showRevisionModal}
                onClose={() => setShowRevisionModal(false)}
                onSend={handleRevisionSend}
            />
            <BottomSheetScrollContainer
                isVisible={showApproveVideoSheet}
                snapPointsRange={["65%", "95%"]}
                onClose={() => setShowApproveVideoSheet(false)}
            >
                <ApproveVideoReleaseBottomSheet
                    onClose={() => setShowApproveVideoSheet(false)}
                    onConfirm={handleApproveVideoReleaseConfirm}
                />
            </BottomSheetScrollContainer>
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

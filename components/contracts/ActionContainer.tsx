import { useChatContext } from "@/contexts";
import {
    ContractStatus,
    isContractBlockedByKYC,
    normalizeStatus,
} from "@/shared-constants/contract-status";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import type { Payment } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { IContracts, PaymentStatus } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import {
    ContractActionsWithMessage,
    type ContractActionButton,
    type ContractActionsMessage,
} from "@/shared-uis/components/contract-actions-with-message";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCircleInfo,
    faStar,
    faStarHalfStroke,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { Text, View } from "../theme/Themed";
import { getShipmentStatus } from "./api/shipment-pending.api";
import { requestDeliverableWithUX } from "./api/video-pending.api";
import { useRazorpayContractPayment } from "./hooks/useRazorpayContractPayment";
import InfluencerUploadedVideo from "./InfluencerUploadedVideo";
import ApproveVideoReleaseBottomSheet from "./modals/ApproveVideoReleaseBottomSheet";
import ChangeReleaseDateSheet from "./modals/ChangeReleaseDateSheet";
import KycBlockedStartContractModal from "./modals/KycBlockedStartContractModal";
import MarkAsDeliveredModal from "./modals/MarkAsDeliveredModal";
import RazorpayCheckoutModal from "./modals/RazorpayCheckoutModal";
import ReleaseOptionsBottomSheet from "./modals/ReleaseOptionsBottomSheet";
import RequestRevisionModal from "./modals/RequestRevisionModal";
import ShippingAddressModal from "./modals/ShippingAddressModal";
import StartContractPaymentBottomSheet, {
    formatContractMoneyLabel,
    formatInfluencerHandleFromUser,
} from "./modals/StartContractPaymentBottomSheet";
import ViewInfluencerAddressOverlay from "./modals/ViewInfluencerAddressOverlayComponent";
import { getInfluencerKycShippingAddress } from "./utils/influencer-kyc-shipping-address";

/** True if collaboration requires product shipping (shipment → delivery → acknowledgement → video). */
function isProductShipping(collab?: ICollaboration | null): boolean {
    return collab?.promotionSubject === "physical-product";
}

/**
 * Brand has a Razorpay order on the contract but checkout was not completed (e.g. app closed during payment).
 * Shown with **Continue payment** when contract status is Started (1 / OrderCreated), not on Pending (0).
 */
function hasOutstandingContractPaymentOrder(contract: IContracts): boolean {
    const orderId = contract.payment?.orderId?.trim();
    if (!orderId) return false;
    const st = contract.payment?.status;
    if (st === PaymentStatus.Paid || st === PaymentStatus.TransferProcessed) return false;
    return true;
}

/** True once the brand has submitted feedback (mirrors settlement CTA / feedback modal). */
function brandHasSubmittedFeedback(contract: IContracts): boolean {
    return (
        (contract.feedbackFromBrand?.ratings ?? 0) >= 1 ||
        Boolean(contract.feedbackFromBrand?.timeSubmitted)
    );
}

interface ActionContainerProps {
    contract: IContracts;
    refreshData: () => void;
    feedbackModalVisible: () => void;
    userData: IUsers;
    collaborationData?: ICollaboration | null;
    /** Quoted amount from the influencer application (contract budget / pay amount). */
    applicationQuotation?: number | null;
    paymentStatus?: Payment["status"];
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
    applicationQuotation = null,
    slot = "all",
    devOverrideStatus = null,
}) => {
    const theme = useTheme();
    const [manager, setManager] = useState<IManagers>();
    const { fetchChannelCid } = useChatContext();

    // Backend expects Firestore contract doc id for `/monetize/brands/contracts/:contractId/...`.
    // We attach `id` on the contract screen; fall back to streamChannelId for safety.
    const contractIdForApi =
        (contract as IContracts & { id?: string }).id ?? contract.streamChannelId;

    const [showShippingModal, setShowShippingModal] = useState(false);
    const [showViewAddress, setShowViewAddress] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [showReleaseSheet, setShowReleaseSheet] = useState(false);
    const [showChangeDateSheet, setShowChangeDateSheet] = useState(false);
    const [showMarkAsDeliveredModal, setShowMarkAsDeliveredModal] = useState(false);
    const [showApproveVideoSheet, setShowApproveVideoSheet] = useState(false);
    const [showStartContractPaymentSheet, setShowStartContractPaymentSheet] = useState(false);
    const [showKycBlockedStartContractModal, setShowKycBlockedStartContractModal] = useState(false);
    const [deliveryStatusLoading, setDeliveryStatusLoading] = useState(false);
    const [goToMessagesLoading, setGoToMessagesLoading] = useState(false);
    const goToMessagesInFlightRef = useRef(false);
    const [requestVideoLoading, setRequestVideoLoading] = useState(false);
    const requestVideoInFlightRef = useRef(false);

    const [fetchedInfluencerUser, setFetchedInfluencerUser] = useState<IUsers | null>(null);
    const [shippingAddressLoading, setShippingAddressLoading] = useState(false);
    const [shippingAddressError, setShippingAddressError] = useState<string | null>(null);

    const closeAddressModal = useCallback(() => {
        setShowViewAddress(false);
        setFetchedInfluencerUser(null);
        setShippingAddressError(null);
    }, []);

    useEffect(() => {
        if (!showViewAddress) return;
        let cancelled = false;
        setShippingAddressLoading(true);
        setShippingAddressError(null);
        (async () => {
            try {
                const userRef = doc(FirestoreDB, "users", contract.userId);
                const snap = await getDoc(userRef);
                if (cancelled) return;
                if (snap.exists()) {
                    setFetchedInfluencerUser(snap.data() as IUsers);
                } else {
                    setFetchedInfluencerUser(null);
                    setShippingAddressError("Influencer profile could not be found.");
                }
            } catch (e) {
                if (!cancelled) {
                    setFetchedInfluencerUser(null);
                    setShippingAddressError(
                        e instanceof Error ? e.message : "Failed to load address"
                    );
                }
            } finally {
                if (!cancelled) setShippingAddressLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [showViewAddress, contract.userId]);

    const kycShippingAddress = useMemo(
        () => getInfluencerKycShippingAddress(fetchedInfluencerUser),
        [fetchedInfluencerUser]
    );
    const displayInfluencerName = fetchedInfluencerUser?.name ?? userData.name;

    const status =
        devOverrideStatus != null ? normalizeStatus(devOverrideStatus) : normalizeStatus(contract.status);
    const showContinueContractPayment = hasOutstandingContractPaymentOrder(contract);
    const productShipping = isProductShipping(collaborationData);
    /** KYC is a gate: block Make Payment / Start Contract until influencer KYC is done. Not a contract state. */
    const kycBlocked = (status === ContractStatus.Pending || contract.status === ContractStatus.Pending) && isContractBlockedByKYC(userData);

    const brandSubmittedFeedback = brandHasSubmittedFeedback(contract);
    const canShowReviewsByStatus =
        status === ContractStatus.SettlementPending
            ? brandSubmittedFeedback
            : status === ContractStatus.Settled;
    const showInfluencerFeedbackCard =
        canShowReviewsByStatus &&
        Boolean(contract.feedbackFromInfluencer) &&
        brandSubmittedFeedback;

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

    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const { paymentButtonLoading, startPayment: handlePendingPayment, razorpayModalProps } =
        useRazorpayContractPayment({
            contractId: contractIdForApi,
            themeColor: colors.primary,
            prefill: {
                name: userData?.name,
                email: userData?.email,
                contact: userData?.phoneNumber,
            },
            onRefresh: refreshData,
        });

    const openStartContractPaymentSheet = useCallback(() => {
        setShowStartContractPaymentSheet(true);
    }, []);

    const handleStartContractPress = useCallback(() => {
        // KYC gate: prefetch order side-effects if any, then show blocking modal (no payment summary).
        if (kycBlocked) {
            void handlePendingPayment({ resumeExistingOrder: showContinueContractPayment, prefetchOnly: true });
            setShowKycBlockedStartContractModal(true);
            return;
        }

        // Show pay summary (collaboration, budget, amount) before Razorpay; Pay Now continues in `handlePayNowFromSheet`.
        openStartContractPaymentSheet();
    }, [
        handlePendingPayment,
        kycBlocked,
        openStartContractPaymentSheet,
        showContinueContractPayment,
    ]);

    const handlePayNowFromSheet = useCallback(async () => {
        setShowStartContractPaymentSheet(false);
        await handlePendingPayment();
    }, [handlePendingPayment]);

    const handleGetDeliveryStatus = useCallback(async () => {
        setDeliveryStatusLoading(true);
        try {
            await getShipmentStatus({ contractId: contractIdForApi });
            Toaster.success("Delivery status refreshed");
            refreshData();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(message ? `Could not get delivery status: ${message}` : "Could not get delivery status");
        } finally {
            setDeliveryStatusLoading(false);
        }
    }, [contractIdForApi, refreshData]);

    const showButtons = slot === "all" || slot === "buttons";
    const showFeedbackAndInfo = slot === "all" || slot === "feedback-and-info";

    const goToMessages = useCallback(async () => {
        if (goToMessagesInFlightRef.current) return;
        goToMessagesInFlightRef.current = true;
        setGoToMessagesLoading(true);
        try {
            if (Platform.OS === "web") {
                router.navigate(`/messages?channelId=${contract.streamChannelId}`);
            } else {
                const channelCid = await fetchChannelCid(contract.streamChannelId);
                router.navigate(`/channel/${channelCid}`);
            }
        } finally {
            goToMessagesInFlightRef.current = false;
            setGoToMessagesLoading(false);
        }
    }, [fetchChannelCid, contract.streamChannelId]);

    const handleRequestDeliverable = useCallback(async () => {
        if (requestVideoInFlightRef.current) return;
        requestVideoInFlightRef.current = true;
        setRequestVideoLoading(true);
        try {
            await requestDeliverableWithUX(
                { contractId: contractIdForApi },
                { onSuccess: refreshData }
            );
        } finally {
            requestVideoInFlightRef.current = false;
            setRequestVideoLoading(false);
        }
    }, [contractIdForApi, refreshData]);

    const actionsConfig = useMemo((): {
        buttons: [] | [ContractActionButton] | [ContractActionButton, ContractActionButton];
        message: ContractActionsMessage;
    } => {
        const infoIcon = <FontAwesomeIcon icon={faCircleInfo} size={18} color={colors.primary} />;
        const messageForStatus = (): ContractActionsMessage => {
            if (kycBlocked)
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
            if (status === ContractStatus.Started && showContinueContractPayment)
                return {
                    variant: "warning",
                    text: "Checkout was not completed. Tap Continue payment to finish paying before the next contract steps.",
                    icon: infoIcon,
                };
            if (status === ContractStatus.PaymentFailed)
                return {
                    variant: "error",
                    text: "Payment failed. You can retry payment using the button above.",
                    icon: infoIcon,
                };
            if (status === ContractStatus.SettlementPending)
                return {
                    variant: "info",
                    text: "Contract closed. Please submit feedback to finish.",
                    icon: infoIcon,
                };
            if (status === ContractStatus.PostingPending) {
                const scheduledText = contract.posting?.scheduledDate
                    ? new Date(contract.posting.scheduledDate).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    })
                    : null;
                return {
                    variant: "warning",
                    text: scheduledText
                        ? `Release scheduled for ${scheduledText}. You can change the date if needed.`
                        : "Posting and release are pending. Set or update the release date when ready.",
                    icon: infoIcon,
                };
            }
            if (status <= ContractStatus.PostingPending)
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

        if (status === ContractStatus.Pending) {
            return {
                buttons: [
                    {
                        label: "Go to Messages",
                        variant: "outlined",
                        onPress: goToMessages,
                        loading: goToMessagesLoading,
                    },
                    {
                        label: "Start contract",
                        variant: "contained",
                        onPress: handleStartContractPress,
                        loading: paymentButtonLoading,
                    },
                ],
                message: {
                    variant: "warning",
                    text: "The contract is still not funded. Once you communicate with the influencer and everything aligns you can fund and start the contract.",
                    icon: infoIcon,
                },
            };
        }
        if (status === ContractStatus.PaymentFailed) {
            return {
                buttons: [
                    {
                        label: "Go to Messages",
                        variant: "outlined",
                        onPress: goToMessages,
                        loading: goToMessagesLoading,
                    },
                    {
                        label: "Retry Payment",
                        variant: "contained",
                        onPress: () => {
                            void handlePendingPayment();
                        },
                        loading: paymentButtonLoading,
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (status === ContractStatus.Started) {
            // Backend OrderCreated (1): after order exists, payment may still be open in Razorpay.
            return {
                buttons: [
                    {
                        label: "Go to Messages",
                        variant: "outlined",
                        onPress: goToMessages,
                        loading: goToMessagesLoading,
                    },
                    {
                        label: "Continue payment",
                        variant: "contained",
                        onPress: () => {
                            void handlePendingPayment({ resumeExistingOrder: true });
                        },
                        loading: paymentButtonLoading,
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (status === ContractStatus.ShipmentPending) {
            return {
                buttons: [
                    {
                        label: "View Influencer Address",
                        variant: "outlined",
                        onPress: () => {
                            setShowShippingModal(false);
                            setShowViewAddress(true);
                        },
                        loading: showViewAddress && shippingAddressLoading,
                    },
                    {
                        label: "Add Shipment Details",
                        variant: "contained",
                        onPress: () => {
                            setShowViewAddress(false);
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
        if (status === ContractStatus.DeliveryPending) {
            return {
                buttons: [
                    {
                        label: "Go to Messages",
                        variant: "outlined",
                        onPress: goToMessages,
                        loading: goToMessagesLoading,
                    },
                    {
                        label: "Mark as Delivered",
                        variant: "contained",
                        onPress: () => setShowMarkAsDeliveredModal(true),
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (status === ContractStatus.DeliveryAcknowledgementPending) {
            return {
                buttons: [
                    {
                        label: "Go to Messages",
                        variant: "outlined",
                        onPress: goToMessages,
                        loading: goToMessagesLoading,
                    },
                    {
                        label: "Get Delivery Status",
                        variant: "contained",
                        onPress: () => {
                            void handleGetDeliveryStatus();
                        },
                        loading: deliveryStatusLoading,
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (status === ContractStatus.VideoPending) {
            return {
                buttons: [
                    {
                        label: "Go to Messages",
                        variant: "outlined",
                        onPress: goToMessages,
                        loading: goToMessagesLoading,
                    },
                    {
                        label: "Request for Video",
                        variant: "contained",
                        onPress: () => {
                            void handleRequestDeliverable();
                        },
                        loading: requestVideoLoading,
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (status === ContractStatus.ReviewPending) {
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
        if (status === ContractStatus.PostingPending) {
            return {
                buttons: [
                    {
                        label: "Go to Messages",
                        variant: "outlined",
                        onPress: goToMessages,
                        loading: goToMessagesLoading,
                    },
                    {
                        label: "Change Release Date",
                        variant: "contained",
                        onPress: () => setShowChangeDateSheet(true),
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (status === ContractStatus.SettlementPending) {
            if (brandSubmittedFeedback) {
                return {
                    buttons: [
                        {
                            label: "Go to Messages",
                            variant: "contained",
                            onPress: goToMessages,
                            loading: goToMessagesLoading,
                        },
                    ],
                    message: messageForStatus(),
                };
            }

            return {
                buttons: [
                    {
                        label: "Go to Messages",
                        variant: "outlined",
                        onPress: goToMessages,
                        loading: goToMessagesLoading,
                    },
                    {
                        label: "Give Feedback",
                        variant: "contained",
                        onPress: () => feedbackModalVisible(),
                    },
                ],
                message: messageForStatus(),
            };
        }
        if (status === ContractStatus.Settled) {
            if (brandSubmittedFeedback) {
                return {
                    buttons: [
                        {
                            label: "Go to Messages",
                            variant: "contained",
                            onPress: goToMessages,
                            loading: goToMessagesLoading,
                        },
                    ],
                    message: messageForStatus(),
                };
            }
            return {
                buttons: [
                    {
                        label: "Go to Messages",
                        variant: "outlined",
                        onPress: goToMessages,
                        loading: goToMessagesLoading,
                    },
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
        kycBlocked,
        productShipping,
        contract.status,
        contract.collaborationId,
        contract.userId,
        contract.streamChannelId,
        contract.posting?.scheduledDate,
        colors.primary,
        feedbackModalVisible,
        goToMessages,
        goToMessagesLoading,
        handleRequestDeliverable,
        requestVideoLoading,
        showViewAddress,
        shippingAddressLoading,
        handlePendingPayment,
        handleStartContractPress,
        contract.shipment,
        contract.deliverable,
        contract.feedbackFromBrand?.ratings,
        contract.feedbackFromBrand?.timeSubmitted,
        brandSubmittedFeedback,
        devOverrideStatus,
        refreshData,
        paymentButtonLoading,
        applicationQuotation,
        contract.payment?.amount,
        contract.payment?.orderId,
        contract.payment?.status,
        showContinueContractPayment,
        handleGetDeliveryStatus,
        deliveryStatusLoading,
    ]);

    return (
        <View style={styles.root}>
            <RazorpayCheckoutModal
                visible={razorpayModalProps.visible}
                options={razorpayModalProps.options}
                onSuccess={razorpayModalProps.onSuccess}
                onClose={razorpayModalProps.onClose}
                onError={razorpayModalProps.onError}
            />
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
            {showFeedbackAndInfo &&
                canShowReviewsByStatus &&
                (contract.feedbackFromBrand || showInfluencerFeedbackCard) && (
                    <Text style={styles.reviewsHeading}>Reviews & Ratings</Text>
                )}
            {showFeedbackAndInfo &&
                canShowReviewsByStatus &&
                contract.feedbackFromBrand && (
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
            {showFeedbackAndInfo && canShowReviewsByStatus && showInfluencerFeedbackCard && (
                <View style={styles.feedbackCard}>
                    <View style={styles.starsRow}>
                        {renderStars(contract.feedbackFromInfluencer?.ratings || 0)}
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

            <ViewInfluencerAddressOverlay
                visible={showViewAddress}
                onClose={closeAddressModal}
                influencerName={displayInfluencerName}
                address={kycShippingAddress}
                loading={shippingAddressLoading}
                errorMessage={shippingAddressError}
            />
            {showShippingModal && (
                <ShippingAddressModal
                    visible
                    onClose={() => setShowShippingModal(false)}
                    contractId={contractIdForApi}
                    onSuccess={refreshData}
                />
            )}
            {showMarkAsDeliveredModal && (
                <MarkAsDeliveredModal
                    visible
                    onClose={() => setShowMarkAsDeliveredModal(false)}
                    contractId={contractIdForApi}
                    onSuccess={refreshData}
                />
            )}
            <RequestRevisionModal
                visible={showRevisionModal}
                onClose={() => setShowRevisionModal(false)}
                contractId={contractIdForApi}
                onSuccess={refreshData}
            />
            <ApproveVideoReleaseBottomSheet
                visible={showApproveVideoSheet}
                onClose={() => setShowApproveVideoSheet(false)}
                contractId={contractIdForApi}
                onSuccess={refreshData}
            />
            <ReleaseOptionsBottomSheet
                visible={showReleaseSheet}
                onClose={() => setShowReleaseSheet(false)}
                contractId={contractIdForApi}
                onSuccess={refreshData}
            />
            <ChangeReleaseDateSheet
                visible={showChangeDateSheet}
                initialDate={contract.posting?.scheduledDate}
                onClose={() => setShowChangeDateSheet(false)}
                contractId={contractIdForApi}
                hasExistingScheduledDate={!!contract.posting?.scheduledDate}
                contractStatus={status}
                onSuccess={refreshData}
            />
            <StartContractPaymentBottomSheet
                visible={showStartContractPaymentSheet}
                onClose={() => setShowStartContractPaymentSheet(false)}
                onPayNow={() => {
                    void handlePayNowFromSheet();
                }}
                payNowLoading={paymentButtonLoading}
                influencerName={userData.name}
                influencerHandle={formatInfluencerHandleFromUser(userData.primarySocial)}
                influencerProfileImageUrl={userData.profileImage}
                collaborationTitle={collaborationData?.name ?? "Collaboration"}
                contractBudgetLabel={formatContractMoneyLabel(
                    applicationQuotation ?? contract.payment?.amount
                )}
                paymentAmountLabel={formatContractMoneyLabel(
                    applicationQuotation ?? contract.payment?.amount
                )}
            />
            <KycBlockedStartContractModal
                visible={showKycBlockedStartContractModal}
                onClose={() => setShowKycBlockedStartContractModal(false)}
            />
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

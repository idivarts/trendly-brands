import Colors from "@/constants/Colors";
import { useChatContext } from "@/contexts";
import { streamClient } from "@/contexts/streamClient";
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
    faCheckCircle,
    faCircleInfo,
    faClock,
    faStar,
    faStarHalfStroke
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { FC, useEffect, useState } from "react";
import { Modal, Platform } from "react-native";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";
import MarkAsDeliveredModal, { DeliveryData } from "./MarkAsDeliveredModal";
import MarkAsShippedModal, { ShippingData } from "./MarkAsShippedModal";
import ReleaseOptionsBottomSheet, { ReleasePlan } from "./ReleaseOptionsBottomSheet";
import RequestRevisionModal, { RevisionData } from "./RequestRevisionModal";
import ScheduleReleaseModal from "./ScheduleReleaseModal";
import ShippingAddressModal from "./ShippingAddressModal";
import VideoDownloadCard from "./VideoDownloadCard";

interface ActionContainerProps {
    contract: IContracts;
    refreshData: () => void;
    feedbackModalVisible: () => void;
    userData: IUsers;
    collaborationData: ICollaboration;
    paymentStatus?: "pending" | "processing" | "completed" | "failed"; // Payment status from payments collection
}

const ActionContainer: FC<ActionContainerProps> = ({
    contract,
    refreshData,
    feedbackModalVisible,
    userData,
    collaborationData,
    paymentStatus = "pending",
}) => {
    const theme = useTheme();
    const [manager, setManager] = useState<IManagers>();
    const { fetchChannelCid } = useChatContext();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showShippingAddressModal, setShowShippingAddressModal] = useState(false);
    const [showMarkAsShippedModal, setShowMarkAsShippedModal] = useState(false);
    const [showMarkAsDeliveredModal, setShowMarkAsDeliveredModal] = useState(false);
    const [showRequestRevisionModal, setShowRequestRevisionModal] = useState(false);
    const [downloadingVideo, setDownloadingVideo] = useState(false);
    const [showReleaseOptionsSheet, setShowReleaseOptionsSheet] = useState(false);
    const [showScheduleReleaseModal, setShowScheduleReleaseModal] = useState(false);
    const [showContractStartedModal, setShowContractStartedModal] = useState(false);

    // Auto-open release options sheet when status becomes 9
    useEffect(() => {
        console.log("🎬 Status changed to:", contract.status);
        console.log("showReleaseOptionsSheet state:", showReleaseOptionsSheet);
        if (contract.status === 9) {
            console.log("🎬 Status is 9 - Auto-opening release options sheet");
            setShowReleaseOptionsSheet(true);
        }
    }, [contract.status]);

    // DEBUG LOGS - Component Mount
    console.log("=== ACTION CONTAINER DEBUG ===");
    console.log("Contract Status:", contract.status);
    console.log("Contract ID:", contract.streamChannelId);
    console.log("Collaboration Data:", collaborationData);
    console.log("Collaboration Type:", collaborationData?.location?.type);
    console.log("User KYC Done:", userData?.isKYCDone);
    console.log("Payment Status:", paymentStatus);
    console.log("==============================");

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

    const startContract = async () => {
        console.log("\n=== START CONTRACT CALLED ===");
        console.log("Current Status:", contract.status);
        console.log("Collaboration Type:", collaborationData?.location?.type);
        console.log("showContractStartedModal state:", showContractStartedModal);

        const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
        const timeStarted = new Date().getTime();

        // Determine next status based on collaboration type
        // If physical_mode, go to Status 4 (Shipping Pending)
        // Otherwise, skip to Status 6 (Video Pending)
        const nextStatus = collaborationData?.location?.type === "physical_mode" ? 4 : 6;

        console.log("Next Status Calculated:", nextStatus);
        console.log("Is Physical Mode?", collaborationData?.location?.type === "physical_mode");

        try {
            console.log("🔄 Updating Firestore...");
            await updateDoc(contractRef, {
                status: nextStatus,
                contractTimestamp: {
                    startedOn: timeStarted,
                },
            });
            console.log("✅ Firestore update successful to status:", nextStatus);

            console.log("🔄 Making API call...");
            await HttpWrapper.fetch(`/api/collabs/contracts/${contract.streamChannelId}`, {
                method: "POST",
            }).then(r => {
                console.log("✅ API call successful");
                // Show contract started modal
                console.log("🎬 Setting showContractStartedModal to true...");
                setShowContractStartedModal(true);
                console.log("🎬 Modal state set, scheduling hide in 2.5 seconds...");
                setTimeout(() => {
                    console.log("🎬 2.5 seconds passed, hiding modal...");
                    setShowContractStartedModal(false);
                }, 2500); // Show for 2.5 seconds
            });

            console.log("Calling refreshData...");
            refreshData();
            console.log("==============================\n");
        } catch (error) {
            console.error("❌ Error in startContract:", error);
            console.error("❌ Error details:", JSON.stringify(error, null, 2));
        }
    };

    const fundContract = async () => {
        console.log("\n=== FUND CONTRACT CALLED ===");
        console.log("Current Status:", contract.status);

        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            await updateDoc(contractRef, {
                status: 1, // Mark as contract pending (awaiting start)
            });
            console.log("✅ Contract funded - Status updated to 1");

            // Show success modal for 1.5 seconds
            setShowSuccessModal(true);
            console.log("Success modal shown");
            setTimeout(() => {
                setShowSuccessModal(false);
                console.log("Success modal hidden, refreshing data...");
                refreshData();
            }, 1500);
            console.log("==============================\n");
        } catch (error) {
            console.error("❌ Failed to fund contract:", error);
            Toaster.error("Failed to fund contract");
        }
    };

    const handleMarkAsShipped = async (shippingData: ShippingData) => {
        console.log("\n=== MARK AS SHIPPED CALLED ===");
        console.log("Current Status:", contract.status);
        console.log("Shipping Data:", shippingData);

        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            const updateData = {
                status: 5, // Move to Delivery Pending
                shippingDetails: {
                    ...shippingData,
                    shippedAt: new Date().getTime(),
                },
            };
            console.log("Update Data:", updateData);

            await updateDoc(contractRef, updateData);
            console.log("✅ Shipment marked - Status updated to 5");

            Toaster.success("Shipment marked as shipped successfully");
            console.log("Calling refreshData...");
            refreshData();
            console.log("==============================\n");
        } catch (error) {
            console.error("❌ Failed to mark as shipped:", error);
            Toaster.error("Failed to mark as shipped");
            throw error;
        }
    };

    const handleMarkAsDelivered = async (deliveryData: DeliveryData) => {
        console.log("\n=== MARK AS DELIVERED CALLED ===");
        console.log("Current Status:", contract.status);
        console.log("Delivery Data:", deliveryData);

        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            const updateData = {
                status: 6, // Move to Video Pending
                deliveryDetails: {
                    ...deliveryData,
                    deliveredAt: new Date().getTime(),
                },
            };
            console.log("Update Data:", updateData);

            await updateDoc(contractRef, updateData);
            console.log("✅ Delivery confirmed - Status updated to 6");

            Toaster.success("Delivery confirmed successfully");
            console.log("Calling refreshData...");
            refreshData();
            console.log("==============================\n");
        } catch (error) {
            console.error("❌ Failed to mark as delivered:", error);
            Toaster.error("Failed to confirm delivery");
            throw error;
        }
    };

    // DEBUG: Reset contract status for testing (DEV ONLY)
    const resetContractForTesting = async (targetStatus: number) => {
        console.log("\n=== RESET CONTRACT FOR TESTING ===");
        console.log("Resetting from Status:", contract.status, "to Status:", targetStatus);
        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            await updateDoc(contractRef, { status: targetStatus });
            console.log("✅ Contract reset to status:", targetStatus);
            Toaster.success(`Contract reset to Status ${targetStatus} for testing`);
            refreshData();
        } catch (error) {
            console.error("❌ Failed to reset contract:", error);
            Toaster.error("Failed to reset contract");
        }
    };

    const sendVideoRequestMessage = async () => {
        console.log("\n=== SEND VIDEO REQUEST MESSAGE ===");
        try {
            // Send a system message to the influencer requesting the video
            const messageText = "Hi! We're ready for your content delivery. Please upload the video/assets at your earliest convenience. Thank you!";

            console.log("📤 Sending message:", messageText);
            console.log("📤 Channel ID:", contract.streamChannelId);
            console.log("📤 streamClient:", streamClient);
            console.log("📤 streamClient.user:", streamClient.user);

            // Send message via Stream Chat API
            console.log("📤 Creating channel object...");
            const channel = streamClient.channel("messaging", contract.streamChannelId);
            console.log("📤 Channel created:", channel);
            
            console.log("📤 Watching channel...");
            await channel.watch();
            console.log("✅ Channel watched successfully");
            
            console.log("📤 Sending message via channel...");
            const sentMessage = await channel.sendMessage({
                text: messageText,
            });
            console.log("✅ Message sent successfully:", sentMessage);
            Toaster.success("Video request sent to influencer");

            // Navigate to messages
            console.log("📤 Navigating to messages...");
            if (Platform.OS == "web")
                router.navigate(`/messages?channelId=${contract.streamChannelId}`);
            else {
                const channelCid = await fetchChannelCid(contract.streamChannelId);
                console.log("📤 Channel CID:", channelCid);
                router.navigate(`/channel/${channelCid}`);
            }
            console.log("✅ Navigation complete");
            console.log("==============================\n");
        } catch (error) {
            console.error("❌ Failed to send message:", error);
            console.error("❌ Error details:", JSON.stringify(error, null, 2));
            Toaster.error("Failed to send message");
        }
    };

    const handleRequestRevision = async (revisionData: RevisionData) => {
        console.log("\n=== REQUEST REVISION CALLED ===");
        console.log("Current Status:", contract.status);
        console.log("Revision Reason:", revisionData.reason);

        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            const updateData = {
                status: 8, // Move to Revision Pending
                revisionRequest: {
                    reason: revisionData.reason,
                    requestedAt: new Date().getTime(),
                },
            };
            console.log("Update Data:", updateData);

            await updateDoc(contractRef, updateData);
            console.log("✅ Revision requested - Status updated to 8");

            Toaster.success("Revision request sent to influencer");
            console.log("Calling refreshData...");
            refreshData();
            console.log("==============================\n");
        } catch (error) {
            console.error("❌ Failed to request revision:", error);
            Toaster.error("Failed to request revision");
            throw error;
        }
    };

    const handleApproveVideo = async () => {
        console.log("\n=== APPROVE VIDEO CALLED ===");
        console.log("Current Status:", contract.status);

        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            await updateDoc(contractRef, {
                status: 9, // Move to Release Pending
                videoApprovedAt: new Date().getTime(),
            });
            console.log("✅ Video approved - Status updated to 9");

            Toaster.success("Video approved successfully");
            console.log("Calling refreshData...");
            refreshData();
            setShowReleaseOptionsSheet(true);
            console.log("==============================\n");
        } catch (error) {
            console.error("❌ Failed to approve video:", error);
            Toaster.error("Failed to approve video");
        }
    };

    const handleReleaseOptionSelect = async (plan: ReleasePlan) => {
        console.log("\n=== RELEASE OPTION SELECTED ===");
        console.log("Selected Plan:", plan);
        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            await updateDoc(contractRef, {
                status: 10, // Move to Release Scheduled Pending
                releasePlan: plan,
                releasePlanChosenAt: new Date().getTime(),
            });
            Toaster.success("Release plan saved");
            refreshData();
            setShowReleaseOptionsSheet(false);
        } catch (error) {
            console.error("❌ Failed to save release plan:", error);
            Toaster.error("Failed to save release plan");
        }
    };

    const openScheduleRelease = () => {
        setShowScheduleReleaseModal(true);
    };

    const handleScheduleReleaseConfirm = async (date: Date) => {
        console.log("\n=== SCHEDULE RELEASE CONFIRM ===");
        console.log("Selected Date:", date.toISOString());
        try {
            const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
            await updateDoc(contractRef, {
                status: 10, // Keep in Release Scheduled stage
                releaseScheduledFor: date.getTime(),
            });
            Toaster.success("Release scheduled");
            refreshData();
        } catch (error) {
            console.error("❌ Failed to schedule release:", error);
            Toaster.error("Failed to schedule release");
        }
    };

    const handleDownloadVideo = async () => {
        console.log("\n=== DOWNLOAD VIDEO ===");
        try {
            setDownloadingVideo(true);
            // TODO: Implement actual video download
            console.log("Downloading video...");
            Toaster.success("Video download started");
            setDownloadingVideo(false);
        } catch (error) {
            console.error("Failed to download video:", error);
            Toaster.error("Failed to download video");
            setDownloadingVideo(false);
        }
    };


    const getStatusConfig = () => {
        console.log("\n=== GET STATUS CONFIG ===");
        console.log("Contract Status:", contract.status);
        console.log("User KYC Done:", userData?.isKYCDone);

        // Check KYC status first - if KYC is not done, show KYC pending state regardless of contract status
        if (!userData?.isKYCDone) {
            console.log("❌ KYC Not Done - Showing KYC Pending");
            console.log("=========================\n");
            return {
                title: "Influencer KYC Pending",
                message: "You cannot start the contract with the influencer unless they are verified with us. You can nudge them for the same in the chat.",
                showWarning: true,
                buttons: [
                    {
                        label: "Influencer KYC Pending",
                        mode: "contained",
                        disabled: true,
                        onPress: () => { },
                    },
                ],
            };
        }

        const statusMap: Record<number, any> = {
            // Status 0: Payment Confirmation Pending (First stage after KYC)
            0: {
                title: "Payment Confirmation Pending",
                message: "The contract is still not funded. Once you communicate with the influencer and everything aligns you can fund and start the contract.",
                showWarning: true,
                warningAboveButtons: false,
                buttons: [
                    {
                        label: "Fund Contract",
                        mode: "contained",
                        disabled: false,
                        onPress: fundContract,
                    },
                ],
            },
            // Status 1: Contract Pending (After payment is confirmed, awaiting contract start)
            1: {
                title: "Contract Pending",
                message: "The contract is funded and ready to start. Make sure everything is aligned with the influencer before starting.",
                showSuccess: true,
                successMessage: "Congratulations! Your contract is funded. You can now start the contract with influencer",
                showWarning: false,
                buttons: [
                    {
                        label: "Start Contract",
                        mode: "contained",
                        disabled: false,
                        onPress: () => {
                            openModal({
                                confirmAction: startContract,
                                confirmText: "Confirm",
                                title: "Start this Contract?",
                                description: "Are you sure? Make sure you discuss the pricing and final deliverable before starting the contract"
                            })
                        },
                    },
                ],
            },
            // Status 2: Contract Active
            2: {
                title: "Contract Active",
                message: "Please note, if your collaboration is done, we would need you to close the collaboration here. Having open collaborations idle for a long time can end up reducing the rating",
                showWarning: false,
                buttons: [
                    {
                        label: "End Contract",
                        mode: "contained-tonal",
                        disabled: false,
                        onPress: () => {
                            openModal({
                                confirmAction: feedbackModalVisible,
                                confirmText: "End Contract",
                                title: "End your contract?",
                                description: "Are you sure you want to end the contract? This action cant be reversed."
                            })
                        },
                    },
                    {
                        label: "Go to Messages",
                        mode: "contained",
                        disabled: false,
                        onPress: async () => {
                            if (Platform.OS == "web")
                                router.navigate(`/messages?channelId=${contract.streamChannelId}`);
                            else {
                                const channelCid = await fetchChannelCid(contract.streamChannelId);
                                router.navigate(`/channel/${channelCid}`);
                            }
                        },
                    },
                ],
            },
            // Status 3: Payment Failed
            3: {
                title: "Payment Failed",
                message: "Payment was unsuccessful. Please try again.",
                showWarning: true,
                warningAboveButtons: false,
                buttons: [
                    {
                        label: "Retry Payment",
                        mode: "contained",
                        disabled: false,
                        onPress: () => {
                            Toaster.info("Razorpay payment will be implemented soon");
                        },
                    },
                ],
            },
            // Status 4: Shipping Pending (Only for physical_mode collaborations)
            4: {
                title: "Shipping Pending",
                message: "Please get the shipping address and ship the product to the influencer. Don't forget to mark it as shipped once you have done",
                showWarning: true,
                warningAboveButtons: false,
                buttons: collaborationData?.location?.type === "physical_mode" ? [
                    {
                        label: "Get Shipping Address",
                        mode: "outlined",
                        disabled: false,
                        onPress: () => {
                            console.log("\n📍 Get Shipping Address button clicked");
                            console.log("User Address:", userData.currentAddress);
                            setShowShippingAddressModal(true);
                        },
                    },
                    {
                        label: "Mark as Shipped",
                        mode: "contained",
                        disabled: false,
                        onPress: () => {
                            console.log("\n📦 Mark as Shipped button clicked");
                            setShowMarkAsShippedModal(true);
                        },
                    },
                ] : [],
            },
            // Status 5: Delivery Pending
            5: {
                title: "Delivery Pending",
                message: "The shipment is in progress. Please check with the influencer if they received the product",
                showWarning: true,
                warningAboveButtons: false,
                buttons: [
                    {
                        label: "Go to Messages",
                        mode: "outlined",
                        disabled: false,
                        onPress: async () => {
                            console.log("\n💬 Go to Messages button clicked");
                            if (Platform.OS == "web")
                                router.navigate(`/messages?channelId=${contract.streamChannelId}`);
                            else {
                                const channelCid = await fetchChannelCid(contract.streamChannelId);
                                router.navigate(`/channel/${channelCid}`);
                            }
                        },
                    },
                    {
                        label: "Mark Delivered",
                        mode: "contained",
                        disabled: false,
                        onPress: () => {
                            console.log("\n📦 Mark Delivered button clicked");
                            setShowMarkAsDeliveredModal(true);
                        },
                    },
                ],
            },
            // Status 6: Video Pending
            6: {
                title: "Video Pending",
                message: "The influencer is all set for the delivery of the content. Please coordinate with the influencer to get the video done",
                successMessage: "The influencer is all set for the delivery of the content. Please coordinate with the influencer to get the video done",
                showSuccess: true,
                showWarning: false,
                buttons: [
                    {
                        label: "Go to Messages",
                        mode: "outlined",
                        disabled: false,
                        onPress: async () => {
                            console.log("\n💬 Go to Messages button clicked");
                            if (Platform.OS == "web")
                                router.navigate(`/messages?channelId=${contract.streamChannelId}`);
                            else {
                                const channelCid = await fetchChannelCid(contract.streamChannelId);
                                router.navigate(`/channel/${channelCid}`);
                            }
                        },
                    },
                    {
                        label: "Request for Video",
                        mode: "contained",
                        disabled: false,
                        onPress: sendVideoRequestMessage,
                    },
                ],
            },
            // Status 7: Review Pending
            7: {
                title: "Review Pending",
                message: "",
                showWarning: false,
                showVideoCard: true,
                videoCardAboveButtons: false,
                buttons: [
                    {
                        label: "Request for Revision",
                        mode: "outlined",
                        disabled: false,
                        onPress: () => {
                            console.log("\n🔧 Request for Revision button clicked");
                            setShowRequestRevisionModal(true);
                        },
                    },
                    {
                        label: "Approve the Video",
                        mode: "contained",
                        disabled: false,
                        onPress: () => {
                            openModal({
                                confirmAction: handleApproveVideo,
                                confirmText: "Approve",
                                title: "Approve this Video?",
                                description: "Are you sure you want to approve this video? Once approved, the video will move to the release pending stage."
                            })
                        },
                    },
                ],
            },
            // Status 8: Revision Pending
            8: {
                title: "Revision Pending",
                message: "Influencer is revising the content based on your feedback. Please wait.",
                showWarning: true,
                warningAboveButtons: false,
                showRevisionDetails: true,
                buttons: [
                    {
                        label: "Request for Revision",
                        mode: "outlined",
                        disabled: false,
                        onPress: () => {
                            console.log("\n🔧 Request for Revision button clicked");
                            setShowRequestRevisionModal(true);
                        },
                    },
                    {
                        label: "Approve the Video",
                        mode: "contained",
                        disabled: false,
                        onPress: () => {
                            openModal({
                                confirmAction: handleApproveVideo,
                                confirmText: "Approve",
                                title: "Approve this Video?",
                                description: "Are you sure you want to approve this video? Once approved, the video will move to the release pending stage."
                            })
                        },
                    },
                ],
            },
            // Status 9: Release Pending
            9: {
                title: "Release Pending",
                message: "",
                showWarning: false,
                showReleaseOptions: true,
                buttons: [],
            },
            // Status 10: Release Scheduled
            10: {
                title: "Release Scheduled Pending",
                message: (() => {
                    const releaseDate = (contract as any).releaseScheduledFor;
                    if (releaseDate) {
                        const date = new Date(releaseDate);
                        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
                        const formattedDate = date.toLocaleDateString('en-US', options);
                        return `Video is scheduled for ${formattedDate}`;
                    }
                    return "Release can only be scheduled for future 30 days after the receipt of the video.";
                })(),
                showWarning: true,
                warningAboveButtons: false,
                showVideoCard: true,
                videoCardAboveButtons: false,
                buttons: [
                    {
                        label: "Go to Messages",
                        mode: "outlined",
                        disabled: false,
                        onPress: async () => {
                            if (Platform.OS == "web")
                                router.navigate(`/messages?channelId=${contract.streamChannelId}`);
                            else {
                                const channelCid = await fetchChannelCid(contract.streamChannelId);
                                router.navigate(`/channel/${channelCid}`);
                            }
                        },
                    },
                    {
                        label: "Change Schedule",
                        mode: "contained",
                        disabled: false,
                        onPress: openScheduleRelease,
                    },
                ],
            },
            // Status 11: Video Posted
            11: {
                title: "Video Posted",
                message: "The Video is successfully posted",
                showSuccess: true,
                successMessage: "The Video is successfully posted",
                showWarning: false,
                showVideoCard: false,
                buttons: [
                    {
                        label: "Go to Messages",
                        mode: "outlined",
                        disabled: false,
                        onPress: async () => {
                            if (Platform.OS == "web")
                                router.navigate(`/messages?channelId=${contract.streamChannelId}`);
                            else {
                                const channelCid = await fetchChannelCid(contract.streamChannelId);
                                router.navigate(`/channel/${channelCid}`);
                            }
                        },
                    },
                    {
                        label: "Give Feedback",
                        mode: "contained",
                        disabled: false,
                        onPress: feedbackModalVisible,
                    },
                ],
            },
            // Status 12: Settlement Done
            12: {
                title: "Settlement Done",
                message: "Feedbacks are important for us. Our platform works on what people give feedback to each other. You see that other persons feedback only if you give your feedback",
                showWarning: false,
                buttons: [
                    {
                        label: "View Details",
                        mode: "contained",
                        disabled: false,
                        onPress: () => {
                            Toaster.info("Contract details feature coming soon");
                        },
                    },
                ],
            },
        };

        const config = statusMap[contract.status] || statusMap[0];
        console.log("Status Config:", {
            status: contract.status,
            title: config.title,
            hasButtons: config.buttons?.length || 0,
            showWarning: config.showWarning,
            showSuccess: config.showSuccess,
            showReleaseOptions: config.showReleaseOptions,
            showVideoCard: config.showVideoCard,
        });
        console.log("=========================\n");
        return config;
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

    const { openModal } = useConfirmationModel()

    return (
        <View
            style={{
                width: "100%",
                flexDirection: "column",
                gap: 16,
                backgroundColor: "transparent",
            }}
        >
            {/* DEBUG: Testing Controls (DEV ONLY) */}
            {__DEV__ && (
                <View
                    style={{
                        backgroundColor: "#FFF3CD",
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: "#FF9800",
                    }}
                >
                    <Text style={{ fontWeight: "bold", marginBottom: 8, color: "#000" }}>
                        🧪 TEST CONTROLS (Dev Only)
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((status) => (
                            <Button
                                key={status}
                                mode="outlined"
                                compact
                                onPress={() => resetContractForTesting(status)}
                                style={{
                                    borderColor: contract.status === status ? "#4CAF50" : "#FF9800",
                                    backgroundColor: contract.status === status ? "#E8F5E9" : "transparent"
                                }}
                            >
                                S{status}
                            </Button>
                        ))}
                    </View>
                    <Text style={{ fontSize: 12, marginTop: 4, color: "#666" }}>
                        Current: Status {contract.status} | Type: {collaborationData?.location?.type}
                    </Text>
                </View>
            )}

            {/* Status-based Action Buttons */}
            {contract.status < 13 && (
                <>
                    {/* Warning Box - Only show when needed and warningAboveButtons is not false */}
                    {getStatusConfig().showWarning && getStatusConfig().warningAboveButtons !== false && (
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "flex-start",
                                backgroundColor: Colors(theme).gold,
                                borderRadius: 16,
                                padding: 16,
                                gap: 12,
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faClock}
                                size={24}
                                color="#000"
                                style={{ marginTop: 0, flexShrink: 0, alignSelf: "center" }}
                            />
                            <Text
                                style={{
                                    flex: 1,
                                    fontSize: 16,
                                    lineHeight: 22,
                                    color: "#000",
                                    fontWeight: "500",
                                }}
                            >
                                {getStatusConfig().message}
                            </Text>
                        </View>
                    )}

                    {/* Render order: Video card above buttons by default; swap for Status 7 and Status 10 */}
                    {getStatusConfig().videoCardAboveButtons !== false ? (
                        <>
                            {/* Video Download Card - Only show when needed */}
                            {getStatusConfig().showVideoCard && (
                                <VideoDownloadCard
                                    videoTitle="Video Received"
                                    onDownload={handleDownloadVideo}
                                    downloading={downloadingVideo}
                                />
                            )}

                            {/* Action Buttons */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    gap: 16,
                                    backgroundColor: "transparent",
                                    flexWrap: "wrap",
                                }}
                            >
                                {getStatusConfig().buttons.map((button: any, index: number) => (
                                    <Button
                                        key={index}
                                        mode={button.mode}
                                        disabled={button.disabled}
                                        style={{
                                            flex: 1,
                                            minWidth: 140,
                                        }}
                                        onPress={button.onPress}
                                    >
                                        {button.label}
                                    </Button>
                                ))}
                            </View>
                        </>
                    ) : (
                        <>
                            {/* Action Buttons first when videoCardAboveButtons is false */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    gap: 16,
                                    backgroundColor: "transparent",
                                    flexWrap: "wrap",
                                }}
                            >
                                {getStatusConfig().buttons.map((button: any, index: number) => (
                                    <Button
                                        key={index}
                                        mode={button.mode}
                                        disabled={button.disabled}
                                        style={{
                                            flex: 1,
                                            minWidth: 140,
                                        }}
                                        onPress={button.onPress}
                                    >
                                        {button.label}
                                    </Button>
                                ))}
                            </View>

                            {/* Warning Box below buttons when warningAboveButtons is false */}
                            {getStatusConfig().showWarning && getStatusConfig().warningAboveButtons === false && (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "flex-start",
                                        backgroundColor: Colors(theme).gold,
                                        borderRadius: 16,
                                        padding: 16,
                                        gap: 12,
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faClock}
                                        size={24}
                                        color="#000"
                                        style={{ marginTop: 0, flexShrink: 0, alignSelf: "center" }}
                                    />
                                    <Text
                                        style={{
                                            flex: 1,
                                            fontSize: 16,
                                            lineHeight: 22,
                                            color: "#000",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {getStatusConfig().message}
                                    </Text>
                                </View>
                            )}

                            {/* Video Download Card below warning when both flags are false */}
                            {getStatusConfig().showVideoCard && (
                                <VideoDownloadCard
                                    videoTitle="Video Received"
                                    onDownload={handleDownloadVideo}
                                    downloading={downloadingVideo}
                                />
                            )}
                        </>
                    )}

                    {/* Success/Congratulations Box - Only show when needed */}
                    {getStatusConfig().showSuccess && getStatusConfig().successMessage && (
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "flex-start",
                                backgroundColor: "#C8E6C9",
                                borderRadius: 16,
                                padding: 16,
                                gap: 12,
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faCheckCircle}
                                size={24}
                                color="#2E7D32"
                                style={{ marginTop: 0, flexShrink: 0, alignSelf: "center" }}
                            />
                            <Text
                                style={{
                                    flex: 1,
                                    fontSize: 16,
                                    lineHeight: 22,
                                    color: "#1B5E20",
                                    fontWeight: "500",
                                }}
                            >
                                {getStatusConfig().successMessage}
                            </Text>
                        </View>
                    )}

                    {/* Revision Details Box - Only show for Status 8 */}
                    {getStatusConfig().showRevisionDetails && (contract as any).revisionRequest && (
                        <View
                            style={{
                                backgroundColor: Colors(theme).gray200,
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: Colors(theme).gray300,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontWeight: "bold",
                                    color: Colors(theme).text,
                                    marginBottom: 12,
                                }}
                            >
                                Revision Request Details
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: Colors(theme).gray300,
                                    lineHeight: 20,
                                }}
                            >
                                {(contract as any).revisionRequest.reason}
                            </Text>
                        </View>
                    )}
                </>
            )}

            {/* Feedback from Brand */}
            {contract.feedbackFromBrand && (
                <View
                    style={{
                        width: "100%",
                        borderWidth: 0.3,
                        padding: 10,
                        borderRadius: 10,
                        gap: 10,
                        borderColor: Colors(theme).gray300,
                    }}
                >
                    <View style={{ flexDirection: "row" }}>
                        {renderStars(contract.feedbackFromBrand.ratings || 0)}
                    </View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            flexGrow: 1,
                        }}
                    >
                        <ImageComponent
                            url={manager?.profileImage || ""}
                            altText={manager?.name || ""}
                            initials={manager?.name || ""}
                            shape="circle"
                            size="small"
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                        />
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontWeight: "bold",
                                    color: Colors(theme).text,
                                }}
                            >
                                From Brand ({manager?.name})
                            </Text>
                            <Text
                                style={{
                                    fontSize: 16,
                                    flexWrap: "wrap",
                                    overflow: "hidden",
                                    lineHeight: 22,
                                    color: Colors(theme).text,
                                }}
                            >
                                {contract.feedbackFromBrand.feedbackReview}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Feedback from Influencer */}
            {contract.feedbackFromInfluencer && (
                <View
                    style={{
                        borderWidth: 0.3,
                        padding: 10,
                        borderRadius: 10,
                        gap: 10,
                        borderColor: Colors(theme).gray300,
                    }}
                >
                    <View style={{ flexDirection: "row" }}>
                        {renderStars(contract.feedbackFromInfluencer.ratings || 0)}
                    </View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            flexGrow: 1,
                        }}
                    >
                        <ImageComponent
                            url={userData.profileImage || ""}
                            altText={userData.name}
                            initials={userData.name}
                            shape="circle"
                            size="small"
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                        />
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontWeight: "bold",
                                    color: Colors(theme).text,
                                }}
                            >
                                From Influencer ({userData.name})
                            </Text>
                            <Text
                                style={{
                                    fontSize: 16,
                                    flexWrap: "wrap",
                                    overflow: "hidden",
                                    lineHeight: 22,
                                    color: Colors(theme).text,
                                }}
                            >
                                {contract.feedbackFromInfluencer?.feedbackReview}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Status Info Message - Only shown if no warning and no success message */}
            {!getStatusConfig().showWarning && !getStatusConfig().showSuccess && getStatusConfig().message && (
                <View
                    style={{
                        backgroundColor: Colors(theme).gold,
                        padding: 16,
                        borderRadius: 5,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <FontAwesomeIcon icon={faCircleInfo} size={20} />
                    <Text style={{ fontSize: 16, width: "95%" }}>
                        {getStatusConfig().message}
                    </Text>
                </View>
            )}

            {/* Success Modal - Shows for 1.5 seconds after contract is funded */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 20,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: 32,
                            alignItems: "center",
                            gap: 16,
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faCheckCircle}
                            size={64}
                            color="#2E7D32"
                        />
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: "bold",
                                color: "#1B5E20",
                                textAlign: "center",
                            }}
                        >
                            Congratulations!
                        </Text>
                        <Text
                            style={{
                                fontSize: 16,
                                color: "#333",
                                textAlign: "center",
                                lineHeight: 22,
                            }}
                        >
                            Your contract is funded. You can now start the contract with the influencer.
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Shipping Address Modal */}
            <ShippingAddressModal
                visible={showShippingAddressModal}
                onClose={() => setShowShippingAddressModal(false)}
                userData={userData}
            />

            {/* Mark as Shipped Modal */}
            <MarkAsShippedModal
                visible={showMarkAsShippedModal}
                onClose={() => setShowMarkAsShippedModal(false)}
                onConfirm={handleMarkAsShipped}
            />

            {/* Mark as Delivered Modal */}
            <MarkAsDeliveredModal
                visible={showMarkAsDeliveredModal}
                onClose={() => setShowMarkAsDeliveredModal(false)}
                onConfirm={handleMarkAsDelivered}
            />

            {/* Request Revision Modal */}
            <RequestRevisionModal
                visible={showRequestRevisionModal}
                onClose={() => setShowRequestRevisionModal(false)}
                onConfirm={handleRequestRevision}
            />

            {/* Release Options Bottom Sheet - shown in Status 9 */}
            {(() => {
                const shouldShow = getStatusConfig().showReleaseOptions && showReleaseOptionsSheet;
                console.log("📊 Bottom sheet visibility check:", {
                    showReleaseOptions: getStatusConfig().showReleaseOptions,
                    showReleaseOptionsSheet,
                    shouldShow,
                    status: contract.status
                });
                return null;
            })()}
            <ReleaseOptionsBottomSheet
                visible={getStatusConfig().showReleaseOptions && showReleaseOptionsSheet}
                onClose={() => setShowReleaseOptionsSheet(false)}
                onSelect={handleReleaseOptionSelect}
            />

            {/* Schedule Release Modal - shown in Status 10 */}
            <ScheduleReleaseModal
                visible={showScheduleReleaseModal}
                onClose={() => setShowScheduleReleaseModal(false)}
                minDate={new Date(((contract as any).videoApprovedAt) || Date.now())}
                maxDate={new Date((((contract as any).videoApprovedAt) || Date.now()) + 30 * 24 * 60 * 60 * 1000)}
                onConfirm={handleScheduleReleaseConfirm}
            />
            {/* Contract Started Modal - shown for 2-3 seconds after starting contract */}
            <Modal
                visible={showContractStartedModal}
                transparent
                statusBarTranslucent
                onRequestClose={() => { }}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: Colors(theme).background,
                            borderRadius: 16,
                            padding: 24,
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faCheckCircle}
                            size={48}
                            color={Colors(theme).primary}
                        />
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "600",
                                color: Colors(theme).text,
                                textAlign: "center",
                            }}
                        >
                            Contract Started Successfully!
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ActionContainer;

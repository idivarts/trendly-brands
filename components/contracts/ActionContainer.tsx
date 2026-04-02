import Colors from "@/shared-uis/constants/Colors";
import { useChatContext } from "@/contexts";
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
import React, { FC, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";

interface ActionContainerProps {
    contract: IContracts;
    refreshData: () => void;
    feedbackModalVisible: () => void;
    userData: IUsers;
    slot?: "all" | "buttons" | "feedback-and-info";
}

const ActionContainer: FC<ActionContainerProps> = ({
    contract,
    refreshData,
    feedbackModalVisible,
    userData,
    slot = "all",
}) => {
    const theme = useTheme();
    const [manager, setManager] = useState<IManagers>();
    const { fetchChannelCid } = useChatContext();

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
        const contractRef = doc(FirestoreDB, "contracts", contract.streamChannelId);
        const timeStarted = new Date().getTime();
        await updateDoc(contractRef, {
            status: 1,
            contractTimestamp: {
                startedOn: timeStarted,
            },
        })
        await HttpWrapper.fetch(`/api/collabs/contracts/${contract.streamChannelId}`, {
            method: "POST",
        }).then(r => {
            Toaster.success("Your Contract has started")
        })
        refreshData();
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
    const styles = useMemo(() => createStyles(colors, contract.status), [colors, contract.status]);

    const showButtons = slot === "all" || slot === "buttons";
    const showFeedbackAndInfo = slot === "all" || slot === "feedback-and-info";

    return (
        <View style={styles.root}>
            {showButtons && contract.status < 2 && (
                <View style={styles.buttonsRow}>
                    {contract.status === 0 && (
                        <>
                            <Button
                                mode="outlined"
                                style={styles.buttonFlex}
                                onPress={() => {
                                    HttpWrapper.fetch(`/api/collabs/collaborations/${contract.collaborationId}/applications/${contract.userId}/revise`, {
                                        method: "POST",
                                    }).then(r => {
                                        Toaster.success("Successfully notified influencer to revise quotation")
                                    })
                                }}
                            >
                                Ask To Revise Quote
                            </Button>
                            <Button
                                mode="contained"
                                style={styles.buttonFlex}
                                onPress={() => {
                                    openModal({
                                        confirmAction: startContract,
                                        confirmText: "Confirm",
                                        title: "Start this Contract?",
                                        description: "Are you sure? Make sure you discuss the pricing and final deliverable before starting the contract"
                                    })
                                }}
                            >
                                Start Contract
                            </Button>
                        </>
                    )}
                    {contract.status === 1 && (
                        <>
                            <Button
                                mode="contained-tonal"
                                style={styles.buttonFlex}
                                onPress={() => {
                                    openModal({
                                        confirmAction: feedbackModalVisible,
                                        confirmText: "End Contract",
                                        title: "End your contract?",
                                        description: "Are you sure you want to end the contract? This action cant be reversed."
                                    })
                                }}
                            >
                                End Contract
                            </Button>
                            <Button
                                mode="contained"
                                style={styles.buttonFlex}
                                onPress={async () => {

                                    if (Platform.OS == "web")
                                        router.navigate(`/messages?channelId=${contract.streamChannelId}`);
                                    else {
                                        const channelCid = await fetchChannelCid(
                                            contract.streamChannelId
                                        );
                                        router.navigate(`/channel/${channelCid}`);
                                    }
                                }}
                            >
                                Go to Messages
                            </Button>
                        </>
                    )}
                </View>
            )}
            {showFeedbackAndInfo && (
                <View style={styles.infoBox}>
                    <FontAwesomeIcon icon={faCircleInfo} size={20} />
                    <Text style={styles.infoText}>
                        {contract.status === 0
                            ? "Please make sure to use this chat to first understand the the influencer. Post that, you can start your collaboration here"
                            : contract.status === 1
                                ? "Please note, if your collaboration is done, we would need you to close the collaboration here. Having open collaborations idle for a long time can end up reducing the rating"
                                : contract.status === 2
                                    ? "Feedbacks are important for us. Our platform works on what people give feedback to each other. You see that other persons feedback only if you give your feedback"
                                    : "You can create new collaboration and invite user to collaboration"}
                    </Text>
                </View>
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
        </View>
    );
}

function createStyles(colors: ReturnType<typeof Colors>, status: number) {
    const infoBoxBg = status === 0 || status === 1 || status === 2 ? colors.gold : colors.green;
    return StyleSheet.create({
        root: {
            width: "100%",
            flexDirection: "column",
            gap: 16,
            backgroundColor: "transparent",
        },
        buttonsRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 16,
            backgroundColor: "transparent",
        },
        buttonFlex: { flex: 1 },
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
        infoBox: {
            backgroundColor: infoBoxBg,
            padding: 16,
            borderRadius: 5,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        infoText: { fontSize: 16, width: "95%" },
    });
}

export default ActionContainer;

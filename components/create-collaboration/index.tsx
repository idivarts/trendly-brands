import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import ScreenOne from "@/components/create-collaboration/screen-one";
import ScreenTwo from "@/components/create-collaboration/screen-two";
import Colors from "@/constants/Colors";
import { useCollaborationContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useProcess } from "@/hooks";
import usePublishCollaboration from "@/hooks/usePublishCollaboration";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useTheme } from "@react-navigation/native";
import { ActivityIndicator, Modal } from "react-native";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";
import PreviewCollaboration from "./PreviewCollaboration";
import ScreenThree from "./screen-three";

const CreateCollaboration = () => {
    const [collaboration, setCollaboration] = useState<Partial<ICollaboration>>({
        name: "",
        brandId: "",
        managerId: "",
        attachments: [],
        description: "",
        promotionType: PromotionType.BARTER_COLLAB,
        budget: {
            min: 0,
            max: 0,
        },
        preferredContentLanguage: ["English", "Hindi"],
        contentFormat: [],
        platform: [],
        numberOfInfluencersNeeded: 1,
        location: {
            type: "Remote",
            name: "",
            latlong: {
                lat: 0,
                long: 0,
            },
        },
        externalLinks: [],
        questionsToInfluencers: [],
        preferences: {},
        status: "",
        timeStamp: 0,
        viewsLastHour: 0,
        lastReviewedTimeStamp: 0,
    });

    const [mapRegion, setMapRegion] = useState({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    const [screen, setScreen] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isEdited, setIsEdited] = useState(false);
    const theme = useTheme();
    const params = useLocalSearchParams();
    const type = params.id ? "Edit" : "Add";
    const { publish } = usePublishCollaboration();
    const isSavingRef = useRef(false);

    const {
        isProcessing,
        processMessage,
        processPercentage,
        setIsProcessing,
        setProcessMessage,
        setProcessPercentage,
    } = useProcess();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [publishState, setPublishState] = useState<
        "idle" | "in-process" | "fail" | "success"
    >("idle");
    const [publishErrorMessage, setPublishErrorMessage] = useState<string | null>(
        null
    );
    const [publishedCollabId, setPublishedCollabId] = useState<string | null>(null);

    const { selectedBrand, isOnFreeTrial } = useBrandContext();
    const { getCollaborationById, createCollaboration, updateCollaboration } =
        useCollaborationContext();

    const { openModal } = useConfirmationModel();

    const fetchCollaboration = async (id: string) => {
        const collaboration = await getCollaborationById(id);
        setCollaboration(collaboration);

        setAttachments(collaboration?.attachments || []);

        if (collaboration.location.latlong) {
            setMapRegion({
                latitude: collaboration.location.latlong.lat,
                longitude: collaboration.location.latlong.long,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
        }
    };

    useEffect(() => {
        if (params.id && typeof params.id === "string") {
            setIsLoading(true);
            fetchCollaboration(params.id).finally(() => {
                setIsLoading(false);
            });
        }
    }, []);

    const onLocationChange = (
        latlong: { lat: number; long: number },
        address: string
    ) => {
        setCollaboration({
            ...collaboration,
            location: {
                ...collaboration.location,
                type: "On-Site",
                name: address,
                latlong,
            },
        });
    };

    const handleCollaboration = async (
        data: Partial<ICollaboration>
    ): Promise<void> => {
        if (params.id && typeof params.id === "string") {
            await updateCollaboration(params.id, data);
        } else {
            await createCollaboration(data);
        }
    };

    const notifyUprade = () => {
        openModal({
            title: "Free Trial!",
            description:
                "You need to upgrade your plan to be able to post a collaboration",
            confirmAction: () => {
                router.push("/billing");
            },
            confirmText: "Upgrade Now",
        });
    };

    const resetPublishModal = () => {
        setPublishState("idle");
        setPublishErrorMessage(null);
        setPublishedCollabId(null);
    };

    const getApiMessage = (payload: unknown): string | null => {
        if (!payload) return null;
        if (typeof payload === "string") return payload;
        if (typeof payload === "object" && "message" in payload) {
            return String((payload as { message?: unknown }).message ?? "");
        }
        return null;
    };

    const campaignGuideMessage =
        "The Collaboration posted was not put live as it did not meet our guidelines. Please review the collaboration details and make necessary changes before reposting.";
    const saveCollaboration = async (myStatus: "draft" | "active") => {
        try {
            if (isSavingRef.current) {
                return;
            }
            isSavingRef.current = true;
            let shouldNavigateToCollaborations = false;
            if (!AuthApp.currentUser || !selectedBrand) {
                Console.error("User or brand not selected");
                return;
            }

            let wantedStatus = myStatus;
            if (isOnFreeTrial && wantedStatus === "active") {
                // if on free trial, show modal and fallback to draft
                notifyUprade();
                wantedStatus = "draft";
            }

            let locationAddress = collaboration?.location;

            if (
                collaboration?.location?.type === "On-Site" &&
                mapRegion.latitude &&
                mapRegion.longitude
            ) {
                locationAddress = {
                    ...collaboration.location,
                    type: collaboration.location.type || "Remote",
                    latlong: {
                        lat: mapRegion.latitude,
                        long: mapRegion.longitude,
                    },
                };
            }

            setIsProcessing(true);
            setProcessMessage("Saving collaboration attachments...");
            setProcessPercentage(40);

            // Upload assets to S3 (if you do)
            // const uploadedAssets = await uploadNewAssets(...)

            setProcessMessage("Saved collaboration attachments...");
            setProcessPercentage(70);

            setProcessMessage("Saving collaboration...");
            setProcessPercentage(100);

            // Call create or update. IMPORTANT: we assume createCollaboration returns the new doc id
            if (params.id && typeof params.id === "string") {
                // editing existing collab
                try {
                    await updateCollaboration(params.id, {
                        ...collaboration,
                        attachments: attachments,
                        brandId: selectedBrand ? selectedBrand?.id : "",
                        budget: {
                            min: collaboration.budget?.min || 0,
                            max: collaboration.budget?.max || 0,
                        },
                        managerId: AuthApp.currentUser?.uid as string,
                        location: locationAddress,
                        status: wantedStatus,
                        timeStamp: collaboration.timeStamp || Date.now(),
                    });
                    if (wantedStatus === "draft") {
                        shouldNavigateToCollaborations = true;
                    }
                } catch (error) {
                    Console.error(error);
                    Toaster.error("Failed to update collaboration");
                }
                // If user wanted publish and we set wantedStatus active then call publish
                if (wantedStatus === "active") {
                    // params.id exists so we can publish by id
                    await publish(params.id);
                }
            } else {
                // creating new collaboration
                // IMPORTANT: your createCollaboration should return the newly created doc id.
                let created:
                    | {
                        id: string | null;
                        apiResponse?: unknown;
                        apiError?: unknown;
                        status?: number;
                    }
                    | null = null;

                // Only show modal for publish (active), not for draft
                if (wantedStatus === "active") {
                    setPublishState("in-process");
                }

                try {
                    created = await createCollaboration({
                        ...collaboration,
                        attachments,
                        brandId: selectedBrand ? selectedBrand.id : "",
                        budget: {
                            min: collaboration.budget?.min || 0,
                            max: collaboration.budget?.max || 0,
                        },
                        managerId: AuthApp.currentUser?.uid as string,
                        location: locationAddress,
                        status: wantedStatus,
                        timeStamp: Date.now(),
                    });
                } catch (error) {
                    Console.error(error);
                    Toaster.error("Failed to create collaboration");
                    created = null;
                }

                if (created?.apiError) {
                    const apiMessage =
                        getApiMessage(created.apiError) ||
                        "The collaboration could not be published. Please review and try again.";

                    setPublishErrorMessage(apiMessage);
                    setPublishState("fail");
                    return;
                }

                if (!created?.id) {
                    return;
                }

                // ASSUMPTION: createCollaboration returns the created doc id
                let newId: string | null = null;
                newId = created.id;

                if (!newId) {
                    // fallback: if createCollaboration didn't return id, log and stop.
                    Console.error(
                        "createCollaboration didn't return an id — adjust createCollaboration to return the new doc id"
                    );
                } else {
                    // If wantedStatus is 'active', then call publish using shared hook
                    if (wantedStatus === "active") {
                        await publish(newId);
                        setPublishedCollabId(newId);
                        setPublishState("success");
                    } else {
                        shouldNavigateToCollaborations = true;
                    }
                }
            }
            if (shouldNavigateToCollaborations) {
                router.push("/collaborations");
            }
        } catch (error) {
            Console.error(error);
        } finally {
            setProcessPercentage(0);
            setProcessMessage("");
            setIsProcessing(false);
            isSavingRef.current = false;
        }
    };

    const submitCollaboration = async () => {
        await saveCollaboration("active");
    };

    const saveAsDraft = async () => {
        await saveCollaboration("draft");
    };

    const renderPublishModal = () => {
        return (
            <Modal
                transparent={true}
                animationType="fade"
                visible={publishState !== "idle"}
                onRequestClose={() => {
                    if (publishState === "fail") {
                        resetPublishModal();
                    }
                }}
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
                            minWidth: 300,
                            maxWidth: "80%",
                        }}
                    >
                        {/* STATE 1: IN-PROCESS */}
                        {publishState === "in-process" && (
                            <>
                                <ActivityIndicator
                                    size="large"
                                    color={Colors(theme).primary}
                                    style={{ marginBottom: 16 }}
                                />
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: "bold",
                                        marginBottom: 8,
                                        textAlign: "center",
                                    }}
                                >
                                    Campaign under review
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        textAlign: "center",
                                        color: Colors(theme).text,
                                        opacity: 0.7,
                                    }}
                                >
                                    Please wait while we process your collaboration...
                                </Text>
                            </>
                        )}

                        {/* STATE 2: FAIL */}
                        {publishState === "fail" && (
                            <>
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: "bold",
                                        marginBottom: 12,
                                        textAlign: "center",
                                    }}
                                >
                                    Collaboration Not Live
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        textAlign: "center",
                                        color: Colors(theme).text,
                                        marginBottom: 20,
                                        lineHeight: 22,
                                    }}
                                >
                                    {publishErrorMessage}
                                </Text>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        gap: 12,
                                        width: "100%",
                                    }}
                                >
                                    <Button
                                        mode="contained"
                                        style={{ flex: 1 }}
                                        onPress={() => {
                                            resetPublishModal();
                                            router.push("/collaborations");
                                        }}
                                    >
                                        Understood
                                    </Button>
                                    <Button
                                        mode="outlined"
                                        style={{ flex: 1 }}
                                        textColor={Colors(theme).primary}
                                        onPress={() => {
                                            // TODO: navigate to Campaign Guide screen when available
                                            resetPublishModal();
                                        }}
                                    >
                                        Read Campaign Guide
                                    </Button>
                                </View>
                            </>
                        )}

                        {/* STATE 3: SUCCESS */}
                        {publishState === "success" && (
                            <>
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: "bold",
                                        marginBottom: 12,
                                        textAlign: "center",
                                    }}
                                >
                                    Congratulations!
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        textAlign: "center",
                                        color: Colors(theme).text,
                                        marginBottom: 20,
                                        lineHeight: 22,
                                    }}
                                >
                                    Campaign created successfully
                                </Text>
                                <Button
                                    mode="contained"
                                    style={{ width: "100%" }}
                                    onPress={() => {
                                        resetPublishModal();
                                        if (publishedCollabId) {
                                            router.push(
                                                `/collaboration-details/${publishedCollabId}`
                                            );
                                        }
                                    }}
                                >
                                    View Campaign
                                </Button>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        );
    };

    if (isLoading) {
        return (
            <>
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <ActivityIndicator size="large" color={Colors(theme).primary} />
                </View>
                {renderPublishModal()}
            </>
        );
    }

    if (screen === 1) {
        return (
            <>
                <ScreenOne
                    attachments={attachments}
                    collaboration={collaboration}
                    setAttachments={setAttachments}
                    isEdited={isEdited}
                    isSubmitting={isProcessing}
                    setCollaboration={setCollaboration}
                    setIsEdited={setIsEdited}
                    setScreen={setScreen}
                    type={type}
                />
                {renderPublishModal()}
            </>
        );
    }

    if (screen == 2) {
        return (
            <>
                <ScreenTwo
                    collaboration={collaboration}
                    isEdited={isEdited}
                    isSubmitting={isProcessing}
                    mapRegion={{
                        state: mapRegion,
                        setState: setMapRegion,
                    }}
                    onLocationChange={onLocationChange}
                    saveAsDraft={saveAsDraft}
                    setCollaboration={setCollaboration}
                    setScreen={setScreen}
                    type={type}
                />
                {renderPublishModal()}
            </>
        );
    }

    if (screen === 3) {
        return (
            <>
                <ScreenThree
                    collaboration={collaboration}
                    isEdited={isEdited}
                    isSubmitting={isProcessing}
                    processMessage={processMessage}
                    processPercentage={processPercentage}
                    saveAsDraft={saveAsDraft}
                    setCollaboration={setCollaboration}
                    setScreen={setScreen}
                    submitCollaboration={submitCollaboration}
                    type={type}
                />
                {renderPublishModal()}
            </>
        );
    }

    if (screen === 4) {
        if (!selectedBrand) {
            Console.error("Cannot preview collaboration without selected brand");
            return null;
        }
        return (
            <>
                <PreviewCollaboration
                    collaboration={
                        {
                            ...collaboration,
                            brandName: selectedBrand?.name ?? "",
                            brandDescription: selectedBrand?.profile?.about ?? "",
                            brandCategory: selectedBrand?.profile?.industries ?? [],
                            logo: selectedBrand?.image ?? "",
                            paymentVerified: selectedBrand?.paymentMethodVerified ?? false,
                            brandWebsite: selectedBrand?.profile?.website ?? "",
                        } as any
                    }
                    isSubmitting={isProcessing}
                    onEdit={() => setScreen(3)}
                    onSaveDraft={saveAsDraft}
                    onPublish={submitCollaboration}
                />
                {renderPublishModal()}
            </>
        );
    }
};

export default CreateCollaboration;

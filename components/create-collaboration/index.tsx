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
import { ActivityIndicator } from "react-native";
import { View } from "../theme/Themed";
import PreviewCollaboration from "./PreviewCollaboration";
import PublishModal from "./PublishModal";
import ScreenThree from "./screen-three";

// Mapping functions to convert API response to app format
const mapPromotionType = (apiValue: string): PromotionType => {
    const mapping: Record<string, PromotionType> = {
        "sponsored-post": PromotionType.PAID_COLLAB,
        "paid-collab": PromotionType.PAID_COLLAB,
        "paid": PromotionType.PAID_COLLAB,
        "barter": PromotionType.BARTER_COLLAB,
        "barter-collab": PromotionType.BARTER_COLLAB,
    };
    return mapping[apiValue.toLowerCase()] || PromotionType.BARTER_COLLAB;
};

const mapPlatform = (apiValue: string): string => {
    const mapping: Record<string, string> = {
        "instagram": "Instagram",
        "facebook": "Facebook",
        "youtube": "YouTube",
        "linkedin": "LinkedIn",
    };
    return mapping[apiValue.toLowerCase()] || apiValue;
};

const mapContentFormat = (apiValue: string): string => {
    if (!apiValue || typeof apiValue !== 'string') {
        Console.log("Invalid content format value:", apiValue);
        return "";
    }

    const mapping: Record<string, string> = {
        "post": "Post",
        "reel": "Reels",
        "reels": "Reels",
        "story": "Stories",
        "stories": "Stories",
        "live": "Live",
        "online-review": "Online Reviews",
        "online-reviews": "Online Reviews",
    };

    const normalized = apiValue.trim().toLowerCase();
    const result = mapping[normalized] || apiValue;

    Console.log(`mapContentFormat: "${apiValue}" (normalized: "${normalized}") -> "${result}"`);

    return result;
};

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
        } else if (params.aiData && typeof params.aiData === "string") {
            // Handle AI-generated data
            try {
                const aiResponse = JSON.parse(decodeURIComponent(params.aiData as string));
                Console.log("Received AI Data:", aiResponse);

                // Extract the collaboration data from the response
                const aiData = aiResponse.collaboration || aiResponse;

                Console.log("Extracted collaboration data:", aiData);
                Console.log("Raw Name:", aiData.name);
                Console.log("Raw Budget:", aiData.budget);
                Console.log("Raw Platform:", aiData.platform);
                Console.log("Raw ContentFormat:", aiData.contentFormat);
                Console.log("Raw PromotionType:", aiData.promotionType);

                // Map content format with detailed logging
                const mappedContentFormat = Array.isArray(aiData.contentFormat)
                    ? aiData.contentFormat.map((format: string) => {
                        const mapped = mapContentFormat(format);
                        Console.log(`Mapping contentFormat: "${format}" -> "${mapped}"`);
                        return mapped;
                    })
                    : collaboration.contentFormat;

                Console.log("Final mapped contentFormat:", mappedContentFormat);

                // Map AI data to collaboration object with proper type conversion and value mapping
                const updatedCollaboration = {
                    ...collaboration,
                    name: aiData.name ? String(aiData.name) : collaboration.name,
                    description: aiData.description ? String(aiData.description) : collaboration.description,
                    promotionType: aiData.promotionType
                        ? mapPromotionType(aiData.promotionType)
                        : collaboration.promotionType,
                    budget: aiData.budget ? {
                        min: Number(aiData.budget.min) || 0,
                        max: Number(aiData.budget.max) || 0,
                    } : collaboration.budget,
                    numberOfInfluencersNeeded: aiData.numberOfInfluencersNeeded
                        ? Number(aiData.numberOfInfluencersNeeded)
                        : collaboration.numberOfInfluencersNeeded,
                    platform: Array.isArray(aiData.platform)
                        ? aiData.platform.map(mapPlatform)
                        : collaboration.platform,
                    contentFormat: mappedContentFormat,
                    preferredContentLanguage: Array.isArray(aiData.preferredContentLanguage)
                        ? aiData.preferredContentLanguage
                        : collaboration.preferredContentLanguage,
                    location: aiData.location || collaboration.location,
                    questionsToInfluencers: Array.isArray(aiData.questionsToInfluencers)
                        ? aiData.questionsToInfluencers
                        : collaboration.questionsToInfluencers,
                    preferences: aiData.preferences || collaboration.preferences,
                };

                Console.log("Updated collaboration object:", updatedCollaboration);
                Console.log("Mapped promotionType:", updatedCollaboration.promotionType);
                Console.log("Mapped platforms:", updatedCollaboration.platform);
                Console.log("Mapped contentFormats:", updatedCollaboration.contentFormat);

                setCollaboration(updatedCollaboration);

                Toaster.success("Campaign generated successfully! Review and customize as needed.");
            } catch (error) {
                Console.error("Failed to parse AI data:");
                Console.error(error);
                Toaster.error("Failed to load AI-generated campaign data.");
            }
        }
    }, []);

    // Debug: Log collaboration state changes
    useEffect(() => {
        Console.log("=== Collaboration State Changed ===");
        Console.log("Name:", collaboration.name);
        Console.log("ContentFormat:", collaboration.contentFormat);
        Console.log("Platform:", collaboration.platform);
        Console.log("PromotionType:", collaboration.promotionType);
        Console.log("Budget:", collaboration.budget);
        Console.log("===================================");
    }, [collaboration]);

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
                <PublishModal
                    state={publishState}
                    errorMessage={publishErrorMessage}
                    publishedCollabId={publishedCollabId}
                    onReset={resetPublishModal}
                />
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
                <PublishModal
                    state={publishState}
                    errorMessage={publishErrorMessage}
                    publishedCollabId={publishedCollabId}
                    onReset={resetPublishModal}
                />
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
                <PublishModal
                    state={publishState}
                    errorMessage={publishErrorMessage}
                    publishedCollabId={publishedCollabId}
                    onReset={resetPublishModal}
                />
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
                <PublishModal
                    state={publishState}
                    errorMessage={publishErrorMessage}
                    publishedCollabId={publishedCollabId}
                    onReset={resetPublishModal}
                />
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
                <PublishModal
                    state={publishState}
                    errorMessage={publishErrorMessage}
                    publishedCollabId={publishedCollabId}
                    onReset={resetPublishModal}
                />
            </>
        );
    }
};

export default CreateCollaboration;

import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import ScreenOne from "@/components/create-collaboration/screen-one";
import ScreenTwo from "@/components/create-collaboration/screen-two";
import { useCollaborationContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useProcess } from "@/hooks";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { ActivityIndicator } from "react-native";
import { View } from "../theme/Themed";
import PreviewCollaboration from "./PreviewCollaboration";
import ScreenThree from "./screen-three";
import { AICampaignDraft, AIGeneratedCampaignData } from "./types";

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

interface CreateCollaborationProps {
    headerRight?: React.ReactNode;
    aiData?: AIGeneratedCampaignData | null;
}

const CreateCollaboration: React.FC<CreateCollaborationProps> = ({ headerRight, aiData }) => {
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
    // const { publish } = usePublishCollaboration();
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
            return;
        }

        if (aiData) {
            // Handle AI-generated data
            try {
                Console.log("Received AI Data:", aiData);

                // Extract the collaboration data from the response
                const collaborationData: AICampaignDraft =
                    "collaboration" in aiData
                        ? aiData.collaboration ?? {}
                        : (aiData as AICampaignDraft);

                Console.log("Extracted collaboration data:", collaborationData);
                Console.log("Raw Name:", collaborationData.name);
                Console.log("Raw Budget:", collaborationData.budget);
                Console.log("Raw Platform:", collaborationData.platform);
                Console.log("Raw ContentFormat:", collaborationData.contentFormat);
                Console.log("Raw PromotionType:", collaborationData.promotionType);

                // Map content format with detailed logging
                const mappedContentFormat = Array.isArray(collaborationData.contentFormat)
                    ? collaborationData.contentFormat.map((format: string) => {
                        const mapped = mapContentFormat(format);
                        Console.log(`Mapping contentFormat: "${format}" -> "${mapped}"`);
                        return mapped;
                    })
                    : [];

                Console.log("Final mapped contentFormat:", mappedContentFormat);

                const mappedLocation = collaborationData.location?.type
                    ? {
                        type: collaborationData.location.type,
                        name: collaborationData.location.name || "",
                        latlong: collaborationData.location.latlong
                            ? {
                                lat: Number(collaborationData.location.latlong.lat) || 0,
                                long: Number(collaborationData.location.latlong.long) || 0,
                            }
                            : { lat: 0, long: 0 },
                    }
                    : {
                        type: "Remote",
                        name: "",
                        latlong: { lat: 0, long: 0 },
                    };
                const mappedAttachments: Attachment[] = Array.isArray(collaborationData.relevantImages)
                    ? collaborationData.relevantImages
                        .filter((url): url is string => typeof url === "string" && !!url.trim())
                        .map((url) => ({
                            type: "image",
                            imageUrl: url.trim(),
                        }))
                    : [];

                const mappedExternalLinks = Array.isArray(collaborationData.externalLinks)
                    ? collaborationData.externalLinks
                        .filter(
                            (link): link is { name: string; link: string } =>
                                !!link &&
                                typeof link.name === "string" &&
                                !!link.name.trim() &&
                                typeof link.link === "string" &&
                                !!link.link.trim()
                        )
                        .map((link) => ({
                            name: link.name.trim(),
                            link: link.link.trim(),
                        }))
                    : [];

                const updatedCollaboration: Partial<ICollaboration> = {
                    name: collaborationData.name ? String(collaborationData.name) : "",
                    description: collaborationData.description ? String(collaborationData.description) : "",
                    promotionType: collaborationData.promotionType
                        ? mapPromotionType(collaborationData.promotionType)
                        : PromotionType.BARTER_COLLAB,
                    budget: collaborationData.budget ? {
                        min: Number(collaborationData.budget.min) || 0,
                        max: Number(collaborationData.budget.max) || 0,
                    } : { min: 0, max: 0 },
                    numberOfInfluencersNeeded: collaborationData.numberOfInfluencersNeeded
                        ? Number(collaborationData.numberOfInfluencersNeeded)
                        : 1,
                    platform: Array.isArray(collaborationData.platform)
                        ? collaborationData.platform.map(mapPlatform)
                        : [],
                    contentFormat: mappedContentFormat,
                    preferredContentLanguage: Array.isArray(collaborationData.preferredContentLanguage)
                        ? collaborationData.preferredContentLanguage
                        : ["English", "Hindi"],
                    location: mappedLocation,
                    questionsToInfluencers: Array.isArray(collaborationData.questionsToInfluencers)
                        ? collaborationData.questionsToInfluencers
                        : [],
                    preferences: collaborationData.preferences || {},
                    attachments: mappedAttachments,
                    brandId: "",
                    managerId: "",
                    externalLinks: mappedExternalLinks,
                    status: "",
                    timeStamp: 0,
                    viewsLastHour: 0,
                    lastReviewedTimeStamp: 0,
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
    }, [aiData]);

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
    const saveCollaboration = async (myStatus: "draft" | "active") => {
        try {
            if (isSavingRef.current) {
                return;
            }
            isSavingRef.current = true;
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
                    router.push("/collaborations");
                } catch (error) {
                    Console.error(error);
                    Toaster.error("Failed to update collaboration");
                }
            } else {
                try {
                    await createCollaboration({
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
                    router.push("/collaborations");
                } catch (error) {
                    Console.error(error);
                    Toaster.error("Failed to create collaboration");
                }
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
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color={Colors(theme).primary} />
            </View>
        );
    }

    if (screen === 1) {
        return (
            <ScreenOne
                headerRight={headerRight}
                attachments={attachments}
                collaboration={collaboration}
                setAttachments={setAttachments}
                // handleAssetsUpdateNative={handleAssetsUpdateNative}
                // handleAssetsUpdateWeb={handleAssetsUpdateWeb}
                isEdited={isEdited}
                isSubmitting={isProcessing}
                setCollaboration={setCollaboration}
                setIsEdited={setIsEdited}
                setScreen={setScreen}
                type={type}
            />
        );
    }

    if (screen == 2) {
        return (
            <ScreenTwo
                headerRight={headerRight}
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
        );
    }

    if (screen === 3) {
        return (
            <ScreenThree
                headerRight={headerRight}
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
        );
    }

    if (screen === 4) {
        if (!selectedBrand) {
            Console.error("Cannot preview collaboration without selected brand");
            // Optionally show error UI or navigate back
            return null;
        }
        return (
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
        );
    }
};

export default CreateCollaboration;

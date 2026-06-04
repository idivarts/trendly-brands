import { useTheme, type Theme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { Portal } from "react-native-paper";

import {
    CreateNewBrandForm,
    CreateNewBrandHeader,
} from "@/components/create-new-brand";
import { useAuthContext, useAWSContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import { IBrands } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";

const OnboardingScreen = () => {
    const router = useMyNavigation();
    const [brandData, setBrandData] = useState<Partial<IBrands>>({
        name: "",
        image: "",
        paymentMethodVerified: false,
        profile: {
            about: "",
            banner: "",
            industries: [],
            website: "",
            phone: "",
        },
        preferences: {
            promotionType: [],
            influencerCategories: [],
        },
        creationTime: Date.now(),
        isBillingDisabled: false,
    });
    const [brandWebImage, setBrandWebImage] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const theme = useTheme();
    const styles = useMemo(() => useBrandStyles(theme), [theme]);
    const { firstBrand } = useLocalSearchParams<{ firstBrand?: string }>();
    const { uploadFileUri, uploadFile } = useAWSContext();
    const { setSelectedBrand, createBrand, updateBrand, finalizeBrand, selectedBrand } =
        useBrandContext();
    const { manager: user, setSession } = useAuthContext();

    // Draft mode: when arriving from the AI onboarding chat, operate on the same
    // draft brand (update + finalize) instead of creating a new one.
    const draftId =
        selectedBrand?.onboardingComplete === false ? selectedBrand.id : undefined;
    const seededDraftRef = useRef<string | null>(null);

    // Seed the form from the draft once it's available so the user continues
    // from whatever the chat already captured.
    useEffect(() => {
        if (!draftId || seededDraftRef.current === draftId) return;
        seededDraftRef.current = draftId;
        setBrandData((prev) => ({
            ...prev,
            name: selectedBrand?.name || prev.name,
            image: selectedBrand?.image || prev.image,
            age: selectedBrand?.age || prev.age,
            profile: {
                ...prev.profile,
                ...(selectedBrand?.profile || {}),
            },
            preferences: {
                ...prev.preferences,
                ...(selectedBrand?.preferences || {}),
            },
            survey: selectedBrand?.survey || prev.survey,
        }));
    }, [draftId, selectedBrand]);

    const handleCreateBrand = async () => {
        setIsSubmitting(true);
        if (!user) {
            Toaster.error("User not found");
            setIsSubmitting(false);
            return;
        }

        if (!brandData.name) {
            Toaster.error("Brand name is required");
            setIsSubmitting(false);
            return;
        }

        if (!brandData.profile?.phone) {
            Toaster.error("Phone number is required");
            setIsSubmitting(false);
            return;
        }
        const phoneRegex =
            /^\+?[1-9]\d{0,2}[\s-]?(\(?\d{1,4}\)?[\s-]?)?\d{1,4}([\s-]?\d{1,4}){1,3}$/;
        if (!phoneRegex.test(brandData.profile.phone)) {
            Toaster.error("Invalid phone number format");
            setIsSubmitting(false);
            return;
        }

        if (!brandData.age) {
            Toaster.error("Please specify your brand age");
            setIsSubmitting(false);
            return;
        }

        if (brandData.profile?.website) {
            const websiteRegex =
                /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
            if (!websiteRegex.test(brandData.profile.website)) {
                Toaster.error("Invalid website format");
                setIsSubmitting(false);
                return;
            }
        }

        let imageUrl = "";
        if (Platform.OS === "web" && brandWebImage) {
            const uploadedImage = await uploadFile(brandWebImage as File);
            imageUrl = uploadedImage?.imageUrl || "";
        } else if (brandData.image) {
            const uploadedImage = await uploadFileUri({
                id: brandData.image,
                localUri: brandData.image,
                uri: brandData.image,
                type: "image",
            });
            imageUrl = uploadedImage?.imageUrl || "";
        }

        const brand: IBrands = {
            ...brandData,
            image: imageUrl,
            creationTime: brandData.creationTime || Date.now(),
        } as IBrands;

        // Draft mode (came from AI onboarding): update the existing draft and
        // finalize it, rather than creating a duplicate brand.
        if (draftId) {
            try {
                await updateBrand(draftId, brand);
                await finalizeBrand(draftId);
                setSelectedBrand(
                    { ...brand, id: draftId, onboardingComplete: true } as Brand,
                    false
                );
                setSession(AuthApp.currentUser?.uid || "");
                router.resetAndNavigate("/discover");
                Toaster.success(
                    firstBrand === "true"
                        ? "Signed In Successfully!"
                        : "Brand Created Successfully!"
                );
            } catch {
                Toaster.error("Error creating brand");
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        createBrand(brand)
            .then((brandDoc) => {
                if (!brandDoc) {
                    Toaster.error(
                        "Something went wrong!",
                        "Couldn't create your brand"
                    );
                    return;
                }
                setSelectedBrand({
                    ...brand,
                    id: brandDoc.id,
                } as Brand);
                setSession(AuthApp.currentUser?.uid || "");
                router.resetAndNavigate("/content-strategies");
                Toaster.success(
                    firstBrand === "true"
                        ? "Signed In Successfully!"
                        : "Brand Created Successfully!"
                );
            })
            .catch(() => {
                Toaster.error("Error creating brand");
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const headerTitle =
        firstBrand === "true" ? "Onboarding" : "Create New Brand";

    return (
        <AppLayout withWebPadding={false}>
            <CreateNewBrandHeader
                title={headerTitle}
                showBackButton={firstBrand !== "true"}
            />
            <View style={styles.container}>
                <CreateNewBrandForm
                    brandData={brandData}
                    setBrandData={setBrandData}
                    setBrandWebImage={setBrandWebImage}
                    onSubmit={handleCreateBrand}
                    isSubmitting={isSubmitting}
                    submitLabel="Create Brand"
                />
            </View>
            {isSubmitting && (
                <Portal>
                    <View style={styles.overlay}>
                        <ActivityIndicator color={Colors(theme).primary} />
                    </View>
                </Portal>
            )}
        </AppLayout>
    );
};

function useBrandStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colors(theme).background,
        },
        overlay: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: Colors(theme).backdrop,
        },
    });
}

export default OnboardingScreen;

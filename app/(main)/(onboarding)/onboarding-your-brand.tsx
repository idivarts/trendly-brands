import { useTheme, type Theme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { Portal } from "react-native-paper";

import {
    CreateNewBrandForm,
    CreateNewBrandHeader,
} from "@/components/create-new-brand";
import Colors from "@/shared-uis/constants/Colors";
import { useAuthContext, useAWSContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import { IBrands } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
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
    const { setSelectedBrand, createBrand } = useBrandContext();
    const { manager: user, setSession } = useAuthContext();

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
            creationTime: Date.now(),
        } as IBrands;
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
                router.resetAndNavigate("/discover");
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

import { useTheme } from "@react-navigation/native";
import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { Portal } from "react-native-paper";
import { Text } from "react-native-paper";

import BrandProfile from "@/components/brand-profile";
import Button from "@/components/ui/button";
import ScreenHeader from "@/components/ui/screen-header";
import Colors from "@/shared-uis/constants/Colors";
import { useAuthContext, useAWSContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { IBrands } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import fnStyles from "@/styles/onboarding/brand.styles";
import { Brand } from "@/types/Brand";

const ONBOARDING_STEPS = [
    { step: 1, title: "Brand Details", subtitle: "Logo and core details" },
    { step: 2, title: "Brand age", subtitle: "How established is your brand" },
    { step: 3, title: "Brand Industry", subtitle: "Relevant creator matching" },
];

const OnboardingScreen = () => {
    const navigation = useNavigation();
    const { xl } = useBreakpoints();
    const isWebOnboarding = Platform.OS === "web" && xl;
    const [currentStep, setCurrentStep] = useState(1);
    const [brandData, setBrandData] = useState<Partial<IBrands>>({
        name: "",
        image: "",
        paymentMethodVerified: false,
        profile: {
            about: "",
            banner: "",
            industries: [],
            website: "",
        },
        preferences: {
            promotionType: [],
            influencerCategories: [],
        },
        creationTime: Date.now(),
        isBillingDisabled: false
    });
    const [role, setRole] = useState("");
    const [brandWebImage, setBrandWebImage] = useState<File | null>(null);
    const router = useMyNavigation()

    const [isSubmitting, setIsSubmitting] = useState(false);
    const theme = useTheme();
    const styles = fnStyles(theme);
    const { firstBrand } = useLocalSearchParams();
    const {
        uploadFileUri,
        uploadFile,
    } = useAWSContext();
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
        } else {
            // use regex to validate phone number brandData.profile?.phone
            const phoneRegex = /^\+?[1-9]\d{0,2}[\s-]?(\(?\d{1,4}\)?[\s-]?)?\d{1,4}([\s-]?\d{1,4}){1,3}$/; // Allows spaces, brackets, and dashes
            if (!phoneRegex.test(brandData.profile?.phone)) {
                Toaster.error("Invalid phone number format");
                setIsSubmitting(false);
                return;
            }
        }
        if (!brandData.age) {
            Toaster.error("Please specify your brand age");
            setIsSubmitting(false);
            return;
        }
        if (brandData.profile.website) {
            // Standard website validation
            const websiteRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
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

        if (user) {
            // const brandRef = collection(FirestoreDB, "brands");

            let brand: IBrands = {
                ...brandData,
                image: imageUrl,
                creationTime: Date.now(),
            } as IBrands;
            createBrand(brand).then((brandDoc) => {
                if (!brandDoc) {
                    Toaster.error("Something went wrong!", "Couldn't create your brand")
                    return
                }
                setSelectedBrand({
                    ...brand,
                    id: brandDoc.id
                } as Brand);
                setSession(AuthApp.currentUser?.uid || "");
                router.resetAndNavigate("/discover");
                Toaster.success(firstBrand === "true" ? "Signed In Successfully!" : "Brand Created Successfully!");
            }).catch((error) => {
                Toaster.error("Error creating brand");
            }).finally(() => {
                setIsSubmitting(false);
            });
        }
    };

    const handleBack = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else router.resetAndNavigate("/discover");
    };

    return (
        <AppLayout withWebPadding={!isWebOnboarding}>
            {isWebOnboarding ? (
                <View style={[styles.container, webStyles.container]}>
                    <View style={[webStyles.row, webStyles.rowPadding]}>
                        <View style={webStyles.main}>
                            <View style={webStyles.headerRow}>
                                <Pressable onPress={handleBack} style={webStyles.backButton}>
                                    <FontAwesomeIcon
                                        icon={faArrowLeft}
                                        size={20}
                                        color={Colors(theme).text}
                                    />
                                </Pressable>
                                <Text variant="headlineMedium" style={[webStyles.title, { color: Colors(theme).text }]}>
                                    {firstBrand === "true" ? "Onboarding" : "Create New Brand"}
                                </Text>
                            </View>
                            <ScrollView
                                style={webStyles.scroll}
                                contentContainerStyle={webStyles.scrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                <BrandProfile
                                    webOnboarding
                                    onStepChange={setCurrentStep}
                                    action={
                                        <Button
                                            loading={isSubmitting}
                                            mode="contained"
                                            onPress={handleCreateBrand}
                                        >
                                            Create Brand
                                        </Button>
                                    }
                                    brandData={brandData}
                                    setBrandData={setBrandData}
                                    setBrandWebImage={setBrandWebImage}
                                    type="create"
                                />
                            </ScrollView>
                        </View>
                        <View style={[webStyles.sidebar, { borderLeftColor: Colors(theme).border }]}>
                            <Text variant="labelLarge" style={[webStyles.sidebarTitle, { color: Colors(theme).secondary }]}>
                                Steps
                            </Text>
                            {ONBOARDING_STEPS.map(({ step, title, subtitle }) => {
                                const isActive = currentStep === step;
                                const isDone = currentStep > step;
                                return (
                                    <View key={step} style={webStyles.stepItem}>
                                        <View
                                            style={[
                                                webStyles.stepCircle,
                                                isActive && { backgroundColor: Colors(theme).primary },
                                                isDone && { backgroundColor: Colors(theme).primary },
                                            ]}
                                        >
                                            {isDone ? (
                                                <FontAwesomeIcon icon={faCheck} size={12} color="#fff" />
                                            ) : (
                                                <Text variant="labelMedium" style={[webStyles.stepNum, { color: isActive ? "#fff" : Colors(theme).secondary }]}>
                                                    {step}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={webStyles.stepTextWrap}>
                                            <Text variant="bodyMedium" style={[webStyles.stepTitle, { color: Colors(theme).text }]}>
                                                {title}
                                            </Text>
                                            <Text variant="bodySmall" style={{ color: Colors(theme).secondary }}>
                                                {subtitle}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.container}>
                    <ScreenHeader
                        title={firstBrand === "true" ? "Onboarding" : "Create New Brand"}
                        hideAction={firstBrand === "true"}
                    />
                    <BrandProfile
                        action={
                            <Button
                                loading={isSubmitting}
                                mode="contained"
                                onPress={handleCreateBrand}
                            >
                                Create Brand
                            </Button>
                        }
                        brandData={brandData}
                        setBrandData={setBrandData}
                        setBrandWebImage={setBrandWebImage}
                        type="create"
                    />
                </View>
            )}
            {isSubmitting && (
                <Portal>
                    <View
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: Colors(theme).backdrop,
                        }}
                    >
                        <ActivityIndicator color={Colors(theme).primary} />
                    </View>
                </Portal>
            )}
        </AppLayout>
    );
};

const webStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    row: {
        flex: 1,
        flexDirection: "row",
        maxWidth: Platform.OS == "web" ? 1400 : 1200,
        alignSelf: "center",
        width: "100%",
    },
    rowPadding: {
        // paddingHorizontal: 40,
    },
    main: {
        flex: 1,
        minWidth: 0,
        paddingRight: 48,
        paddingTop: 8,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        gap: 12,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    title: {
        fontWeight: "700",
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 48,
    },
    sidebar: {
        width: 280,
        paddingLeft: 32,
        paddingTop: 24,
        borderLeftWidth: 1,
    },
    sidebarTitle: {
        marginBottom: 20,
        fontWeight: "600",
    },
    stepItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        gap: 12,
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(128,128,128,0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    stepNum: {
        fontWeight: "700",
    },
    stepTextWrap: {
        flex: 1,
    },
    stepTitle: {
        fontWeight: "600",
    },
});

export default OnboardingScreen;

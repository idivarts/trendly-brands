import { useTheme } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Portal } from "react-native-paper";

import BrandProfile from "@/components/brand-profile";
import Button from "@/components/ui/button";
import ScreenHeader from "@/components/ui/screen-header";
import Colors from "@/constants/Colors";
import { useAuthContext, useAWSContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import fnStyles from "@/styles/onboarding/brand.styles";
import { Brand } from "@/types/Brand";

const OnboardingScreen = () => {
  const [brandData, setBrandData] = useState<Partial<Brand>>({
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
  });
  const [role, setRole] = useState("");
  const [brandWebImage, setBrandWebImage] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const styles = fnStyles(theme);
  const { firstBrand } = useLocalSearchParams();
  const {
    uploadFileUri,
    uploadFile,
  } = useAWSContext();
  const { setSelectedBrand } = useBrandContext();
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
      const brandRef = collection(FirestoreDB, "brands");

      let brand = {
        ...brandData,
        image: imageUrl,
      };

      const docRef = await addDoc(brandRef, brand);

      const managerRef = doc(
        FirestoreDB,
        "brands",
        docRef.id,
        "members",
        user.id
      );

      await setDoc(managerRef, {
        managerId: user.id,
        role: "Manager",
      })
        .then(() => {
          // router.replace({
          //   pathname: "/onboarding-get-started",
          //   params: {
          //     brandId: docRef.id,
          //     firstBrand: firstBrand === "true" ? "true" : "false",
          //   },
          // });
          setSelectedBrand(brandData as Brand);
          setSession(AuthApp.currentUser?.uid || "");
          router.replace("/explore-influencers");
          Toaster.success(firstBrand === "true" ? "Signed In Successfully!" : "Brand Created Successfully!");
        })
        .catch((error) => {
          Toaster.error("Error creating brand");
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  return (
    <AppLayout withWebPadding={true}>
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

export default OnboardingScreen;

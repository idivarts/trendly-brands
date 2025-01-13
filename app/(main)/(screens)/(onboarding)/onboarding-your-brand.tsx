import React, { useState } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";

import { Brand } from "@/types/Brand";
import { FirestoreDB } from "@/utils/firestore";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useAuthContext, useAWSContext } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import BrandProfile from "@/components/brand-profile";
import fnStyles from "@/styles/onboarding/brand.styles";
import ScreenHeader from "@/components/ui/screen-header";
import Toaster from "@/shared-uis/components/toaster/Toaster";

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const styles = fnStyles(theme);
  const { firstBrand } = useLocalSearchParams();
  const { uploadFileUri } = useAWSContext();
  const { setSelectedBrand } = useBrandContext();
  const { manager: user } = useAuthContext();


  const handleCreateBrand = async () => {
    setIsSubmitting(true);
    if (!user) {
      Toaster.error("User not found");
      setIsSubmitting(false);
      return;
    }

    if (!brandData.name) {

      Toaster.error('Brand name is required');
      setIsSubmitting(false);

      return;
    }

    let imageUrl = "";
    if (brandData.image) {
      const uploadedImage = await uploadFileUri({
        id: brandData.image,
        localUri: brandData.image,
        uri: brandData.image,
        type: "image",
      });
      imageUrl = uploadedImage.imageUrl;
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
          router.replace({
            pathname: "/onboarding-get-started",
            params: {
              brandId: docRef.id,
              firstBrand: firstBrand === "true" ? "true" : "false",
            },
          });
          setSelectedBrand(brandData as Brand);
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
    <AppLayout>
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
          type="create"
        />
      </View>
    </AppLayout>
  );
};

export default OnboardingScreen;

import React, { useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable } from "react-native";
import Toast from "react-native-toast-message";

import BrandProfile from "@/components/brand-profile";
import { Text } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import Colors from "@/constants/Colors";
import { useAuthContext, useAWSContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";

const BrandProfileScreen = () => {
  const [isSaving, setIsSaving] = useState(false);

  const {
    updateBrand,
    selectedBrand,
    setSelectedBrand,
  } = useBrandContext();
  const {
    uploadFileUri,
    uploadFile,
  } = useAWSContext();

  const theme = useTheme();

  const {
    manager: user,
  } = useAuthContext();

  if (!user || !selectedBrand) {
    Toaster.error('Selected brand not found');
    return null;
  }

  const [brandData, setBrandData] = useState<Partial<Brand>>(selectedBrand);
  const brandImage = useRef(selectedBrand?.image || "");
  const [brandWebImage, setBrandWebImage] = useState<File | null>(null);

  const handleSave = async () => {
    if (!brandData.name) {
      Toaster.error('Brand name is required');
    }

    setIsSaving(true);
    let imageUrl = "";
    if (Platform.OS === "web" && brandWebImage) {
      const uploadedImage = await uploadFile(brandWebImage as File);
      imageUrl = uploadedImage?.imageUrl || "";
    } else if (brandData.image && brandData.image !== brandImage.current) {
      const uploadedImage = await uploadFileUri({
        id: brandData.image,
        localUri: brandData.image,
        uri: brandData.image,
        type: "image",
      });
      imageUrl = uploadedImage?.imageUrl || "";
    }

    await updateBrand(
      selectedBrand.id,
      Object.fromEntries(Object.entries({
        ...brandData,
        image: imageUrl ? imageUrl : brandImage.current,
      }).filter(([key]) => key !== 'id'))
    ).then(() => {
      Toaster.success('Saved changes successfully');
      setSelectedBrand(brandData as Brand);
    }).catch((error) => {
      Toaster.error('Error saving preferences');
    }).finally(() => {
      setIsSaving(false);
    });
  }

  return (
    <AppLayout>
      <ScreenHeader
        title="Brand Profile"
        rightAction
        rightActionButton={
          <Pressable
            onPress={handleSave}
            style={{
              padding: 10,
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              flexDirection: "row",
            }}
          >
            {
              isSaving && (
                <ActivityIndicator
                  size="small"
                  color={Colors(theme).primary}
                />
              )
            }
            <Text>Save</Text>
          </Pressable>
        }
      />
      <BrandProfile
        brandData={brandData}
        setBrandData={setBrandData}
        setBrandWebImage={setBrandWebImage}
      />
      <Toast />
    </AppLayout>
  );
};

export default BrandProfileScreen;

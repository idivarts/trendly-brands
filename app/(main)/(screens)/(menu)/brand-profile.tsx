import React, { useRef, useState } from "react";
import { Pressable } from "react-native";
import Toast from "react-native-toast-message";

import { Brand } from "@/types/Brand";
import { Text } from "@/components/theme/Themed";
import { useAuthContext, useFirebaseStorageContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import BrandProfile from "@/components/brand-profile";
import ScreenHeader from "@/components/ui/screen-header";
import Toaster from "@/shared-uis/components/toaster/Toaster";

const BrandProfileScreen = () => {
  const {
    updateBrand,
    selectedBrand,
    setSelectedBrand,
  } = useBrandContext();
  const {
    uploadImageBytes,
  } = useFirebaseStorageContext();

  const {
    manager: user,
  } = useAuthContext();

  if (!user || !selectedBrand) {
    Toaster.error('Selected brand not found');
    return null;
  }

  const [brandData, setBrandData] = useState<Partial<Brand>>(selectedBrand);
  const brandImage = useRef(selectedBrand?.image || "");

  const handleSave = async () => {
    let imageUrl = "";
    if (brandData.image !== brandImage.current) {
      const blob = await fetch(
        brandData.image as string,
      ).then((res) => res.blob());
      imageUrl = await uploadImageBytes(blob, `brands/${brandData.name}-${Date.now()}`);
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
            style={{ padding: 10 }}
          >
            <Text>Save</Text>
          </Pressable>
        }
      />
      <BrandProfile
        brandData={brandData}
        setBrandData={setBrandData}
      />
      <Toast />
    </AppLayout>
  );
};

export default BrandProfileScreen;

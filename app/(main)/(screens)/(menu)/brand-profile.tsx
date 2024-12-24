import AppLayout from "@/layouts/app-layout";
import React, { useState } from "react";
import BrandProfile from "@/components/brand-profile";
import ScreenHeader from "@/components/ui/screen-header";
import { Pressable } from "react-native";
import { Text } from "@/components/theme/Themed";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Toast from "react-native-toast-message";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Manager } from "@/types/Manager";

const BrandProfileScreen = () => {
  const {
    // updateBrandProfile,
  } = useBrandContext();

  const {
    manager: user,
  } = useAuthContext();

  if (!user) {
    return null;
  }

  const [updatedBrandProfile, setUpdatedBrandProfile] = useState(user);

  const handleOnSave = (user: Manager) => {
    setUpdatedBrandProfile(user);
  }

  const handleSave = async () => {
    console.log('updatedBrandProfile', updatedBrandProfile);
    // await updateBrandProfile(updatedBrandProfile.id, updatedBrandProfile).then(() => {
    //   Toaster.success('Saved changes successfully');
    // }).catch((error) => {
    //   Toaster.error('Error saving preferences');
    // });
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
      <BrandProfile />
      <Toast />
    </AppLayout>
  );
};

export default BrandProfileScreen;

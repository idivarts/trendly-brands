import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { ActivityIndicator, Platform } from "react-native";

import ExploreInfluencerShimmer from "@/components/shimmers/explore-influencer-shimmer";
import { View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";

interface BrandProtectedScreenProps extends PropsWithChildren { }

const BrandProtectedScreen: React.FC<BrandProtectedScreenProps> = ({
  children,
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    manager,
  } = useAuthContext();

  const fetchBrands = async (
    managerId: string
  ): Promise<void> => {
    const brandsCollection = collection(FirestoreDB, "brands");

    const brandsSnapshot = await getDocs(brandsCollection);

    for (const brandDoc of brandsSnapshot.docs) {
      const brandId = brandDoc.id;

      const membersCollection = collection(FirestoreDB, `brands/${brandId}/members`);
      const membersQuery = query(membersCollection, where("managerId", "==", managerId));
      const membersSnapshot = await getDocs(membersQuery);

      if (!membersSnapshot.empty) {
        setLoading(false);
        return;
      }
    }

    // If the manager has no brands, redirect to onboarding
    router.replace({
      pathname: "/onboarding-your-brand",
      params: {
        firstBrand: "true",
      },
    });
    setLoading(false);
  };

  useEffect(() => {
    if (manager && manager.id) {
      setLoading(true);
      fetchBrands(manager.id);
    }
  }, [manager]);

  if (loading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

const LoadingScreen: React.FC = () => {
  const theme = useTheme();

  if (Platform.OS === "web") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={Colors(theme).primary}
        />
      </View>
    );
  }

  return (
    <ExploreInfluencerShimmer />
  );
}

export default BrandProtectedScreen;

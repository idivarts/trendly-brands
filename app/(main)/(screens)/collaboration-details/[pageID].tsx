import CollaborationPage from "@/components/collaboration/CollaborationDetails";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";
import { FirestoreDB } from "@/utils/firestore";
import AppLayout from "@/layouts/app-layout";
import { ActivityIndicator } from "react-native-paper";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";

interface Collaboration extends ICollaboration {
  brandName: string;
  paymentVerified: boolean;
  brandDescription: string;
}

const CollaborationDetailsScreen = () => {
  const pageID = useLocalSearchParams().pageID;
  const [collaboration, setCollaboration] = useState<Collaboration | undefined>(
    undefined
  ); // Explicit type
  const [loading, setLoading] = useState(true);

  const fetchCollaboration = async () => {
    if (!pageID) return;
    try {
      const collabRef = doc(FirestoreDB, "collaborations", pageID as string);
      const snapshot = await getDoc(collabRef);
      const data = snapshot.data() as ICollaboration;
      if (!data) return;

      const brandRef = doc(FirestoreDB, "brands", data.brandId);
      const brandSnapshot = await getDoc(brandRef);
      const brandData = brandSnapshot.data();

      setCollaboration({
        ...data,
        brandName: brandData?.name || "Unknown Brand",
        paymentVerified: brandData?.paymentMethodVerified || false,
        brandDescription: brandData?.description || "",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaboration();
  }, [pageID]);

  if (loading)
    return (
      <AppLayout>
        <ActivityIndicator />
      </AppLayout>
    );

  if (!collaboration) return null;

  return (
    <CollaborationPage collaborationDetail={collaboration} pageID={pageID} />
  );
};

export default CollaborationDetailsScreen;

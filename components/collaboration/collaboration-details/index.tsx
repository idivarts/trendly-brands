import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { ActivityIndicator } from "react-native-paper";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import CollaborationDetailsContent from "./CollaborationDetailsContent";
import { View } from "@/components/theme/Themed";

interface Collaboration extends ICollaboration {
  brandName: string;
  paymentVerified: boolean;
  brandDescription: string;
}

interface CollaborationDetailsProps {
  pageID: string;
}

const CollaborationDetails: React.FC<CollaborationDetailsProps> = ({
  pageID
}) => {
  const [collaboration, setCollaboration] = useState<Collaboration | undefined>(
    undefined
  ); // Explicit type
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );

  if (!collaboration) return null;

  return (
    <>
      {
        activeTab === "Overview" && (
          <CollaborationDetailsContent
            collaborationDetail={collaboration}
            pageID={pageID}
          />
        )
      }
    </>
  );
};

export default CollaborationDetails;

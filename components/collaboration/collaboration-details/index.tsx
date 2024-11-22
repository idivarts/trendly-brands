import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { ActivityIndicator } from "react-native-paper";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { View } from "@/components/theme/Themed";
import TopTabNavigation from "@/components/ui/top-tab-navigation";
import ApplicationsTabContent from "./ApplicationsTabContent";
import InvitationsTabContent from "./InvitationsTabContent";
import OverviewTabContent from "./OverviewTabContent";
import SettingsTabContent from "./SettingsTabContent";
import CollaborationHeader from "../CollaborationHeader";

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
  );
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

  const tabs = [
    {
      id: "Overview",
      title: "Overview",
      component: (
        <OverviewTabContent
          collaboration={collaboration as Collaboration}
          // logo={collaboration?.logo}
          logo={""}
        />
      ),
    },
    {
      id: "Applications",
      title: "Applications",
      component: (
        <ApplicationsTabContent
          pageID={pageID}
          collaboration={{
            id: pageID,
            name: collaboration?.name,
          }}
        />
      ),
    },
    {
      id: "Invitations",
      title: "Invitations",
      component: (
        <InvitationsTabContent
          pageID={pageID}
        />
      ),
    },
    {
      id: "Settings",
      title: "Settings",
      component: (
        <SettingsTabContent />
      ),
    }
  ];

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
    <View
      style={{
        flex: 1,
      }}
    >
      <CollaborationHeader
        collaboration={collaboration}
      />
      <TopTabNavigation
        tabs={tabs}
        size="compact"
      />
    </View>
  );
};

export default CollaborationDetails;

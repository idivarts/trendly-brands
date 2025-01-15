import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { ActivityIndicator, Button } from "react-native-paper";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { View } from "@/components/theme/Themed";
import TopTabNavigation from "@/components/ui/top-tab-navigation";
import ApplicationsTabContent from "./ApplicationsTabContent";
import InvitationsTabContent from "./InvitationsTabContent";
import OverviewTabContent from "./OverviewTabContent";
import SettingsTabContent from "./SettingsTabContent";
import CollaborationHeader from "../CollaborationHeader";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { IBrands } from "@/shared-libs/firestore/trendly-pro/models/brands";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Toast from "react-native-toast-message";

export interface CollaborationDetail extends ICollaboration {
  id: string;
  brandDescription: string;
  brandName: string;
  logo: string;
  paymentVerified: boolean;
  brandWebsite: string;
  brandCategory: string[];
}

interface CollaborationDetailsProps {
  pageID: string;
}

const CollaborationDetails: React.FC<CollaborationDetailsProps> = ({
  pageID,
}) => {
  const [collaboration, setCollaboration] = useState<
    CollaborationDetail | undefined
  >(undefined);
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  const publishCollaboration = async () => {
    if (!pageID) return;
    try {
      const collabRef = doc(FirestoreDB, "collaborations", pageID);
      await updateDoc(collabRef, {
        status: "active",
      });
      Toaster.success("Collaboration is published successfully");
      fetchCollaboration();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCollaboration = async () => {
    if (!pageID) return;
    try {
      const collabRef = doc(FirestoreDB, "collaborations", pageID as string);
      const snapshot = await getDoc(collabRef);
      const data = snapshot.data() as ICollaboration;
      if (!data) return;

      const brandRef = doc(FirestoreDB, "brands", data.brandId);
      const brandSnapshot = await getDoc(brandRef);
      const brandData = brandSnapshot.data() as IBrands;

      setCollaboration({
        id: snapshot.id,
        ...data,
        logo: brandData?.image || "",
        brandName: brandData?.name || "Unknown Brand",
        paymentVerified: brandData?.paymentMethodVerified || false,
        brandDescription: brandData?.profile
          ? brandData?.profile?.about || ""
          : "",
        brandWebsite: brandData?.profile
          ? brandData?.profile?.website || ""
          : "",
        brandCategory: brandData?.profile
          ? brandData?.profile?.industries || []
          : [],
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
          collaboration={collaboration as CollaborationDetail}
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
            questionsToInfluencers: collaboration?.questionsToInfluencers || [],
          }}
        />
      ),
    },
    {
      id: "Invitations",
      title: "Invitations",
      component: <InvitationsTabContent pageID={pageID} />,
    },
    {
      id: "Preferences",
      title: "Preferences",
      component: <SettingsTabContent pageID={pageID} />,
    },
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
      <View
        style={{
          zIndex: 1000,
        }}
      >
        <Toast />
      </View>
      <CollaborationHeader collaboration={collaboration} />

      {collaboration.status === "draft" && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 16,
            gap: 16,
            marginBottom: 16,
          }}
        >
          <Button
            mode="contained"
            onPress={() => {
              router.push({
                pathname: "/edit-collaboration",
                params: {
                  id: pageID,
                },
              });
            }}
            style={{
              flex: 1,
              backgroundColor: Colors(theme).background,
              borderWidth: 0.3,
              borderColor: Colors(theme).outline,
            }}
            textColor={Colors(theme).text}
          >
            Edit Draft
          </Button>
          <Button
            mode="contained"
            onPress={() => publishCollaboration()}
            style={{
              flex: 1,
            }}
          >
            Publish Now
          </Button>
        </View>
      )}
      {collaboration.status === "draft" && (
        <OverviewTabContent collaboration={collaboration} />
      )}
      {collaboration.status === "active" && (
        <TopTabNavigation tabs={tabs} size="compact" />
      )}
    </View>
  );
};

export default CollaborationDetails;

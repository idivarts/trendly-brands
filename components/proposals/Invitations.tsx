import BottomSheetActions from "@/components/BottomSheetActions";
import JobCard from "@/components/collaboration/CollaborationCard";
import { View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { ActivityIndicator, FlatList } from "react-native";
import { FirestoreDB } from "@/utils/firestore";
import { AuthApp } from "@/utils/auth";
import { RefreshControl } from "react-native";
import { stylesFn } from "@/styles/Proposal.styles";
import { useBrandContext } from "@/contexts/brand-context.provider";
import EmptyState from "../ui/empty-state";

const Invitations = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [notPendingProposals, setNotPendingProposals] = useState<number>();
  const { selectedBrand } = useBrandContext();

  const openBottomSheet = (id: string) => {
    setIsVisible(true);
    setSelectedCollabId(id);
  };
  const closeBottomSheet = () => setIsVisible(false);

  const theme = useTheme();
  const styles = stylesFn(theme);
  const user = AuthApp.currentUser;

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProposals();
    setRefreshing(false);
  };

  const fetchProposals = async () => {
    try {
      const collaborationCol = collection(FirestoreDB, "collaborations");
      const q = query(
        collaborationCol,
        where("brandId", "==", selectedBrand?.id)
      );
      const querySnapshot = await getDocs(q);

      const proposals = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = {
            ...doc.data(),
            id: doc.id,
          };

          // Fetch applications
          const applicationCol = collection(
            FirestoreDB,
            "collaborations",
            data.id,
            "applications"
          );
          const applicationSnapshot = await getDocs(applicationCol);
          const applications = applicationSnapshot.docs.map((appDoc) =>
            appDoc.data()
          );
          const acceptedApplications = applications.filter(
            (application) => application.status === "accepted"
          ).length;

          // Fetch invitations
          const invitationCol = collection(
            FirestoreDB,
            "collaborations",
            data.id,
            "invitations"
          );
          const invitationSnapshot = await getDocs(invitationCol);
          const invitations = invitationSnapshot.docs.map((invDoc) =>
            invDoc.data()
          );

          return {
            ...data,
            applications: applications.length,
            invitations: invitations.length,
            acceptedApplications,
          };
        })
      );

      setProposals(proposals);
    } catch (error) {
      console.error("Error fetching proposals: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [user, selectedBrand]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => proposal.status === "inactive");
  }, [proposals]);

  if (isLoading) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={Colors(theme).primary} />
        </View>
      </AppLayout>
    );
  }

  return (
    <View
      style={{
        width: "100%",
        flex: 1,
      }}
    >
      {
        proposals.length === 0 ? (
          <EmptyState
            hideAction
            image={require("@/assets/images/illustration5.png")}
            subtitle="Start building your profile today to have better reach. If any brand invites you to collaborate we woudl show it here"
            title="No Invitations yet"
          />
        ) : (
          <FlatList
            data={filteredProposals}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <JobCard
                name={item.name}
                id={item.id}
                brandName={item.brandName}
                description={item.description}
                brandId={item.brandId}
                budget={{
                  min: Number(item.budget.min),
                  max: Number(item.budget.max),
                }}
                onOpenBottomSheet={openBottomSheet}
                cardType="proposal"
                collaborationType={item.collaborationType}
                location={item.location}
                managerId="managerId"
                numberOfInfluencersNeeded={1}
                platform={item.platform}
                promotionType={item.promotionType}
                timeStamp={item.timeStamp}
                applications={item.applications}
                invitations={item.invitations}
                acceptedApplications={item.acceptedApplications}
                status={item.status}
              />
            )}
            keyExtractor={(item, index) => index.toString()}
            style={{
              flexGrow: 1,
              paddingTop: 8,
              paddingHorizontal: 16,
              paddingBottom: 100,
            }}
            contentContainerStyle={{
              gap: 16,
              paddingBottom: 24,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors(theme).primary]} // Customize color based on theme
              />
            }
          />
        )
      }
      {
        isVisible && (
          <BottomSheetActions
            cardId={selectedCollabId || ""}
            cardType="influencerCard"
            isVisible={isVisible}
            onClose={closeBottomSheet}
            snapPointsRange={["20%", "50%"]}
            key={selectedCollabId}
          />
        )
      }
    </View>
  );
};

export default Invitations;

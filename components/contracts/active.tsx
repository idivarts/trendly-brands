import BottomSheetActions from "@/components/BottomSheetActions";
import { View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import {
  IApplications,
  ICollaboration,
} from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { stylesFn } from "@/styles/Proposal.styles";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl } from "react-native";
import ContractDetails from "../contract-card/ContractDetails";
import ContractHeader from "../contract-card/ContractHeader";
import EmptyState from "../ui/empty-state";

interface ICollaborationCard extends IContracts {
  userData: IUsers;
  applications: IApplications[];
  collaborationData: ICollaboration;
}

const ActiveContracts = ({ isPast = false }: { isPast?: boolean }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [proposals, setProposals] = useState<ICollaborationCard[]>([]);
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

  const { xl } = useBreakpoints();

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProposals();
    setRefreshing(false);
  };

  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      const user = AuthApp.currentUser;

      if (!user?.uid) {
        throw new Error("User not authenticated");
      }

      const contractsCol = collection(FirestoreDB, "contracts");
      const contractQuery = query(
        contractsCol,
        where("brandId", "==", selectedBrand?.id),
        ...(!isPast ? [where("status", "in", [1])] : [where("status", "in", [2, 3])]), // Exclude pending and completed contracts
      );
      const contractsSnapshot = await getDocs(contractQuery);

      const contracts = await Promise.all(
        contractsSnapshot.docs.map(async (document) => {
          const contract = document.data() as IContracts;
          const collaborationId = contract.collaborationId;

          const user = doc(FirestoreDB, "users", contract.userId);
          const userSnapshot = await getDoc(user);
          const userData = userSnapshot.data() as IUsers;

          const hasAppliedQuery = query(
            collectionGroup(FirestoreDB, "applications"),
            where("userId", "==", contract.userId),
            where("collaborationId", "==", collaborationId)
          );

          const hasAppliedSnapshot = await getDocs(hasAppliedQuery);

          //@ts-ignore
          const applications = hasAppliedSnapshot.docs.map((appDoc) => ({
            id: appDoc.id,
            ...appDoc.data(),
          })) as IApplications[];

          const collaborationRef = doc(
            FirestoreDB,
            "collaborations",
            collaborationId
          );
          const collaborationSnapshot = await getDoc(collaborationRef);
          const collaborationData =
            collaborationSnapshot.data() as ICollaboration;

          return { ...contract, applications, userData, collaborationData };
        })
      );

      setProposals(contracts);
      setIsLoading(false);
    } catch (error) {
      Console.error(error, "Error fetching proposals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [user, selectedBrand]);

  const filteredProposals = useMemo(() => {
    return proposals
    // .filter((proposal) => {
    //   return proposal.status !== 3 && proposal.status !== 0;
    // });
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
      {filteredProposals.length === 0 ? (
        <EmptyState
          image={require("@/assets/images/illustration6.png")}
          subtitle="Start Applying today and get exclusive collabs"
          title="No Contracts yet"
          action={() => router.push("/collaborations")}
          actionLabel="Explore Collaborations"
        />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={filteredProposals}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  router.push(`/contract-details/${item.streamChannelId}`);
                }}
                style={{
                  flex: 1,
                  borderWidth: 0.3,
                  borderColor: Colors(theme).gray300,
                  borderRadius: 5,
                  maxWidth: xl ? "48%" : "100%",
                  overflow: "hidden",
                }}
              >
                <ContractHeader
                  userImage={item.userData?.profileImage || ""}
                  username={item.userData?.name}
                  collabId={item.collaborationId}
                  collabName={item.collaborationData.name || ""}
                  onOpenBottomSheet={() => { openBottomSheet(item.collaborationId) }}
                />
                <ContractDetails
                  application={
                    item.applications[0] || {
                      message: "No message",
                      quotation: "No quotation",
                      // timeline: new Date().toISOString(),
                    }
                  }
                />
              </Pressable>
            )}
            keyExtractor={(item, index) => index.toString()}
            style={{
              flexGrow: 1,
              paddingBottom: 16,
              paddingHorizontal: 16,
              paddingTop: 8,
            }}
            contentContainerStyle={{
              gap: 16,
              paddingBottom: 24,
              alignItems: "stretch",
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors(theme).primary]}
              />
            }
            horizontal={false}
            numColumns={xl ? 2 : 1} // TODO: On fly can't be responsive
            {...(xl && {
              columnWrapperStyle: {
                gap: 16,
              },
            })}
          />
        </View>
      )}
      {isVisible && (
        <BottomSheetActions
          cardId={selectedCollabId || ""}
          cardType="contract"
          isVisible={isVisible}
          onClose={closeBottomSheet}
          snapPointsRange={["20%", "50%"]}
          key={selectedCollabId}
        />
      )}
    </View>
  );
};

export default ActiveContracts;

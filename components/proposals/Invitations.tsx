import BottomSheetActions from "@/components/BottomSheetActions";
import JobCard from "@/components/collaboration/CollaborationCard";
import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import { Link, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc as firebaseDoc,
  getDoc,
} from "firebase/firestore";
import { ActivityIndicator, FlatList, Image } from "react-native";
import { FirestoreDB } from "@/utils/firestore";
import { AuthApp } from "@/utils/auth";
import { RefreshControl } from "react-native";
import { stylesFn } from "@/styles/Proposal.styles";
import { Button } from "react-native-paper";

const Invitations = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [notPendingInvitations, setNotPendingInvitations] = useState<number>();
  const [refreshing, setRefreshing] = useState(false);

  const openBottomSheet = (id: string) => {
    setIsVisible(true);
    setSelectedCollabId(id);
  };
  const closeBottomSheet = () => setIsVisible(false);

  const theme = useTheme();
  const styles = stylesFn(theme);
  const user = AuthApp.currentUser;

  const [isLoading, setIsLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      const collaborationCol = collection(FirestoreDB, "collaborations");
      const collabSnapshot = await getDocs(collaborationCol);
      let totalNotPendingInvitations = 0;

      // Map over the collaborations to fetch applications for each collaboration
      const invitationsWithApplications = await Promise.all(
        collabSnapshot.docs.map(async (doc) => {
          const collab = {
            id: doc.id,
            brandId: doc.data().brandId,
            ...doc.data(),
          };
          const brandDoc = firebaseDoc(
            collection(FirestoreDB, "brands"),
            collab.brandId
          );
          const brandData = await getDoc(brandDoc);
          if (!brandData.exists()) {
            return null;
          }

          // Fetch applications for the current collaboration
          const applicationCol = collection(
            FirestoreDB,
            "collaborations",
            collab.id,
            "invitations"
          );
          const applicationSnapshot = query(
            applicationCol,
            where("userId", "==", "09cNbHT14AYyy1t2joVL3aMeRMm1")
          );

          const applicationData = await getDocs(applicationSnapshot).then(
            (querySnapshot) => {
              return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                userId: doc.data().userId,
                status: doc.data().status,
                ...doc.data(),
              }));
            }
          );

          const userApplications = applicationData.filter(
            (application) =>
              application.userId === "PjoQGkMJATUjo3nxL4t7Dj80wOD3"
          );

          const notPendingApplications = userApplications.filter(
            (application) => application.status !== "pending"
          ).length;

          totalNotPendingInvitations += notPendingApplications;

          if (applicationData.length === 0) {
            return null;
          }

          return {
            ...collab,
            applications: applicationData[0],
            brandName: brandData.data().name,
          };
        })
      );

      const validProposals = invitationsWithApplications.filter(
        (proposal) => proposal !== null
      );

      setInvitations(validProposals);
      setNotPendingInvitations(totalNotPendingInvitations);
    } catch (error) {
      console.error("Error fetching proposals: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvitations();
    setRefreshing(false);
  };

  const pendingInvitations = useMemo(
    () =>
      invitations.filter((invitation) => {
        return invitation.applications.status === "pending";
      }),
    [invitations]
  );

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
      }}
    >
      {pendingInvitations.length === 0 && notPendingInvitations === 0 ? (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            gap: 50,
          }}
        >
          <Image
            source={{ uri: "https://via.placeholder.com/150" }}
            width={150}
            height={150}
            style={{
              borderRadius: 10,
            }}
          />
          <View
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={styles.title}>No Invitations found</Text>
            <Text style={styles.subtitle}>
              Go to the Collaborations page to start applying for new
              collaborations
            </Text>
          </View>
          {/* <TouchableOpacity onPress={() => router.push("/collaborations")}>
                          <Text style={styles.title}>New Collaborations</Text>
                        </TouchableOpacity> */}
          <Button
            onPress={() => router.push("/collaborations")}
            style={{
              backgroundColor: Colors(theme).platinum,
              padding: 5,
              borderRadius: 5,
            }}
            textColor={Colors(theme).text}
          >
            New Collaborations
          </Button>
        </View>
      ) : pendingInvitations.length !== 0 ? (
        <FlatList
          data={pendingInvitations}
          renderItem={({ item }) => (
            <JobCard
              id={item.id}
              name={item.name}
              brandName={item.brandName}
              onOpenBottomSheet={openBottomSheet}
              description={item.description}
              brandId={item.brandId}
              budget={{
                min: Number(item.budget.min),
                max: Number(item.budget.max),
              }}
              cardType="proposal"
              collaborationType={item.collaborationType}
              location={item.location}
              managerId="managerId"
              numberOfInfluencersNeeded={1}
              platform={item.platform}
              promotionType={item.promotionType}
              timeStamp={item.timeStamp}
              applications={undefined}
              invitations={undefined}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
          style={{ height: "100%", width: "100%" }}
          ListFooterComponent={
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              {notPendingInvitations !== 0 && (
                <View>
                  <Text
                    style={[
                      styles.title,
                      {
                        marginBottom: 10,
                        color: Colors(theme).text,
                      },
                    ]}
                  >
                    Looking for past invitations
                  </Text>
                  <View
                    style={{
                      backgroundColor: Colors(theme).card,
                      padding: 10,
                      borderRadius: 5,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Link
                      href={{
                        pathname: "/(drawer)/(tabs)/explore-influencers",
                      }}
                    >
                      <Text>View Past Invitations</Text>
                    </Link>
                  </View>
                </View>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors(theme).primary]} // Customize color based on theme
            />
          }
        />
      ) : (
        <View>
          {pendingInvitations.length === 0 && notPendingInvitations !== 0 && (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <Text
                style={[
                  styles.title,
                  {
                    marginBottom: 10,
                    color: Colors(theme).text,
                  },
                ]}
              >
                Looking for past invitations
              </Text>
              <View
                style={{
                  backgroundColor: Colors(theme).card,
                  padding: 10,
                  borderRadius: 5,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Link
                  href={{
                    pathname: "/(drawer)/(tabs)/explore-influencers",
                  }}
                  style={{}}
                >
                  <Text>View Past Invitations</Text>
                </Link>
              </View>
            </View>
          )}
        </View>
      )}
      {isVisible && (
        <BottomSheetActions
          cardId={selectedCollabId || ""}
          cardType="influencerCard"
          isVisible={isVisible}
          onClose={closeBottomSheet}
          snapPointsRange={["20%", "50%"]}
          key={selectedCollabId}
        />
      )}
    </View>
  );
};

export default Invitations;

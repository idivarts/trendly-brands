import BottomSheetActions from "@/components/BottomSheetActions";
import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where, orderBy, onSnapshot } from "firebase/firestore";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
} from "react-native";
import { FirestoreDB } from "@/utils/firestore";
import { AuthApp } from "@/utils/auth";
import { RefreshControl } from "react-native";
import { stylesFn } from "@/styles/Proposal.styles";
import { useBrandContext } from "@/contexts/brand-context.provider";
import EmptyState from "../ui/empty-state";
import { useBreakpoints } from "@/hooks";
import Carousel from "@/shared-uis/components/carousel/carousel";
import { MediaItem } from "@/types/Media";
import { processRawAttachment } from "@/utils/attachments";
import CollaborationDetails from "../collaboration-card/card-components/CollaborationDetails";
import CollaborationStats from "../collaboration-card/card-components/CollaborationStats";
import Button from "../ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const Applications = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
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
      if (!selectedBrand) {
        return;
      }

      const collaborationCol = collection(FirestoreDB, "collaborations");
      const q = query(
        collaborationCol,
        where("brandId", "==", selectedBrand?.id),
        orderBy("timeStamp", "desc")
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
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
      });

      return () => {
        unsubscribe();
      };
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
    return proposals.filter((proposal) => proposal.status !== "inactive");
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
        position: "relative",
      }}
    >
      {filteredProposals.length === 0 ? (
        <EmptyState
          image={require("@/assets/images/illustration6.png")}
          subtitle="You have posted no collaborations yet! Your journey begins here"
          title="No Collaborations posted"
          action={() => router.push("/(modal)/create-collaboration")}
          actionLabel="Create Collaboration"
        />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={filteredProposals}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                style={{
                  width: "100%",
                  borderWidth: 0.3,
                  borderColor: Colors(theme).gray300,
                  gap: 8,
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                {item.attachments && item.attachments?.length > 0 && (
                  <Carousel
                    theme={theme}
                    data={
                      item.attachments?.map(
                        //@ts-ignore
                        (attachment: MediaItem) =>
                          processRawAttachment(attachment)
                      ) || []
                    }
                    carouselWidth={xl ? 640 : Dimensions.get("window").width}
                  />
                )}
                {item.status === "draft" && (
                  <View
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      backgroundColor: Colors(theme).backdrop,
                      padding: 4,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ color: Colors(theme).white }}>Draft</Text>
                  </View>
                )}

                <CollaborationDetails
                  collabDescription={item.description || ""}
                  name={item.name || ""}
                  contentType={item.contentFormat}
                  location={item.location}
                  platform={item.platform}
                  promotionType={item.promotionType}
                  onOpenBottomSheet={openBottomSheet}
                  collabId={item.id}
                />
                <Pressable
                  onPress={() =>
                    router.push(`/collaboration-details/${item.id}`)
                  }
                >
                  <CollaborationStats
                    budget={item.budget}
                    collabID={item.id}
                    influencerCount={item.numberOfInfluencersNeeded}
                  />
                </Pressable>
              </View>
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
              paddingBottom: 64,
              width: xl ? "50%" : "100%",
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors(theme).primary]}
              />
            }
            numColumns={xl ? 2 : 1}
            {...(xl && {
              columnWrapperStyle: {
                justifyContent: "space-between",
                gap: 16,
              },
            })}
          />
        </View>
      )}
      {isVisible && (
        <BottomSheetActions
          cardId={selectedCollabId || ""}
          cardType="activeCollab"
          isVisible={isVisible}
          onClose={closeBottomSheet}
          snapPointsRange={["20%", "50%"]}
          key={selectedCollabId}
        />
      )}
      {filteredProposals.length !== 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            left: 0,
            paddingTop: 16,
            paddingHorizontal: 16,
          }}
        >
          <Button
            onPress={() => {
              router.push({
                pathname: "/(modal)/create-collaboration",
              });
            }}
          >
            <FontAwesomeIcon
              icon={faPlus}
              color="white"
              size={14}
              style={{
                marginRight: 8,
                marginTop: -2,
              }}
            />
            Create Collaboration
          </Button>
        </View>
      )}
    </View>
  );
};

export default Applications;

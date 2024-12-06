import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator } from "react-native";

import { useTheme } from "@react-navigation/native";
import InfluencerCard from "@/components/InfluencerCard";
import { FirestoreDB } from "@/utils/firestore";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import BottomSheetActions from "@/components/BottomSheetActions";
import EmptyState from "@/components/ui/empty-state";
import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";

const ApplicationsTabContent = (props: any) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [influencers, setInfluencers] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const {
    xl,
  } = useBreakpoints();

  const fetchApplications = async () => {
    try {
      const applicationRef = collection(
        FirestoreDB,
        "collaborations",
        props.pageID,
        "applications"
      );
      const applicationFetch = await getDocs(applicationRef);
      const applications = applicationFetch.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id,
        } as any;
      });

      const influencers = await Promise.all(
        applications.map(async (application) => {
          const userRef = doc(FirestoreDB, "users", application.userId);
          const userFetch = await getDoc(userRef);
          return {
            ...application,
            ...userFetch.data(),
            id: userFetch.id,
            applicationID: application.id,
          } as any;
        })
      );
      setInfluencers(influencers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
        }}
      >
        <ActivityIndicator size="large" color={Colors(theme).primary} />
      </View>
    );
  }

  if (influencers.length === 0) {
    return (
      <EmptyState
        subtitle="No applications yet. Check back later."
        image={require("@/assets/images/illustration6.png")}
        hideAction
      />
    );
  };

  return (
    <>
      <FlatList
        data={influencers}
        renderItem={({ item }) => (
          <InfluencerCard
            type="application"
            influencer={item}
            ToggleModal={() => {
              setIsVisible(true);
              setSelectedApplication({
                applicationID: item.applicationID,
                collaborationID: props.pageID,
                influencerID: item.id,
              });
            }}
          />
        )}
        keyExtractor={(item, index) => item.id + index}
        style={{
          paddingBottom: 16,
          width: xl ? 768 : '100%',
          marginHorizontal: "auto",
        }}
        ItemSeparatorComponent={
          () => (
            <View
              style={{
                height: 16,
                backgroundColor: theme.dark ? Colors(theme).background : Colors(theme).aliceBlue,
              }}
            />
          )
        }
      />
      {
        isVisible && (
          <BottomSheetActions
            cardType="applicationCard"
            data={{
              collaboration: props.collaboration
            }}
            isVisible={isVisible}
            onClose={() => setIsVisible(false)}
            snapPointsRange={["30%", "50%"]}
            cardId={selectedApplication}
            key={selectedApplication?.applicationID}
          />
        )
      }
    </>
  );
};

export default ApplicationsTabContent;

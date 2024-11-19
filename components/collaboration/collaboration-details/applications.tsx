import React, { useEffect, useState } from "react";
import { View, Image, FlatList } from "react-native";
import {
  Text,
  ActivityIndicator,
} from "react-native-paper";

import { useTheme } from "@react-navigation/native";
import { stylesFn } from "@/styles/CollaborationDetails.styles";
import InfluencerCard from "@/components/InfluencerCard";
import { FirestoreDB } from "@/utils/firestore";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import BottomSheetActions from "@/components/BottomSheetActions";
import Toast from "react-native-toast-message";

const CollaborationApplicationPage = (props: any) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [isVisible, setIsVisible] = useState(false);
  const [influencers, setInfluencers] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return influencers.length !== 0 ? (
    <>
      <Toast />
      <FlatList
        data={influencers}
        renderItem={({ item }) => (
          <InfluencerCard
            type="application"
            influencer={{
              profilePic: item.profileImage,
              name: item.name,
              handle: item.handle || "@handle",
              media: item.attachments,
              followers: item.backend ? item.backend.followers : 1000,
              reach: item.backend ? item.backend.reach : 10000,
              rating: item.backend ? item.backend.rating : 4.5,
              bio: "I am a content creator",
              jobsCompleted: 12,
              successRate: 100,
            }}
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
        contentContainerStyle={{
          gap: 8,
        }}
        style={{
          paddingHorizontal: 2,
          paddingBottom: 100,
        }}
      />
      {isVisible && (
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
      )}
    </>
  ) : (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 40,
      }}
    >
      <Image
        source={{
          uri:
            props.logo ||
            "https://cdni.iconscout.com/illustration/premium/thumb/connection-lost-illustration-download-in-svg-png-gif-file-formats--404-error-empty-state-page-not-found-pack-design-development-illustrations-6632144.png?f=webp",
        }}
        style={{
          height: 200,
          width: 200,
        }}
      />
      <Text
        style={{
          fontSize: 16,
          color: theme.colors.text,
        }}
      >
        No applications yet. Check back later.
      </Text>
    </View>
  );
};

export default CollaborationApplicationPage;

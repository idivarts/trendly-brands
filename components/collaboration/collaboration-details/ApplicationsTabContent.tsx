import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, FlatList, ActivityIndicator } from "react-native";

import { useTheme } from "@react-navigation/native";
import { FirestoreDB } from "@/utils/firestore";
import EmptyState from "@/components/ui/empty-state";
import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import {
  ApplicationCard
} from "@/components/card/collaboration-details/application-card";
import {
  ApplicationCard as ProfileApplicationCard
} from "@/components/card/profile-modal/application-card";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSharedValue } from "react-native-reanimated";
import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import { User } from "@/types/User";
import BottomSheetContainer from "@/shared-uis/components/bottom-sheet";
import { List } from "react-native-paper";
import { useApplications } from "@/hooks/request";

const ApplicationsTabContent = (props: any) => {
  const theme = useTheme();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<User | null>(null);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);

  const {
    xl,
  } = useBreakpoints();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  const insets = useSafeAreaInsets();
  const containerOffset = useSharedValue({
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
  });

  const renderBackdrop = (props: any) => {
    return (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    );
  };

  const toggleActionModal = () => {
    setIsActionModalVisible(!isActionModalVisible);
  }

  const handleActionModalClose = () => {
    setIsActionModalVisible(false);
  }

  const {
    fetchApplications,
    handleAcceptApplication,
    handleRejectApplication,
    influencers,
    loading,
  } = useApplications({
    application: selectedApplication,
    data: props.collaboration,
    handleActionModalClose,
    pageId: props.pageID,
  });

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
          <ApplicationCard
            data={item}
            headerLeftAction={() => {
              setSelectedInfluencer(item);
              setSelectedApplication({
                applicationID: item.applicationID,
                collaborationID: props.pageID,
                influencerID: item.id,
              });
              setTimeout(() => {
                bottomSheetModalRef.current?.present();
              }, 500);
            }}
            headerRightAction={() => {
              setSelectedInfluencer(item);
              setSelectedApplication({
                applicationID: item.applicationID,
                collaborationID: props.pageID,
                influencerID: item.id,
              });
              setIsActionModalVisible(true);
            }}
          />
        )}
        keyExtractor={(item, index) => item.id + index}
        style={{
          paddingBottom: 16,
          width: xl ? 640 : '100%',
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
        isActionModalVisible && (
          <BottomSheetContainer
            isVisible={isActionModalVisible}
            onClose={toggleActionModal}
            snapPoints={["25%", "50%"]}
          >
            <List.Section
              style={{
                paddingBottom: 28
              }}
            >
              <List.Item
                title="Accept Application"
                onPress={() => {
                  console.log("Accept Application");
                }}
              />
              <List.Item
                title="Reject Application"
                onPress={() => {
                  console.log("Reject Application");
                }}
              />
            </List.Section>
          </BottomSheetContainer>
        )
      }

      <BottomSheetModal
        backdropComponent={renderBackdrop}
        containerOffset={containerOffset}
        enablePanDownToClose={true}
        index={2}
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        topInset={insets.top}
      >
        <BottomSheetScrollView>
          <ProfileBottomSheet
            actionCard={
              <View
                style={{
                  marginHorizontal: 16,
                }}
              >
                <ProfileApplicationCard
                  onReject={() => {
                    console.log("Reject Application");
                  }}
                  onAccept={() => {
                    console.log("Accept Application");
                  }}
                />
              </View>
            }
            FireStoreDB={FirestoreDB}
            influencer={selectedInfluencer as User}
            isBrandsApp={true}
            theme={theme}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
};

export default ApplicationsTabContent;

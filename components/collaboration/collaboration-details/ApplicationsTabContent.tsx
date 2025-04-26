import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";

import {
  ApplicationCard
} from "@/components/card/collaboration-details/application-card";
import {
  ApplicationCard as ProfileApplicationCard
} from "@/components/card/profile-modal/application-card";
import { View } from "@/components/theme/Themed";
import { CardHeader } from "@/components/ui/card/secondary/card-header";
import EmptyState from "@/components/ui/empty-state";
import Colors from "@/constants/Colors";
import { MAX_WIDTH_WEB } from "@/constants/Container";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { useApplications } from "@/hooks/request";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import BottomSheetContainer from "@/shared-uis/components/bottom-sheet";
import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import { Application, InfluencerApplication } from "@/types/Collaboration";
import { User } from "@/types/User";
import { processRawAttachment } from "@/utils/attachments";
import { FirestoreDB } from "@/utils/firestore";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import { List } from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IProps {
  isApplicationConcised?: boolean;
  pageID: string;
  collaboration: {
    id: string;
    name: string;
    questionsToInfluencers: string[];
  };
}
const ApplicationsTabContent = ({ isApplicationConcised, ...props }: IProps) => {
  const theme = useTheme();
  const [selectedInfluencerApplication, setSelectedInfluencerApplication] = useState<InfluencerApplication | null>(null);
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

  // const collaborationQuestions = props.collaboration?.questionsToInfluencers || [];

  const {
    fetchApplications,
    handleAcceptApplication,
    handleRejectApplication,
    influencers,
    loading,
  } = useApplications({
    isApplicationConcised,
    collaborationId: props.pageID,
    data: {
      collaboration: props.collaboration,
    },
    handleActionModalClose,
  });

  const { brands } = useBrandContext();

  useEffect(() => {
    fetchApplications();
  }, [brands]);

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
          <>
            {isApplicationConcised && <View style={{ borderBottomColor: Colors(theme).border, borderBottomWidth: 1, paddingVertical: 16, paddingHorizontal: 8, backgroundColor: Colors(theme).card }}>
              <CardHeader
                avatar={item.brand?.image || ""}
                handle={item.brand?.name || ""}
                // isVerified={true}
                name={item.collaboration?.name || ""}
              />
            </View>}
            <ApplicationCard
              acceptApplication={() => {
                setSelectedInfluencerApplication(item);
                handleAcceptApplication(item);
              }}
              bottomSheetAction={() => {
                setSelectedInfluencerApplication(item);
                setIsActionModalVisible(true);
              }}
              data={item}
              profileModalAction={() => {
                setSelectedInfluencerApplication(item);
                setTimeout(() => {
                  bottomSheetModalRef.current?.present();
                }, 500);
              }}
            />
          </>
        )}
        keyExtractor={(item, index) => item.application.id + index}
        style={{
          paddingBottom: 16,
          width: xl ? MAX_WIDTH_WEB : '100%',
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
                  handleAcceptApplication(selectedInfluencerApplication as InfluencerApplication);
                }}
              />
              <List.Item
                title="Reject Application"
                onPress={() => {
                  handleRejectApplication(selectedInfluencerApplication as InfluencerApplication);
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
                  backgroundColor: Colors(theme).transparent,
                  marginHorizontal: 16,
                }}
              >
                <ProfileApplicationCard
                  data={selectedInfluencerApplication?.application as Application}
                  onReject={async () => {
                    await handleRejectApplication(selectedInfluencerApplication as InfluencerApplication).then(() => {
                      bottomSheetModalRef.current?.close();
                    });
                  }}
                  onAccept={async () => {
                    await handleAcceptApplication(selectedInfluencerApplication as InfluencerApplication).then(() => {
                      bottomSheetModalRef.current?.close();
                    });
                  }}
                  questions={selectedInfluencerApplication?.application.answersFromInfluencer.map((answer, index) => ({
                    question: selectedInfluencerApplication.collaboration?.questionsToInfluencers?.[index] || "",
                    answer: answer.answer
                  })) || []}
                />
              </View>
            }
            carouselMedia={selectedInfluencerApplication?.application.attachments.map((attachment: Attachment) => processRawAttachment(attachment))}
            FireStoreDB={FirestoreDB}
            influencer={selectedInfluencerApplication?.influencer as User}
            isBrandsApp={true}
            theme={theme}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
};

export default ApplicationsTabContent;

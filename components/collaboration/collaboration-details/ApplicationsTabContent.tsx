import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions } from "react-native";

import {
  ApplicationCard
} from "@/components/card/collaboration-details/application-card";
import {
  ApplicationCard as ProfileApplicationCard
} from "@/components/card/profile-modal/application-card";
import InfluencerActionModal from "@/components/explore-influencers/InfluencerActionModal";
import { View } from "@/components/theme/Themed";
import BottomSheetScrollContainer from "@/components/ui/bottom-sheet/BottomSheetWithScroll";
import EmptyState from "@/components/ui/empty-state";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { useApplications } from "@/hooks/request";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { APPROX_CARD_HEIGHT, MAX_WIDTH_WEB } from "@/shared-uis/components/carousel/carousel-util";
import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import { CarouselInViewProvider } from "@/shared-uis/components/scroller/CarouselInViewContext";
import CarouselScroller from "@/shared-uis/components/scroller/CarouselScroller";
import { Text } from "@/shared-uis/components/theme/Themed";
import { Application, InfluencerApplication } from "@/types/Collaboration";
import { User } from "@/types/User";
import { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
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
  const { manager } = useAuthContext()

  const {
    xl,
  } = useBreakpoints();

  // const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  // const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
  const [openProfileModal, setOpenProfileModal] = useState(false)

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
    influencers: rawInfluencers,
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

  const influencers = rawInfluencers.filter(i => {
    return !(manager?.moderations?.blockedInfluencers || []).includes(i.influencer.id)
  })

  if (influencers.length === 0) {
    return (
      <EmptyState
        subtitle="No applications yet. Check back later."
        image={require("@/assets/images/illustration6.png")}
        hideAction
      />
    );
  };

  const width = Math.min(MAX_WIDTH_WEB, Dimensions.get('window').width);
  const height = Math.min(APPROX_CARD_HEIGHT, Dimensions.get('window').height);

  return (
    <View style={{ alignSelf: "stretch", height: "100%" }}>
      <CarouselInViewProvider>
        <CarouselScroller
          data={influencers}
          height={height}
          vertical={true}
          width={width}
          renderItem={({ item }) => (
            <ApplicationCard
              key={(item as InfluencerApplication).application.id}
              topHeaderNode={isApplicationConcised && <View style={{
                paddingBottom: 16, backgroundColor: Colors(theme).card
              }}>
                <View style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                  // paddingHorizontal: 16,
                }}>
                  <Text style={{ fontWeight: "600", fontSize: 16 }}>{item.collaboration?.name || ""}</Text>
                  <Text style={{ fontWeight: "400", fontSize: 12 }}>{item.brand?.name || ""}</Text>
                </View>

              </View>}
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
                setOpenProfileModal(true);
              }}
            />
          )}
          objectKey="id"
        />
      </CarouselInViewProvider>

      <InfluencerActionModal influencerId={selectedInfluencerApplication?.influencer.id} isModalVisible={isActionModalVisible} openProfile={() => setOpenProfileModal(true)} toggleModal={toggleActionModal}
        applicationCopy={selectedInfluencerApplication ? {
          collaborationId: selectedInfluencerApplication.application.collaborationId || "",
          applicationId: selectedInfluencerApplication.application.id || ""
        } : undefined} />

      <BottomSheetScrollContainer
        isVisible={openProfileModal}
        snapPointsRange={["90%", "90%"]}
        onClose={() => { setOpenProfileModal(false) }}
      >
        <ProfileBottomSheet
          closeModal={() => setOpenProfileModal(false)}
          isPhoneMasked={false}
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
                    setOpenProfileModal(false)
                  });
                }}
                onAccept={async () => {
                  await handleAcceptApplication(selectedInfluencerApplication as InfluencerApplication).then(() => {
                    setOpenProfileModal(false)
                  });
                }}
                questions={selectedInfluencerApplication?.application.answersFromInfluencer.map((answer, index) => ({
                  question: selectedInfluencerApplication.collaboration?.questionsToInfluencers?.[index] || "",
                  answer: answer.answer
                })) || []}
              />
            </View>
          }
          // carouselMedia={selectedInfluencerApplication?.application.attachments.map((attachment: Attachment) => processRawAttachment(attachment))}
          FireStoreDB={FirestoreDB}
          influencer={selectedInfluencerApplication?.influencer as User}
          isBrandsApp={true}
          theme={theme}
        />
      </BottomSheetScrollContainer>
    </View>
  );
};

export default ApplicationsTabContent;

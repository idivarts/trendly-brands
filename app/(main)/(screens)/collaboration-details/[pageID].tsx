import BottomSheetActions from "@/components/BottomSheetActions";
import CollaborationDetails from "@/components/collaboration/collaboration-details";
import ScreenHeader from "@/components/ui/screen-header";
import AppLayout from "@/layouts/app-layout";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

const CollaborationDetailsScreen = () => {
  const [isVisible, setIsVisible] = useState(false);
  const pageID = useLocalSearchParams().pageID;

  return (
    <AppLayout>
      <ScreenHeader
        title="Collaboration Details"
      />
      <CollaborationDetails
        pageID={pageID as string}
      />
      <BottomSheetActions
        cardId={pageID as string}
        cardType="influencerCard"
        isVisible={isVisible}
        snapPointsRange={["20%", "50%"]}
        onClose={() => {
          setIsVisible(false);
        }}
      />
    </AppLayout>
  );
};

export default CollaborationDetailsScreen;

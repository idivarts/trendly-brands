import BottomSheetActions from "@/components/BottomSheetActions";
import CollaborationDetails from "@/components/collaboration/collaboration-details";
import BackButton from "@/components/ui/back-button/BackButton";
import Colors from "@/constants/Colors";
import AppLayout from "@/layouts/app-layout"
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Appbar } from "react-native-paper"

const CollaborationDetailsScreen = () => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const pageID = useLocalSearchParams().pageID;

  return (
    <AppLayout>
      <Appbar.Header
        statusBarHeight={0}
        style={{
          backgroundColor: Colors(theme).background,
        }}
      >
        <BackButton />
        <Appbar.Content
          title="Collaboration Details"
          color={Colors(theme).text}
        />
      </Appbar.Header>
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

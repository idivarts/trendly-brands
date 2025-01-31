import BottomSheetActions from "@/components/BottomSheetActions";
import CollaborationDetails from "@/components/collaboration/collaboration-details";
import ScreenHeader from "@/components/ui/screen-header";
import Colors from "@/constants/Colors";
import AppLayout from "@/layouts/app-layout";
import { faEllipsisH, faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable } from "react-native";

const CollaborationDetailsScreen = () => {
  const [isVisible, setIsVisible] = useState(false);
  const pageID = useLocalSearchParams().pageID;
  const theme = useTheme();

  return (
    <AppLayout>
      <ScreenHeader
        title="Collaboration Details"
        rightAction
        rightActionButton={
          <Pressable onPress={() => setIsVisible(true)}>
            <FontAwesomeIcon
              icon={faEllipsisV}
              size={24}
              color={Colors(theme).text}
            />
          </Pressable>
        }
      />
      <CollaborationDetails pageID={pageID as string} />
      <BottomSheetActions
        cardId={pageID as string}
        cardType="activeCollab"
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

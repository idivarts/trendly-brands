import CollaborationDetails from "@/components/collaboration/collaboration-details";
import AppLayout from "@/layouts/app-layout";
import { useLocalSearchParams } from "expo-router";

const CollaborationDetailsScreen = () => {
    const pageID = useLocalSearchParams().pageID;

    return (
        <AppLayout withWebPadding={false}>
            {/* <ScreenHeader
        title="Collaboration Details"
        rightAction
        rightActionButton={
          <Pressable onPress={() => setIsVisible(true)} style={{ paddingRight: 16 }}>
            <FontAwesomeIcon
              icon={faEllipsisH}
              size={24}
              color={Colors(theme).text}
            />
          </Pressable>
        }
      /> */}
            <CollaborationDetails pageID={pageID as string} />
        </AppLayout>
    );
};

export default CollaborationDetailsScreen;

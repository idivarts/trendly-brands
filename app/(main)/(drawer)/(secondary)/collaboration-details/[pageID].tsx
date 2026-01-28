import CollaborationDetails from "@/components/collaboration/collaboration-details";
import AppLayout from "@/layouts/app-layout";
import { useLocalSearchParams } from "expo-router";

const CollaborationDetailsScreen = () => {
    const { pageID } = useLocalSearchParams<{ pageID?: string }>();
    const collaborationId = pageID?.toString();

    if (!collaborationId) return null;

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
            <CollaborationDetails pageID={collaborationId} />
        </AppLayout>
    );
};

export default CollaborationDetailsScreen;

import { View } from "@/components/theme/Themed";
import AppLayout from "@/layouts/app-layout";
import Applications from "@/components/proposals/Applications";
import Invitations from "@/components/proposals/Invitations";
import TopTabNavigation from "../ui/top-tab-navigation";
import Button from "../ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "expo-router";

const tabs = [
  {
    id: "Active",
    title: "Active",
    component: <Applications />,
  },
  {
    id: "Past",
    title: "Past",
    component: <Invitations />,
  },
];

const Collaborations = () => {
  const router = useRouter();

  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          paddingTop: 16,
          paddingBottom: 64,
        }}
      >
        <TopTabNavigation tabs={tabs} />
        <Button
          customStyles={{
            position: "absolute",
            bottom: 16,
            right: 16,
            left: 16,
          }}
          onPress={() => {
            router.push({
              pathname: "/(modal)/create-collaboration",
            });
          }}
        >
          <FontAwesomeIcon
            icon={faPlus}
            color="white"
            size={14}
            style={{
              marginRight: 8,
              marginTop: -2,
            }}
          />
          Create Collaboration
        </Button>
      </View>
    </AppLayout>
  );
};

export default Collaborations;

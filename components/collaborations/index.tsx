import { View } from "@/components/theme/Themed";
import AppLayout from "@/layouts/app-layout";
import Applications from "@/components/proposals/Applications";
import Invitations from "@/components/proposals/Invitations";
import TopTabNavigation from "../ui/top-tab-navigation";

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
  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          paddingTop: 16,
        }}
      >
        <TopTabNavigation
          tabs={tabs}
        />
      </View>
    </AppLayout>
  );
};

export default Collaborations;

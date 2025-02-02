import CollaborationList from "@/components/collaborations/Collaborations";
import { View } from "@/components/theme/Themed";
import AppLayout from "@/layouts/app-layout";
import TopTabNavigation from "../ui/top-tab-navigation";

const tabs = [
  {
    id: "Active",
    title: "Active",
    component: <CollaborationList key={"active"} active={true} />,
  },
  {
    id: "Past",
    title: "Past",
    component: <CollaborationList key={"inactive"} active={false} />,
  },
];

const Collaborations = () => {
  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          paddingVertical: 16,
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

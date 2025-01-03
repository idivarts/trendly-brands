import { View } from "@/components/theme/Themed";
import AppLayout from "@/layouts/app-layout";
import Applications from "@/components/proposals/Applications";
import Invitations from "@/components/proposals/Invitations";
import TopTabNavigation from "@/components/ui/top-tab-navigation";
import ActiveContracts from "@/components/contracts/active";
import PastContracts from "@/components/contracts/past";

const tabs = [
  {
    id: "Active",
    title: "Active",
    component: <ActiveContracts />,
  },
  {
    id: "Past",
    title: "Past",
    component: <PastContracts />,
  },
];

const Contracts = () => {
  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          paddingTop: 16,
        }}
      >
        <TopTabNavigation tabs={tabs} />
      </View>
    </AppLayout>
  );
};

export default Contracts;

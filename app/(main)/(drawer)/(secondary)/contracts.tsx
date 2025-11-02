import ActiveContracts from "@/components/contracts/active";
import PastContracts from "@/components/contracts/past";
import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import TopTabNavigation from "@/components/ui/top-tab-navigation";
import AppLayout from "@/layouts/app-layout";

const tabs = [
  {
    id: "Active",
    title: "Active Jerry",
    component: <ActiveContracts />,
  },
  {
    id: "Past",
    title: "Past Jerry",
    component: <PastContracts />,
  },
];

const Contracts = () => {
  return (
    <AppLayout>
      <ScreenHeader title="Contracts Jerry" />
      <View
        style={{
          flex: 1,
          // paddingTop: 16,
        }}
      >
        <TopTabNavigation tabs={tabs} />
      </View>
    </AppLayout>
  );
};

export default Contracts;

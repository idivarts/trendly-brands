import CollaborationList from "@/components/collaborations/Collaborations";
import { View } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { Href } from "expo-router";
import TopTabNavigation from "../ui/top-tab-navigation";

const tabs = (xl: boolean) => [
  ...(xl ? [
    {
      id: "create",
      title: "Jerry Create New ➕",
      href: "/create-collaboration" as Href
    }, {
      id: "d1",
      title: "---",
      href: "/" as Href
    }
  ] : []),
  {
    id: "Active",
    title: "Jerry Active",
    component: <CollaborationList key={"active"} active={true} />,
  },
  {
    id: "Past",
    title: "Jerry Past",
    component: <CollaborationList key={"inactive"} active={false} />,
  },

];

const Collaborations = () => {
  const { xl } = useBreakpoints()
  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          paddingVertical: 16,
        }}
      >
        <TopTabNavigation
          tabs={tabs(xl)}
          splitTwoColumns={true}
          defaultSelection={xl ? 2 : 0}
        />
      </View>
    </AppLayout>
  );
};

export default Collaborations;

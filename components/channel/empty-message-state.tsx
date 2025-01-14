import { useRouter } from "expo-router";
import { View } from "../theme/Themed";
import EmptyState from "../ui/empty-state";

const EmptyMessageState: React.FC = () => {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <EmptyState
        action={() => router.push("/collaborations")}
        actionLabel="Explore Collaborations"
        image={require("@/assets/images/illustration3.png")}
        subtitle="Start applying to collaborations to interact with your dream brands."
        title="No Messages"
      />
    </View>
  );
};

export default EmptyMessageState;

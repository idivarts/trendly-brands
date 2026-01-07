import AppLayout from "@/layouts/app-layout";
import { useRouter } from "expo-router";
import { Text, View } from "../theme/Themed";
import EmptyState from "../ui/empty-state";

const Contracts = () => {
    const contracts = [];
    const router = useRouter();

    return (
        <AppLayout>
            {
                contracts.length === 0 ? (
                    <EmptyState
                        action={() => router.push("/collaborations")}
                        actionLabel="Start Applying"
                        image={require("@/assets/images/illustration4.png")}
                        subtitle="Opps! No Contracts has been created yet. Start applying to collaboration to get contracts."
                        title="No Contracts"
                    />
                ) : (
                    <View>
                        <Text>Contracts</Text>
                    </View>
                )
            }
        </AppLayout>
    );
};

export default Contracts;

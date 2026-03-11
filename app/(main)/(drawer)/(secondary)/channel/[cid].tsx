import ChannelNative from "@/components/channel/channel";
import AppLayout from "@/layouts/app-layout";

const ChannelScreen = () => {
    return (
        <AppLayout safeAreaEdges={["top", "right", "bottom", "left"]}>
            <ChannelNative />
        </AppLayout>
    );
}

export default ChannelScreen;

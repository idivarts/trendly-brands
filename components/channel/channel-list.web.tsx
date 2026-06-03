import { useAuthContext } from "@/contexts";
import { useChatContext } from "@/contexts/chat-context.provider";
import AppLayout from "@/layouts/app-layout";
import WebMessageWrapper from "@/shared-libs/contexts/web-message-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { View } from "../theme/Themed";
import PageHeader from "../ui/page-header";
import EmptyMessageState from "./empty-message-state";

const ChannelListWeb = () => {
    const [loading, setLoading] = useState(true)
    const [token, setToken] = useState("")
    const theme = useTheme()
    const { manager } = useAuthContext()
    const { connectUser } = useChatContext()

    const fetchToken = async () => {
        setLoading(true)
        const token = await connectUser()
        if (token) {
            setToken(token)
        }
        setLoading(false)
    }


    useEffect(() => {
        if (manager)
            fetchToken()
    }, [manager])

    let content = null;
    if (loading) {
        content = <AppLayout>
            <View style={{ flex: 1, alignItems: "center", padding: 24 }}>
                <ActivityIndicator color={Colors(theme).primary} />
            </View>
        </AppLayout>
    }
    if (!token) {
        content = <EmptyMessageState />
    } else {
        content = <WebMessageWrapper
            isInfluencer={false}
            influencerManagerid={manager?.id || ""}
            streamToken={token}
        />
    }
    return <AppLayout>
        <PageHeader title="Messages" />
        {content}
    </AppLayout>;
};

export default ChannelListWeb;

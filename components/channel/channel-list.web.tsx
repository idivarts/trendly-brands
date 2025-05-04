import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { useChatContext } from "@/contexts/chat-context.provider";
import AppLayout from "@/layouts/app-layout";
import WebMessageWrapper from "@/shared-libs/contexts/web-message-wrapper";
import { useTheme } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { View } from "../theme/Themed";
import EmptyMessageState from "./empty-message-state";

const ChannelListWeb = () => {
  const [loading, setLoading] = useState(true)
  const [iFrameLoaded, setIFrameLoaded] = useState(false)
  const iFramRef = useRef<HTMLIFrameElement>(null)
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

  if (loading) {
    return <AppLayout>
      <View style={{ flex: 1, alignItems: "center", padding: 24 }}>
        <ActivityIndicator color={Colors(theme).primary} />
      </View>
    </AppLayout>
  }
  if (!token) {
    return <EmptyMessageState />
  }
  return (
    <WebMessageWrapper iFrameLoaded={iFrameLoaded} iFrameRef={iFramRef}>
      <iframe
        ref={iFramRef}
        src={`/messenger/index.html?user=${manager?.id}&user_token=${token}&target_origin=${window.location.origin}&skip_name_image_set=false&no_channel_name_filter=false`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        onLoad={() => {
          setIFrameLoaded(true)
        }}
      />
    </WebMessageWrapper>
  );
};

export default ChannelListWeb;

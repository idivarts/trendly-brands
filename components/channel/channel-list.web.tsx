import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { useChatContext } from "@/contexts/chat-context.provider";
import AppLayout from "@/layouts/app-layout";
import { IMessengerData } from "@/shared-libs/messenger/interfaces/message-interface";
import { useIsFocused, useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment, useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { View } from "../theme/Themed";
import EmptyMessageState from "./empty-message-state";

const ChannelListWeb = () => {
  const [loading, setLoading] = useState(true)
  const [iFrameLoaded, setIFrameLoaded] = useState(false)
  const iFramRef = useRef<HTMLIFrameElement>(null)
  const [token, setToken] = useState("")
  const theme = useTheme()
  const router = useRouter()
  const { manager } = useAuthContext()
  const { connectUser } = useChatContext()
  const { channelId } = useLocalSearchParams()
  const isFocused = useIsFocused()

  const fetchToken = async () => {
    setLoading(true)
    const token = await connectUser()
    if (token) {
      setToken(token)
    }
    setLoading(false)
  }

  useEffect(() => {
    window.addEventListener('message', function (event) {
      console.log("Received event from ifram");
      const mData: IMessengerData = event.data;
      if (mData.type == "open-contract") {
        const contractId = mData.data
        router.push(`/contract-details/${contractId}`);
      }
    });
  }, [])

  useEffect(() => {
    if (channelId && (iFrameLoaded || isFocused)) {
      const mData: IMessengerData = {
        type: "open-channel",
        data: channelId
      }
      iFramRef.current?.contentWindow?.postMessage(mData)
    }
  }, [channelId, iFrameLoaded, isFocused])

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
  const url = `/messenger?user=${manager?.id}&user_token=${token}&target_origin=${window.location.origin}&skip_name_image_set=false&no_channel_name_filter=false`
  // console.log("Messenger path", url);
  return (
    <Fragment>
      <iframe
        ref={iFramRef}
        src={`/messenger/index.html?user=${manager?.id}&user_token=${token}&target_origin=${window.location.origin}&skip_name_image_set=false&no_channel_name_filter=false`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        onLoad={() => {
          setIFrameLoaded(true)
        }}
      />
    </Fragment>
  );
};

export default ChannelListWeb;

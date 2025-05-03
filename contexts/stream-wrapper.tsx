import { useStreamTheme } from "@/hooks";
import { useTheme } from "@react-navigation/native";

import React, {
    FC,
    PropsWithChildren,
    useEffect,
    useState
} from 'react';
import { Chat, OverlayProvider } from "stream-chat-expo";

import { streamClient } from './chat-context.provider';

const StreamWrapper: FC<PropsWithChildren> = ({ children }) => {
    const theme = useTheme();
    const { getTheme } = useStreamTheme(theme);

    const [streamChatTheme, setStreamChatTheme] = useState(getTheme());

    useEffect(() => {
        setStreamChatTheme(getTheme());
    }, [theme]);

    return (
        <OverlayProvider value={{ style: streamChatTheme }}>
            <Chat client={streamClient}>
                {children}
            </Chat>
        </OverlayProvider>
    )
}

export default StreamWrapper
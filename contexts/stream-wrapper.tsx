import { useStreamTheme } from "@/hooks";
import { useTheme } from "@react-navigation/native";

import {
    FC,
    PropsWithChildren,
    useEffect,
    useState
} from 'react';


const StreamWrapper: FC<PropsWithChildren> = ({ children }) => {
    const theme = useTheme();
    const { getTheme } = useStreamTheme(theme);

    const [streamChatTheme, setStreamChatTheme] = useState(getTheme());

    useEffect(() => {
        setStreamChatTheme(getTheme());
    }, [theme]);

    return (
        // <OverlayProvider value={{ style: streamChatTheme }}>
        //     <Chat client={streamClient}>
        //         {children}
        //     </Chat>
        // </OverlayProvider>
        children
    )
}

export default StreamWrapper
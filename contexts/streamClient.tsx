import { StreamChat } from "stream-chat";

export const streamClient = StreamChat.getInstance(
    process.env.EXPO_PUBLIC_STREAM_API_KEY!
);

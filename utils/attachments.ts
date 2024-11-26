import { MediaItem } from "@/components/ui/carousel/render-media-item";
import { Platform } from "react-native";

export const processRawAttachment = (attachment: any): MediaItem => {
  if (attachment.type.includes("video")) {
    if (Platform.OS === "ios") {
      return {
        type: attachment.type,
        url: attachment.appleUrl,
      };
    } else {
      return {
        type: attachment.type,
        url: attachment.playUrl,
      };
    }
  } else if (attachment.type.includes("image")) {
    return {
      type: attachment.type,
      url: attachment.imageUrl,
    };
  } else {
    return {
      type: "file",
      url: attachment.url,
    };
  }
};

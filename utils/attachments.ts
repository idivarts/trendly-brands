import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { MediaItem } from "@/types/Media";
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
  } else if (attachment.type.includes("reel")) {
    return {
      type: attachment.type,
      url: attachment.imageUrl,
      redirectLink: attachment.playUrl,
    };
  } else {
    return {
      type: "file",
      url: attachment.url,
    };
  }
};

export const processAttachments = (attachments: any[]): Attachment[] => {
  const processedAttachments = attachments.map((attachment) => {
    if (attachment.type.includes("video")) {
      if (Platform.OS === "ios") {
        return {
          type: attachment.type,
          appleUrl: attachment.url,
        };
      } else {
        return {
          type: attachment.type,
          playUrl: attachment.url,
        };
      }
    } else if (attachment.type.includes("image")) {
      return {
        type: attachment.type,
        imageUrl: attachment.url,
      };
    } else {
      return {
        type: attachment.type,
        url: attachment.url,
      };
    }
  });

  return processedAttachments;
};

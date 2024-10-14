import { Analytics, logEvent } from "firebase/analytics";
import analyticsWeb from "./analytics-web";
import analytics from "@react-native-firebase/analytics";
import { Platform } from "react-native";

export const analyticsLogEvent = async (
  eventName: string,
  eventParams: Record<string, any>
) => {
  if (Platform.OS === "web") {
    logEvent(analyticsWeb as Analytics, eventName, eventParams);
  } else {
    await analytics().logEvent(eventName, eventParams);
  }
};

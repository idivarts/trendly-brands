import { Analytics, getAnalytics } from "firebase/analytics";
import { FirebaseApp } from "./firebase";
import { Platform } from "react-native";

let analyticsWeb: Analytics | null = null;

if (Platform.OS === "web") {
  analyticsWeb = getAnalytics(FirebaseApp);
}

export default analyticsWeb;

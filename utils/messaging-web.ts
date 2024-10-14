import { getMessaging, getToken } from "firebase/messaging";
import { FirebaseApp } from "./firebase";

const messaging = getMessaging(FirebaseApp);

export { getToken, messaging };

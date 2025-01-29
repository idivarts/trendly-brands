import { getMessaging, getToken, deleteToken } from "firebase/messaging";
import { FirebaseApp } from "./firebase";

const messaging = getMessaging(FirebaseApp);

export { deleteToken, getToken, messaging };

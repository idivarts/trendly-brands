import { getApp, getApps, initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase-config";

const FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export { FirebaseApp, firebaseConfig };


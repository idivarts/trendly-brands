//@ts-nocheck
import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { FirebaseApp } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

if (!FirebaseApp) {
  throw new Error("Firebase app is not initialized");
}

const AuthApp =
  Platform.OS === "web"
    ? initializeAuth(FirebaseApp, { persistence: browserLocalPersistence })
    : initializeAuth(FirebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export { AuthApp };

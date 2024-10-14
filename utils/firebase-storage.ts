import { getStorage } from "firebase/storage";
import { FirebaseApp } from "./firebase";

const StorageApp = getStorage(FirebaseApp);

export { StorageApp };

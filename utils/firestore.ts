import { getFirestore } from "firebase/firestore";
import { FirebaseApp } from "./firebase";

const FirestoreDB = getFirestore(FirebaseApp);

export { FirestoreDB };

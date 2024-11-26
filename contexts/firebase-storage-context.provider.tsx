import {
  useContext,
  createContext,
  type PropsWithChildren,
} from "react";

import {
  ref,
  uploadString,
  getDownloadURL,
  uploadBytes,
} from "firebase/storage";
import { StorageApp } from "@/utils/firebase-storage";

interface FirebaseStorageContextProps {
  uploadImage: (image: string, path: string) => Promise<string>;
  uploadImageBytes: (blob: Blob, path: string) => Promise<string>;
}

const FirebaseStorageContext = createContext<FirebaseStorageContextProps>(null!);

export const useFirebaseStorageContext = () => useContext(FirebaseStorageContext);

export const FirebaseStorageContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const uploadImage = async (
    image: string,
    path: string,
    format: "base64" | "base64url" | "data_url" | "raw" = "data_url",
  ): Promise<string> => {
    const storageRef = ref(StorageApp, path);
    await uploadString(storageRef, image, format);

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  }

  const uploadImageBytes = async (
    blob: Blob,
    path: string,
  ): Promise<string> => {
    const storageRef = ref(StorageApp, path);
    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  }

  return (
    <FirebaseStorageContext.Provider
      value={{
        uploadImage,
        uploadImageBytes,
      }}
    >
      {children}
    </FirebaseStorageContext.Provider>
  );
};
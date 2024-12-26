import { AuthApp } from "@/utils/auth";
import {
  useContext,
  createContext,
  type PropsWithChildren,
  useState,
} from "react";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { AssetItem, NativeAssetItem, WebAssetItem } from "@/types/Asset";

interface AWSContextProps {
  getBlob: (fileUri: any) => Promise<Blob>;
  processMessage: string;
  processPercentage: number;
  setProcessMessage: (message: string) => void;
  setProcessPercentage: (percentage: number) => void;
  uploadFile: (file: File) => Promise<any>;
  uploadFiles: (files: File[]) => Promise<any[]>;
  uploadFileUri: (fileUri: AssetItem) => Promise<any>;
  uploadFileUris: (fileUris: AssetItem[]) => Promise<any[]>;
  uploadNewAssets: (
    attachments: any[],
    nativeAssets: NativeAssetItem[],
    webAssets: WebAssetItem[],
  ) => Promise<any[]>;
}

const AWSContext = createContext<AWSContextProps>({
  getBlob: async () => new Blob(),
  processMessage: "",
  processPercentage: 0,
  setProcessMessage: () => { },
  setProcessPercentage: () => { },
  uploadFile: async () => { },
  uploadFiles: async () => [],
  uploadFileUri: async () => { },
  uploadFileUris: async () => [],
  uploadNewAssets: async () => [],
});

export const useAWSContext = () => useContext(AWSContext);

export const AWSContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [processMessage, setProcessMessage] = useState<string>("");
  const [processPercentage, setProcessPercentage] = useState<number>(0);

  const preUploadRequestUrl = (file: File | AssetItem): string => {
    const date = new Date().getTime();
    const baseUrl = 'https://be.trendly.pro/s3/v1/';
    const type = file.type.includes("video") ? "videos" : "images";
    let filename: string = '';

    if (Platform.OS === "web") {
      filename = `${date}.${file.type.split("/")[1]}`;
    } else {
      filename = `${date}.${type === 'videos' ? 'mp4' : 'jpg'}`;
    }

    return `${baseUrl}${type}?filename=${filename}`;
  }

  const getFileUrlFromPhotoUri = async (uri: string): Promise<string> => {
    if (Platform.OS !== "ios") return uri;

    if (uri.startsWith("ph://")) {
      try {
        // Extract asset ID from ph:// URI
        const assetId = uri.replace("ph://", "");
        const asset = await MediaLibrary.getAssetInfoAsync(assetId);

        if (!asset?.localUri) {
          throw new Error("Could not get local URI for video");
        }

        return asset.localUri;
      } catch (error) {
        console.error("Error converting ph:// URI:", error);
        throw new Error("Failed to access video file");
      }
    }

    return uri;
  };

  const getBlob = async (fileUri: AssetItem): Promise<Blob> => {
    if (fileUri.type === "video") {
      const videoInfo = await FileSystem.getInfoAsync(fileUri.localUri);
      if (!videoInfo.exists) {
        throw new Error("Video file does not exist");
      }

      const response = await fetch(fileUri.localUri);
      const blob = await response.blob();

      return blob;
    } else {
      const response = await fetch(fileUri.uri);
      const blob = await response.blob();

      return blob;
    }
  }

  const uploadFileUri = async (fileUri: AssetItem): Promise<any> => {
    const preUploadUrlResponse = await fetch(
      preUploadRequestUrl(fileUri),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AuthApp.currentUser?.uid}`,
        },
      }
    );

    const preUploadUrl = await preUploadUrlResponse.json();

    const uploadUrl = preUploadUrl.uploadUrl;

    const blob = await getBlob(fileUri);

    const response = await fetch(
      uploadUrl,
      {
        method: "PUT",
        headers: {
          "Content-Type": fileUri.type, // "image/jpeg" or "video/mp4"
        },
        body: blob,
      },
    );

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    if (fileUri.type.includes("video")) {
      return {
        appleUrl: preUploadUrl.appleUrl,
        playUrl: preUploadUrl.playUrl,
        type: "video",
      };
    } else {
      return {
        imageUrl: preUploadUrl.imageUrl,
        type: "image",
      };
    }
  }

  const uploadFileUris = async (
    fileUris: AssetItem[],
  ): Promise<any[]> => {
    try {
      const uploadedFiles: any[] = [];
      const totalProgress = 100 / fileUris.length;

      for (const [index, fileUri] of fileUris.entries()) {
        setProcessMessage(`Uploading asset ${index + 1}`);
        const result = await uploadFileUri(fileUri);
        setProcessPercentage((prev) => Math.ceil(Math.round((prev + totalProgress))));
        uploadedFiles.push(result);
      }

      setProcessMessage("Uploaded Successfully - Processing files");
      setProcessPercentage(100);

      return uploadedFiles;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to upload files");
    }
  }

  const uploadFile = async (file: File): Promise<any> => {
    try {
      const preUploadUrlResponse = await fetch(
        preUploadRequestUrl(file),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AuthApp.currentUser?.uid}`,
          },
        },
      );

      const preUploadUrl = await preUploadUrlResponse.json();

      const response = await fetch(
        preUploadUrl.uploadUrl,
        {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      if (file.type.includes("video")) {
        return {
          appleUrl: preUploadUrl.appleUrl,
          playUrl: preUploadUrl.playUrl,
          type: "video",
        };
      } else {
        return {
          imageUrl: preUploadUrl.imageUrl,
          type: "image",
        };
      }
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error("Failed to upload file");
    }
  }

  const uploadFiles = async (
    files: File[],
  ): Promise<any[]> => {
    try {
      const uploadedFiles: any[] = [];
      const totalProgress = 100 / files.length;

      for (const file of files) {
        setProcessMessage(`Uploading ${file.name}`);
        const result = await uploadFile(file);
        setProcessPercentage((prev) => Math.ceil(Math.round((prev + totalProgress))));
        uploadedFiles.push(result);
      }

      setProcessMessage("Uploaded Successfully - Processing files");
      setProcessPercentage(100);

      return uploadedFiles;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to upload files");
    }
  };

  const uploadNewAssets = async (
    attachments: any[],
    nativeAssets: NativeAssetItem[],
    webAssets: WebAssetItem[],
  ): Promise<any[]> => {
    let uploadedAssets = [];

    if (Platform.OS === 'web') {
      for (const asset of webAssets) {
        if (typeof asset.url === 'string' && asset.url.includes('http')) {
          const attachment = attachments.find(attachment => (
            asset.url === attachment.imageUrl || asset.url === attachment.playUrl || asset.url === attachment.appleUrl
          ));

          uploadedAssets.push(attachment);
        } else if (asset.url instanceof File) {
          const uploadAsset = await uploadFile(asset.url as File);

          uploadedAssets.push(uploadAsset);
        } else {
          continue;
        }
      };
    } else {
      const filteredAssets = nativeAssets.filter(asset => asset.url !== '');
      for (const asset of filteredAssets) {
        if (asset.url.includes('http')) {
          const attachment = attachments.find(attachment => (
            asset.url === attachment.imageUrl || asset.url === attachment.playUrl || asset.url === attachment.appleUrl
          ));

          uploadedAssets.push(attachment);
        } else if (asset.type === 'video') {
          const uploadAsset = await uploadFileUri({
            id: asset.url,
            type: 'video',
            localUri: asset.url,
            uri: asset.url,
          });

          uploadedAssets.push(uploadAsset);
        } else {
          const uploadAsset = await uploadFileUri({
            id: asset.url,
            type: 'image',
            localUri: asset.url,
            uri: asset.url,
          });

          uploadedAssets.push(uploadAsset);
        }
      };
    }

    return uploadedAssets;
  }

  return (
    <AWSContext.Provider
      value={{
        getBlob,
        processMessage,
        processPercentage,
        setProcessMessage,
        setProcessPercentage,
        uploadFile,
        uploadFiles,
        uploadFileUri,
        uploadFileUris,
        uploadNewAssets,
      }}
    >
      {children}
    </AWSContext.Provider>
  );
};

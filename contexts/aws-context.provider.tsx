import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { AssetItem, NativeAssetItem, WebAssetItem } from "@/types/Asset";
import { HttpWrapper } from "@/utils/http-wrapper";
import * as FileSystem from "expo-file-system";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { Platform } from "react-native";
import { Subject } from "rxjs";

interface SubjectInterface { index: number, percentage: number }
interface AWSContextProps {
  getBlob: (fileUri: any) => Promise<Blob>;
  processMessage: string;
  processPercentage: number;
  setProcessMessage: (message: string) => void;
  setProcessPercentage: (percentage: number) => void;
  uploadFile: (file: File) => Promise<any>;
  uploadFiles: (files: File[]) => Promise<any[]>;
  uploadFileUri: (fileUri: AssetItem) => Promise<Attachment>;
  uploadFileUris: (fileUris: AssetItem[]) => Promise<Attachment[]>;
  uploadAttachment: (file: AssetItem) => Promise<any>;
  uploadAttachments: (attachment: AssetItem[]) => Promise<any>;
  uploadNewAssets: (
    attachments: any[],
    nativeAssets: NativeAssetItem[],
    webAssets: WebAssetItem[],
  ) => Promise<any[]>;
}

export const AWSProgressUpdateSubject = new Subject<{
  index?: number,
  id?: number,
  percentage: number
}>()
const AWSContext = createContext<AWSContextProps>(null!);

export const useAWSContext = () => useContext(AWSContext);

export const AWSContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [processMessage, setProcessMessage] = useState<string>("");
  const [processPercentage, setProcessPercentage] = useState<number>(0);

  const preUploadRequestUrl = (file: File | AssetItem): string => {
    const date = new Date().getTime();
    const baseUrl = "/s3/v1/";
    const type = file.type.includes("video") ? "videos" : "images";
    let filename: string = "";

    if (Platform.OS === "web") {
      filename = `${date}.${file.type.split("/")[1]}`;
    } else {
      filename = `${date}.${type === "videos" ? "mp4" : "jpg"}`;
    }

    return `${baseUrl}${type}?filename=${filename}`;
  };

  const preUploadRequestUrlForAttachment = (file: File | AssetItem): string => {
    const date = new Date().getTime();
    const baseUrl = "/s3/v1/";
    let filename: string = "";

    if (Platform.OS === "web") {
      filename = `${date}.${file.type.split("/")[1]}`;
    } else {
      filename = `${date}.${`pdf`}`;
    }

    return `${baseUrl}${`attachments`}?filename=${filename}`;
  };

  const progressUpload = async (uploadUrl: string, fileType: string, blobOrFile: Blob | File, index?: number, communicatePercentage?: Subject<SubjectInterface>, startPercentage = 10) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", fileType);
      // Monitor upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          let percentCompleted = (event.loaded / event.total) * 100;
          console.log(`Upload Progress: ${index} : ${percentCompleted.toFixed(2)}%`);
          if (communicatePercentage && index !== undefined) {
            communicatePercentage.next({ index: index, percentage: startPercentage + (percentCompleted * (100 - startPercentage) / 100) });
          }
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setTimeout(() => {
            resolve(xhr.responseText);
          }, 500);
        } else {
          reject(`Upload failed with status ${xhr.status}`);
        }
      };

      xhr.onerror = () => {
        reject("Upload failed due to network error.");
      };

      // Prepare FormData
      // const formData = new FormData();
      // formData.append("file", blobOrFile);

      xhr.send(blobOrFile);
    });
  };

  // // Usage
  // const fileUri = "file:///path-to-your-file";
  // const uploadUrl = "https://your-server.com/upload";

  // uploadFile(fileUri, uploadUrl)
  //   .then((response) => console.log("Upload success:", response))
  //   .catch((error) => console.error("Upload error:", error));

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
  };

  const uploadFileUri = async (fileUri: AssetItem, subject?: { index: number, subject: Subject<SubjectInterface> }): Promise<Attachment> => {
    const preUploadUrlResponse = await HttpWrapper.fetch(preUploadRequestUrl(fileUri), { method: "POST" });

    subject?.subject.next({ index: subject.index, percentage: 10 })

    const preUploadUrl = await preUploadUrlResponse.json();

    const uploadUrl = preUploadUrl.uploadUrl;

    const blob = await getBlob(fileUri);

    // const response = await fetch(uploadUrl, {
    //   method: "PUT",
    //   headers: {
    //     "Content-Type": fileUri.type, // "image/jpeg" or "video/mp4"
    //   },
    //   body: blob,
    // });

    await progressUpload(uploadUrl, fileUri.type, blob, subject?.index, subject?.subject);

    // if (!response.ok) {
    //   throw new Error("Failed to upload file");
    // }

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
  };

  const uploadFileUris = async (fileUris: AssetItem[]): Promise<Attachment[]> => {
    try {
      const uploadedFiles: Promise<Attachment>[] = [];
      const totalProgress = 100 / fileUris.length;

      // setProcessPercentage(0);
      const subject = new Subject<SubjectInterface>();
      const percentageArray = Array.from({ length: fileUris.length }, (_, i) => 0)
      subject.subscribe(({ index, percentage }) => {
        percentageArray[index] = percentage
        const totalPercentage = percentageArray.reduce((acc, cur) => acc + cur, 0)
        AWSProgressUpdateSubject.next({ percentage: totalPercentage / fileUris.length })
      })

      for (const [index, fileUri] of fileUris.entries()) {
        // setProcessMessage(`Uploading asset ${index + 1}`);
        const result = uploadFileUri(fileUri, { index, subject });
        // setProcessPercentage((prev) =>
        //   Math.ceil(Math.round(prev + totalProgress))
        // );
        uploadedFiles.push(result);
      }
      const files = await Promise.all(uploadedFiles)
      // setProcessMessage("Uploaded Successfully - Processing files");
      // setProcessPercentage(100);

      return files;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to upload files");
    }
  };

  const uploadFile = async (file: File, subject?: { index: number, subject: Subject<SubjectInterface> }): Promise<Attachment> => {
    try {
      const preUploadUrlResponse = await HttpWrapper.fetch(preUploadRequestUrl(file), { method: "POST" });
      subject?.subject.next({ index: subject.index, percentage: 10 })
      const preUploadUrl = await preUploadUrlResponse.json();

      // const response = await fetch(preUploadUrl.uploadUrl, {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": file.type,
      //   },
      //   body: file,
      // });

      await progressUpload(preUploadUrl.uploadUrl, file.type, file, subject?.index, subject?.subject);

      // if (!response.ok) {
      //   throw new Error("Failed to upload file");
      // }

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
  };

  const uploadFiles = async (files: File[]): Promise<any[]> => {
    try {
      const uploadedFiles: Promise<any>[] = [];
      const totalProgress = 100 / files.length;
      // setProcessPercentage(0);
      const subject = new Subject<SubjectInterface>();
      const percentageArray = Array.from({ length: files.length }, (_, i) => 0)
      subject.subscribe(({ index, percentage }) => {
        percentageArray[index] = percentage
        const totalPercentage = percentageArray.reduce((acc, cur) => acc + cur, 0)
        AWSProgressUpdateSubject.next({ percentage: totalPercentage / files.length })
      })

      for (const [index, file] of files.entries()) {
        // setProcessMessage(`Uploading ${file.name}`);
        const result = uploadFile(file, { index: index, subject });
        // setProcessPercentage((prev) =>
        //   Math.ceil(Math.round(prev + totalProgress))
        // );
        uploadedFiles.push(result);
      }
      const mfiles = await Promise.all(uploadedFiles)

      // setProcessMessage("Uploaded Successfully - Processing files");
      // setProcessPercentage(100);

      return mfiles;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to upload files");
    }
  };

  const uploadAttachment = async (file: AssetItem): Promise<any> => {
    try {
      const preUploadUrlResponse = await HttpWrapper.fetch(preUploadRequestUrlForAttachment(file), { method: "POST", });

      const preUploadUrl = await preUploadUrlResponse.json();

      const responseFile = await fetch(file.uri);
      const blob = await responseFile.blob();

      const response = await fetch(preUploadUrl.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: blob,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      return {
        url: preUploadUrl.attachmentUrl,
        type: "attachment",
        name: file.id,
      };
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error("Failed to upload file");
    }
  };

  const uploadAttachments = async (attachment: AssetItem[]): Promise<any> => {
    try {
      const uploadedFiles: Promise<any>[] = [];
      const totalProgress = 100 / attachment.length;
      setProcessPercentage(0);

      for (const file of attachment) {
        setProcessMessage(`Uploading ${file.id}`);
        const result = uploadAttachment(file);
        setProcessPercentage((prev) =>
          Math.ceil(Math.round(prev + totalProgress))
        );
        uploadedFiles.push(result);
      }
      const allFiles = await Promise.all(uploadedFiles)

      setProcessMessage("Uploaded Successfully - Processing files");
      setProcessPercentage(100);

      return allFiles;
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
    let allAttachments: Promise<any>[] = []
    if (Platform.OS === 'web') {
      for (const asset of webAssets) {
        if (typeof asset.url === 'string' && asset.url.includes('http')) {
          const attachment = attachments.find(attachment => (
            asset.url === attachment.imageUrl || asset.url === attachment.playUrl || asset.url === attachment.appleUrl
          ));
          allAttachments.push(attachment)
        } else if (asset.url instanceof File) {
          const uploadAsset = uploadFile(asset.url as File);
          allAttachments.push(uploadAsset)
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
          allAttachments.push(attachment);
        } else if (asset.type === 'video') {
          const uploadAsset = uploadFileUri({
            id: asset.url,
            type: 'video',
            localUri: asset.url,
            uri: asset.url,
          });

          allAttachments.push(uploadAsset);
        } else {
          const uploadAsset = uploadFileUri({
            id: asset.url,
            type: 'image',
            localUri: asset.url,
            uri: asset.url,
          });

          allAttachments.push(uploadAsset);
        }
      };
    }
    const uploadedAssets = await Promise.all(allAttachments)
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
        uploadAttachment,
        uploadAttachments,
        uploadNewAssets,
      }}
    >
      {children}
    </AWSContext.Provider>
  );
};

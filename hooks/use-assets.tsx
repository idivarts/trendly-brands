import { NativeAssetItem, WebAssetItem } from "@/types/Asset";
import { processAttachments } from "@/utils/attachments";
import { useState } from "react";

interface useAssetsType {
  attachments: any[];
  handleAssetsUpdateNative: (items: NativeAssetItem[]) => void;
  handleAssetsUpdateWeb: (items: WebAssetItem[]) => void;
  nativeAssets: NativeAssetItem[];
  setAttachments: (attachments: any[]) => void;
  webAssets: WebAssetItem[];
};

const useAssets = (): useAssetsType => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [nativeAssets, setNativeAssets] = useState<NativeAssetItem[]>([]);
  const [webAssets, setWebAssets] = useState<WebAssetItem[]>([]);

  const handleAssetsUpdateNative = (items: NativeAssetItem[]) => {
    setNativeAssets(items);
    setAttachments(processAttachments(items));
  }

  const handleAssetsUpdateWeb = (items: WebAssetItem[]) => {
    setWebAssets(items);
    setAttachments(processAttachments(items));
  }

  return {
    attachments,
    handleAssetsUpdateNative,
    handleAssetsUpdateWeb,
    nativeAssets,
    setAttachments,
    webAssets,
  }
};

export default useAssets;

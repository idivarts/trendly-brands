import { NativeAssetItem, WebAssetItem } from "@/types/Asset";
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
  }

  const handleAssetsUpdateWeb = (items: WebAssetItem[]) => {
    setWebAssets(items);
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

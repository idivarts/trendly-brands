export interface AssetItem {
  id: string;
  localUri: string;
  type: string;
  uri: string;
}

export interface NativeAssetItem {
  type: string;
  url: string;
}

export interface WebAssetItem {
  id?: string;
  type: string;
  url: string | File;
}

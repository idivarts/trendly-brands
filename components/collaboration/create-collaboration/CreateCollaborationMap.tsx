import { useEffect, useState } from "react";
import { Platform } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { APIProvider } from "@vis.gl/react-google-maps";

import Map from "@/components/map";
import { View } from "@/components/theme/Themed";
import stylesFn from "@/styles/modal/UploadModal.styles";
import { useTheme } from "@react-navigation/native";
import { fetchMapRegionAddress } from "@/utils/map";

interface CreateCollaborationMapProps {
  mapRegion: any;
  onMapRegionChange?: (region: any) => void;
  onFormattedAddressChange?: (address: string) => void;
}

const CreateCollaborationMap: React.FC<CreateCollaborationMapProps> = ({
  mapRegion,
  onMapRegionChange,
  onFormattedAddressChange,
}) => {
  const [nativeMapRegion, setNativeMapRegion] = useState(mapRegion);

  const [webMapRegion, setWebMapRegion] = useState(mapRegion);

  const theme = useTheme();
  const styles = stylesFn(theme);

  const onWebLocationChange = async (
    location: { latitude: number; longitude: number },
  ) => {
    setWebMapRegion(location);

    const address = await fetchMapRegionAddress(
      location.latitude,
      location.longitude
    );

    if (onFormattedAddressChange) {
      onFormattedAddressChange(address as string);
    }
  };

  const onNativeLocationChange = async (region: Region) => {
    setNativeMapRegion(region);

    const address = await fetchMapRegionAddress(
      region.latitude,
      region.longitude
    );

    if (onFormattedAddressChange) {
      onFormattedAddressChange(address as string);
    }
  }

  useEffect(() => {
    if (Platform.OS === 'web') {
      setWebMapRegion(mapRegion);
    } else {
      setNativeMapRegion(mapRegion);
    }
  }, [mapRegion]);

  if (Platform.OS === 'web') {
    return (
      <APIProvider
        apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
      >
        <Map
          location={webMapRegion}
          onLocationChange={onWebLocationChange}
        />
      </APIProvider>
    );
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        region={nativeMapRegion}
        onRegionChangeComplete={onNativeLocationChange}
      >
        <Marker coordinate={nativeMapRegion} />
      </MapView>
    </View>
  )
};

export default CreateCollaborationMap;

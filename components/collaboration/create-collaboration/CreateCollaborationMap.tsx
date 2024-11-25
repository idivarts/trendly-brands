import { useEffect, useState } from "react";
import { Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { APIProvider } from "@vis.gl/react-google-maps";

import Map from "@/components/map";
import { View } from "@/components/theme/Themed";
import stylesFn from "@/styles/modal/UploadModal.styles";
import { useTheme } from "@react-navigation/native";

interface CreateCollaborationMapProps {
  mapRegion: any;
  onMapRegionChange: (region: any) => void;
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

  const fetchMapRegionAddress = async (
    lat: number,
    lng: number
  ) => {
    if (!lat || !lng) {
      return;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    const result = await response.json();

    const address = result?.results?.[0]?.formatted_address || result?.plus_code?.compound_code || 'Address';

    return address;
  };

  const onLocationChange = async (
    location: { latitude: number; longitude: number },
  ) => {
    setWebMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    const address = await fetchMapRegionAddress(
      location.latitude,
      location.longitude
    );

    if (onFormattedAddressChange) {
      onFormattedAddressChange(address as string);
    }
  };

  const onMapLocationChange = async (region: any) => {
    onMapRegionChange({
      latitude: region.latitude,
      longitude: region.longitude,
    });

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
      onMapLocationChange(webMapRegion);
    } else {
      onMapLocationChange(nativeMapRegion);
    }
  }, [nativeMapRegion, webMapRegion]);

  if (Platform.OS === 'web') {
    return (
      <APIProvider
        apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
      >
        <Map
          location={webMapRegion}
          onLocationChange={onLocationChange}
        />
      </APIProvider>
    );
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        region={nativeMapRegion}
        onRegionChangeComplete={(region) => setNativeMapRegion(region)}
      >
        <Marker coordinate={nativeMapRegion} />
      </MapView>
    </View>
  )
};

export default CreateCollaborationMap;

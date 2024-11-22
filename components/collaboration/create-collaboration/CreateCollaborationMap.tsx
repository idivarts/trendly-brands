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
}

const CreateCollaborationMap: React.FC<CreateCollaborationMapProps> = ({
  mapRegion,
  onMapRegionChange,
}) => {
  const [nativeMapRegion, setNativeMapRegion] = useState(mapRegion);

  const [webMapRegion, setWebMapRegion] = useState(mapRegion);

  const theme = useTheme();
  const styles = stylesFn(theme);

  const onLocationChange = (
    location: { latitude: number; longitude: number },
  ) => {
    setWebMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const onMapLocationChange = (region: any) => {
    onMapRegionChange({
      latitude: region.latitude,
      longitude: region.longitude,
    });
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

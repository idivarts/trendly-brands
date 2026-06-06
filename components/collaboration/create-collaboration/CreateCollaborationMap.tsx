import { APIProvider } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import Map from "@/components/map";
import { View } from "@/components/theme/Themed";
import stylesFn from "@/styles/modal/UploadModal.styles";
import { fetchMapRegionAddress } from "@/utils/map";
import { useTheme } from "@react-navigation/native";

interface CreateCollaborationMapProps {
    mapRegion: any;
    onMapRegionChange?: (region: any) => void;
    onLocationChange?: (
        latlong: { lat: number; long: number },
        address: string,
    ) => void;
}

const CreateCollaborationMap: React.FC<CreateCollaborationMapProps> = ({
    mapRegion,
    onMapRegionChange,
    onLocationChange,
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

        if (onLocationChange) {
            onLocationChange(
                {
                    lat: location.latitude,
                    long: location.longitude
                },
                address as string
            );
        }
    };

    const onNativeLocationChange = async (region: Region) => {
        setNativeMapRegion(region);

        const address = await fetchMapRegionAddress(
            region.latitude,
            region.longitude
        );

        if (onLocationChange) {
            onLocationChange(
                {
                    lat: region.latitude,
                    long: region.longitude,
                },
                address as string,
            );
        }
    }

    useEffect(() => {
        if (Platform.OS === 'web') {
            setWebMapRegion({
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude
            });
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

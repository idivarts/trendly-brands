import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import {
  GooglePlacesAutocomplete as GooglePlacesAutocompleteNative,
  GooglePlacesAutocompleteRef as GooglePlacesAutocompleteRefNative,
} from "react-native-google-places-autocomplete";
import GooglePlacesAutocomplete from 'react-google-autocomplete';

import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { calculateDelta, fetchLatLngFromPlaceId } from "@/utils/map";

interface AddressAutocompleteProps {
  collaboration: Partial<ICollaboration>;
  setCollaboration: React.Dispatch<React.SetStateAction<Partial<ICollaboration>>>;
  mapRegion: {
    state: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    setState: React.Dispatch<React.SetStateAction<{
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }>>;
  };
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  collaboration,
  setCollaboration,
  mapRegion,
}) => {
  const theme = useTheme();

  const mapInputRefNative = useRef<GooglePlacesAutocompleteRefNative>(null);

  const mapInputRefWeb = useRef<any>(null);

  useEffect(() => {
    if (collaboration.location?.name && mapInputRefWeb?.current && Platform.OS === "web") {
      mapInputRefWeb.current.value = collaboration.location.name;
    } else if (collaboration.location?.name && mapInputRefNative.current) {
      mapInputRefNative.current?.setAddressText(collaboration.location.name);
    }
  }, [collaboration.location?.name]);

  if (Platform.OS === "web") {
    return (
      <GooglePlacesAutocomplete
        apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
        ref={mapInputRefWeb}
        defaultValue={collaboration.location?.name || "Location"}
        onPlaceSelected={async (data) => {
          if (!data.place_id) {
            return;
          }

          await fetchLatLngFromPlaceId(data.place_id).then((latlong) => {
            if (!latlong) {
              return;
            }

            const delta = calculateDelta(latlong?.lat, latlong?.long);

            setCollaboration({
              ...collaboration,
              location: {
                latlong,
                type: collaboration.location?.type as string,
                name: data.adr_address || "",
              },
            });

            mapRegion.setState({
              latitude: latlong?.lat,
              longitude: latlong?.long,
              latitudeDelta: delta.latitudeDelta,
              longitudeDelta: delta.longitudeDelta,
            });
          });
        }}
        style={{
          backgroundColor: Colors(theme).background,
          padding: 10,
          borderRadius: 4,
          borderColor: Colors(theme).primary,
          borderWidth: 1,
          color: Colors(theme).text,
        }}
      />
    );
  }

  return (
    <GooglePlacesAutocompleteNative
      placeholder='Location'
      key={collaboration.location?.type}
      ref={mapInputRefNative}
      onPress={async (_data, details = null) => {
        if (!details || !details.place_id) {
          return;
        }

        await fetchLatLngFromPlaceId(details.place_id).then((latlong) => {
          if (!latlong) {
            return;
          }

          const delta = calculateDelta(latlong?.lat, latlong?.long);

          setCollaboration({
            ...collaboration,
            location: {
              latlong,
              type: collaboration.location?.type as string,
              name: _data.description || "",
            },
          });

          mapRegion.setState({
            latitude: latlong?.lat,
            longitude: latlong?.long,
            latitudeDelta: delta.latitudeDelta,
            longitudeDelta: delta.longitudeDelta,
          });
        });
      }}
      query={{
        key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!,
        language: 'en',
      }}
      styles={{
        container: {
          flex: 0,
          zIndex: 100,
        },
        textInput: {
          backgroundColor: Colors(theme).background,
          color: Colors(theme).text,
          borderColor: Colors(theme).primary,
          borderWidth: 1,
          borderRadius: 4,
        },
        listView: {
          backgroundColor: Colors(theme).background,
        },
      }}
    />
  );
};

export default AddressAutocomplete;

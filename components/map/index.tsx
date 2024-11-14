import {
  AdvancedMarker,
  Map as GoogleMap,
  MapMouseEvent,
  Pin,
} from '@vis.gl/react-google-maps';
import { useCallback } from 'react';

interface MapProps {
  location: {
    latitude: number;
    longitude: number;
  };
  onLocationChange: (location: { latitude: number; longitude: number }) => void;
}

const Map: React.FC<MapProps> = ({
  location,
  onLocationChange,
}) => {
  const handleOnMapClick = useCallback((event: MapMouseEvent) => {
    event.map?.setCenter(event.detail.latLng as any);

    onLocationChange({
      latitude: event.detail.latLng?.lat as number,
      longitude: event.detail.latLng?.lng as number,
    });
  }, []);

  return (
    <GoogleMap
      style={{
        width: '100%',
        height: 300,
      }}
      defaultZoom={18}
      mapId={'map-id'}
      defaultCenter={{
        lat: location.latitude,
        lng: location.longitude
      }}
      disableDefaultUI={true}
      mapTypeId={'satellite'}
      mapTypeControl={false}
      onClick={handleOnMapClick}
      disableDoubleClickZoom={true}
    >
      {
        location.latitude && location.longitude && (
          <AdvancedMarker
            draggable={true}
            position={{
              lat: location.latitude,
              lng: location.longitude,
            }}
          >
            <Pin
              background={'#fc2e3fff'}
              borderColor={'#000'}
              glyphColor={'#000'}
            />
          </AdvancedMarker>
        )
      }
    </GoogleMap>
  );
};

export default Map;

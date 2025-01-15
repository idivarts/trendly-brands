export const fetchMapRegionAddress = async (lat: number, lng: number) => {
  if (!lat || !lng) {
    return;
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
  );

  const result = await response.json();

  const address =
    result?.results?.[0]?.formatted_address ||
    result?.plus_code?.compound_code ||
    "Address";

  return address;
};

export const fetchLatLngFromPlaceId = async (placeId: string) => {
  if (!placeId) {
    return;
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
  );

  const result = await response.json();

  const lat = result?.results?.[0]?.geometry?.location?.lat;
  const lng = result?.results?.[0]?.geometry?.location?.lng;

  return { lat, lng };
};

import { useState, useEffect } from 'react';

interface GeolocationData {
  latitude: string | null;
  longitude: string | null;
  locationName: string | null;
  error: string | null;
  isLoading: boolean;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationData>({
    latitude: null,
    longitude: null,
    locationName: null,
    error: null,
    isLoading: false,
  });

  const getCurrentLocation = async (): Promise<GeolocationData> => {
    return new Promise((resolve) => {
      setLocation(prev => ({ ...prev, isLoading: true, error: null }));

      if (!navigator.geolocation) {
        const result = {
          latitude: null,
          longitude: null,
          locationName: null,
          error: 'Geolocation is not supported by this browser',
          isLoading: false,
        };
        setLocation(result);
        resolve(result);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude.toString();
          const lng = position.coords.longitude.toString();
          
          // Try to get human-readable location name using reverse geocoding
          let locationName = null;
          try {
            // Using a simple approach with OpenStreetMap Nominatim API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
            );
            if (response.ok) {
              const data = await response.json();
              locationName = data.display_name || null;
            }
          } catch (geocodeError) {
            console.warn('Failed to get location name:', geocodeError);
          }

          const result = {
            latitude: lat,
            longitude: lng,
            locationName,
            error: null,
            isLoading: false,
          };
          setLocation(result);
          resolve(result);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          const result = {
            latitude: null,
            longitude: null,
            locationName: null,
            error: errorMessage,
            isLoading: false,
          };
          setLocation(result);
          resolve(result);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  return {
    ...location,
    getCurrentLocation,
  };
}
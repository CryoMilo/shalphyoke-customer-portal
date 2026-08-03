import { useState } from 'react';

// Haversine formula to calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const useProximity = () => {
  const [isWithinRadius, setIsWithinRadius] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkProximity = () => {
    setIsLoading(true);
    setError(null);
    setIsWithinRadius(null);
    setDistance(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        const restaurantLat = parseFloat(import.meta.env.VITE_RESTAURANT_LAT);
        const restaurantLng = parseFloat(import.meta.env.VITE_RESTAURANT_LNG);
        const maxRadius = parseFloat(import.meta.env.VITE_PROXIMITY_RADIUS) || 100;

        if (isNaN(restaurantLat) || isNaN(restaurantLng)) {
          setError('Restaurant location not configured properly.');
          setIsLoading(false);
          return;
        }

        const dist = calculateDistance(userLat, userLng, restaurantLat, restaurantLng);
        setDistance(dist);
        setIsWithinRadius(dist <= maxRadius);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to get location. Please enable location services.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return { isWithinRadius, distance, error, isLoading, checkProximity };
};

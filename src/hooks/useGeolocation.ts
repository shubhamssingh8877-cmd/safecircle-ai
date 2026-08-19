import { useState, useEffect, useCallback, useRef } from 'react';

export type GeolocationStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number; // Accuracy radius in meters
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoRequest?: boolean;
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  accuracy: number | null;
  status: GeolocationStatus;
  error: string | null;
  retry: () => void;
  requestLocation: () => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
    autoRequest = false,
  } = options;

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const clearExistingWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
      setStatus('unsupported');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    clearExistingWatch();
    setStatus('requesting');
    setError(null);

    const handleSuccess = (pos: globalThis.GeolocationPosition) => {
      const { latitude, longitude, accuracy: acc, altitude, speed, heading } = pos.coords;
      setPosition({
        latitude,
        longitude,
        accuracy: acc,
        altitude,
        speed,
        heading,
        timestamp: pos.timestamp,
      });
      setAccuracy(acc);
      setStatus('active');
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      let errMessage = 'An unknown location error occurred.';
      let newStatus: GeolocationStatus = 'unavailable';

      switch (err.code) {
        case err.PERMISSION_DENIED:
          newStatus = 'denied';
          errMessage = 'Location permission was denied. Enable location access in your browser settings to view your position.';
          break;
        case err.POSITION_UNAVAILABLE:
          newStatus = 'unavailable';
          errMessage = 'GPS or network position information is currently unavailable.';
          break;
        case err.TIMEOUT:
          newStatus = 'timeout';
          errMessage = 'GPS location request timed out. Please try again.';
          break;
      }

      setStatus(newStatus);
      setError(errMessage);
    };

    try {
      const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy,
        timeout,
        maximumAge,
      });
      watchIdRef.current = id;
    } catch (e) {
      setStatus('unavailable');
      setError('Failed to initiate geolocation tracking.');
    }
  }, [clearExistingWatch, enableHighAccuracy, timeout, maximumAge]);

  const retry = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }

    return () => {
      clearExistingWatch();
    };
  }, [autoRequest, requestLocation, clearExistingWatch]);

  return {
    position,
    accuracy,
    status,
    error,
    retry,
    requestLocation,
  };
}

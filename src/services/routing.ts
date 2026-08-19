import { TransportMode } from '../types';

export interface RouteCoordinates {
  lat: number;
  lng: number;
}

export interface RouteResult {
  success: boolean;
  coordinates: [number, number][]; // [lat, lng] array formatted for Leaflet Polyline
  distanceMeters: number;
  durationSeconds: number;
  profileUsed: string;
  error?: string;
}

export interface GeocodingResult {
  name: string;
  lat: number;
  lng: number;
  displayAddress: string;
}

export const PRESET_LOCATIONS: Record<string, RouteCoordinates & { name: string }> = {
  'current_location': {
    name: 'Current Device Location (GPS)',
    lat: 37.7749,
    lng: -122.4194,
  },
  'tech_hub': {
    name: 'Metropolitan Tech Hub (4th Ave)',
    lat: 37.7749,
    lng: -122.4194,
  },
  'metro_station': {
    name: 'Central Metro Transit Hub',
    lat: 37.7785,
    lng: -122.4075,
  },
  'north_ridge': {
    name: 'North Ridge Residential Complex',
    lat: 37.7820,
    lng: -122.4050,
  },
  'st_jude': {
    name: 'St. Jude Emergency Hospital (Health Blvd)',
    lat: 37.7800,
    lng: -122.4240,
  },
  'beacon_pharmacy': {
    name: 'Beacon Health 24/7 Pharmacy (Market St)',
    lat: 37.7760,
    lng: -122.4140,
  },
  'police_station': {
    name: 'Central Precinct Police Station (Justice Way)',
    lat: 37.7738,
    lng: -122.4180,
  },
};

function getOsrmProfile(mode: TransportMode): string {
  switch (mode) {
    case 'walking':
      return 'foot';
    case 'cycling':
      return 'bike';
    case 'driving':
    case 'rideshare':
    case 'transit':
    default:
      return 'driving';
  }
}

export async function calculateRoadRoute(
  origin: RouteCoordinates,
  destination: RouteCoordinates,
  mode: TransportMode = 'walking'
): Promise<RouteResult> {
  if (
    typeof origin.lat !== 'number' ||
    typeof origin.lng !== 'number' ||
    typeof destination.lat !== 'number' ||
    typeof destination.lng !== 'number' ||
    isNaN(origin.lat) ||
    isNaN(origin.lng) ||
    isNaN(destination.lat) ||
    isNaN(destination.lng)
  ) {
    return {
      success: false,
      coordinates: [],
      distanceMeters: 0,
      durationSeconds: 0,
      profileUsed: 'none',
      error: 'Invalid coordinates provided for route calculation.',
    };
  }

  const profile = getOsrmProfile(mode);
  const profilesToTry = profile === 'driving' ? ['driving'] : [profile, 'driving'];

  for (const currentProfile of profilesToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const url = `https://router.project-osrm.org/route/v1/${currentProfile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        continue;
      }

      const primaryRoute = data.routes[0];
      const rawGeoJsonCoords: [number, number][] = primaryRoute.geometry.coordinates;
      const leafletCoords: [number, number][] = rawGeoJsonCoords.map(([lon, lat]) => [lat, lon]);

      return {
        success: true,
        coordinates: leafletCoords,
        distanceMeters: primaryRoute.distance,
        durationSeconds: primaryRoute.duration,
        profileUsed: currentProfile,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn(`[SafeCircle Routing] OSRM request timed out for profile ${currentProfile}.`);
      } else {
        console.warn(`[SafeCircle Routing] Network error fetching route for profile ${currentProfile}:`, err);
      }
    }
  }

  return {
    success: false,
    coordinates: [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ],
    distanceMeters: 0,
    durationSeconds: 0,
    profileUsed: 'fallback',
    error: 'Could not connect to public routing service. Please check your network connection.',
  };
}

export async function geocodeAddress(query: string): Promise<GeocodingResult | null> {
  const trimmed = query.trim().toLowerCase();

  for (const key of Object.keys(PRESET_LOCATIONS)) {
    const preset = PRESET_LOCATIONS[key];
    if (
      trimmed.includes(key) ||
      trimmed.includes(preset.name.toLowerCase()) ||
      preset.name.toLowerCase().includes(trimmed)
    ) {
      return {
        name: preset.name,
        lat: preset.lat,
        lng: preset.lng,
        displayAddress: preset.name,
      };
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const first = data[0];
    return {
      name: first.name || query,
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      displayAddress: first.display_name,
    };
  } catch (e) {
    console.warn('[SafeCircle Geocode] Public geocoding lookup failed:', e);
    return null;
  }
}

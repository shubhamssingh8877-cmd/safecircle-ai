export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's mean radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return haversineDistanceMeters(lat1, lon1, lat2, lon2) / 1000;
}

export function distanceToSegmentMeters(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): { distanceMeters: number; nearestPoint: { lat: number; lng: number } } {
  const dx = bLng - aLng;
  const dy = bLat - aLat;

  if (dx === 0 && dy === 0) {
    return {
      distanceMeters: haversineDistanceMeters(pLat, pLng, aLat, aLng),
      nearestPoint: { lat: aLat, lng: aLng },
    };
  }

  const t = ((pLng - aLng) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));

  const projLat = aLat + clampedT * dy;
  const projLng = aLng + clampedT * dx;

  return {
    distanceMeters: haversineDistanceMeters(pLat, pLng, projLat, projLng),
    nearestPoint: { lat: projLat, lng: projLng },
  };
}

export function calculateCrossTrackDeviation(
  userLat: number,
  userLng: number,
  routePolyline: [number, number][]
): {
  minDistanceMeters: number;
  nearestRoutePoint: { lat: number; lng: number };
  segmentIndex: number;
} {
  if (!routePolyline || routePolyline.length === 0) {
    return {
      minDistanceMeters: 0,
      nearestRoutePoint: { lat: userLat, lng: userLng },
      segmentIndex: 0,
    };
  }

  if (routePolyline.length === 1) {
    const dist = haversineDistanceMeters(
      userLat,
      userLng,
      routePolyline[0][0],
      routePolyline[0][1]
    );
    return {
      minDistanceMeters: dist,
      nearestRoutePoint: { lat: routePolyline[0][0], lng: routePolyline[0][1] },
      segmentIndex: 0,
    };
  }

  let minDistanceMeters = Infinity;
  let nearestRoutePoint = { lat: routePolyline[0][0], lng: routePolyline[0][1] };
  let segmentIndex = 0;

  for (let i = 0; i < routePolyline.length - 1; i++) {
    const a = routePolyline[i];
    const b = routePolyline[i + 1];

    const { distanceMeters, nearestPoint } = distanceToSegmentMeters(
      userLat,
      userLng,
      a[0],
      a[1],
      b[0],
      b[1]
    );

    if (distanceMeters < minDistanceMeters) {
      minDistanceMeters = distanceMeters;
      nearestRoutePoint = nearestPoint;
      segmentIndex = i;
    }
  }

  return {
    minDistanceMeters,
    nearestRoutePoint,
    segmentIndex,
  };
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

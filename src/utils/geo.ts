export type DeviationState = 'on_route' | 'approaching_deviation' | 'deviated';

export interface Point2D {
  lat: number;
  lng: number;
}

export interface PolylineDeviationResult {
  distanceMeters: number;
  nearestRoutePoint: Point2D;
  segmentIndex: number;
}

/**
 * Accurate Haversine distance between two geographic coordinates in meters.
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return Math.round((haversineDistanceMeters(lat1, lon1, lat2, lon2) / 1000) * 10) / 10;
}

/**
 * Calculate minimum distance from a point P to a road line segment [A, B] on Earth.
 * Uses equirectangular local tangent projection for sub-meter planar precision.
 */
export function pointToSegmentDistance(
  point: Point2D,
  segStart: Point2D,
  segEnd: Point2D
): { distanceMeters: number; nearestPoint: Point2D } {
  // Mean latitude in radians for longitude scaling
  const meanLatRad = ((point.lat + segStart.lat + segEnd.lat) / 3 * Math.PI) / 180;
  const metersPerDegreeLat = 111132.92;
  const metersPerDegreeLng = 111412.84 * Math.cos(meanLatRad);

  // Project points relative to P (point becomes (0,0))
  const ax = (segStart.lng - point.lng) * metersPerDegreeLng;
  const ay = (segStart.lat - point.lat) * metersPerDegreeLat;

  const bx = (segEnd.lng - point.lng) * metersPerDegreeLng;
  const by = (segEnd.lat - point.lat) * metersPerDegreeLat;

  // Segment vector AB
  const vx = bx - ax;
  const vy = by - ay;
  const segLenSq = vx * vx + vy * vy;

  if (segLenSq === 0) {
    // Degenerate segment (points A and B coincide)
    const dist = Math.sqrt(ax * ax + ay * ay);
    return { distanceMeters: dist, nearestPoint: { lat: segStart.lat, lng: segStart.lng } };
  }

  // Vector from A to P (which is (-ax, -ay) in our coordinate system)
  const uDotV = -ax * vx + -ay * vy;
  const t = Math.max(0, Math.min(1, uDotV / segLenSq));

  // Nearest point Q on the segment in local projection
  const qx = ax + t * vx;
  const qy = ay + t * vy;

  const distMeters = Math.sqrt(qx * qx + qy * qy);

  // Convert nearest projected point back to GPS coordinates
  const qLat = point.lat + qy / metersPerDegreeLat;
  const qLng = point.lng + qx / metersPerDegreeLng;

  return {
    distanceMeters: distMeters,
    nearestPoint: { lat: qLat, lng: qLng },
  };
}

/**
 * Calculate minimum distance from the traveler's GPS position to the entire route polyline.
 * Evaluates every segment of the polyline and identifies the exact closest point.
 */
export function calculatePolylineDeviation(
  userPos: Point2D,
  routeCoordinates: [number, number][]
): PolylineDeviationResult {
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return {
      distanceMeters: 0,
      nearestRoutePoint: { lat: userPos.lat, lng: userPos.lng },
      segmentIndex: -1,
    };
  }

  if (routeCoordinates.length === 1) {
    const single = routeCoordinates[0];
    const dist = haversineDistanceMeters(userPos.lat, userPos.lng, single[0], single[1]);
    return {
      distanceMeters: dist,
      nearestRoutePoint: { lat: single[0], lng: single[1] },
      segmentIndex: 0,
    };
  }

  let minDistance = Infinity;
  let nearestPoint: Point2D = { lat: routeCoordinates[0][0], lng: routeCoordinates[0][1] };
  let nearestSegmentIndex = 0;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const start: Point2D = { lat: routeCoordinates[i][0], lng: routeCoordinates[i][1] };
    const end: Point2D = { lat: routeCoordinates[i + 1][0], lng: routeCoordinates[i + 1][1] };

    const result = pointToSegmentDistance(userPos, start, end);
    if (result.distanceMeters < minDistance) {
      minDistance = result.distanceMeters;
      nearestPoint = result.nearestPoint;
      nearestSegmentIndex = i;
    }
  }

  return {
    distanceMeters: Math.round(minDistance * 10) / 10,
    nearestRoutePoint: nearestPoint,
    segmentIndex: nearestSegmentIndex,
  };
}

/**
 * Resolve user sensitivity preference to deviation threshold in meters.
 */
export function getDeviationThresholdMeters(
  sensitivity: 'strict' | 'balanced' | 'relaxed'
): number {
  switch (sensitivity) {
    case 'strict':
      return 100; // 100m for high-vigilance / high-risk zones
    case 'relaxed':
      return 500; // 500m for broad suburban routes
    case 'balanced':
    default:
      return 250; // 250m standard urban default
  }
}

/**
 * Classifies deviation distance into three distinct lifecycle states.
 * - ON_ROUTE: < 75% of threshold
 * - APPROACHING_DEVIATION: 75% to 100% of threshold
 * - DEVIATED: > 100% of threshold
 */
export function classifyDeviation(
  distanceMeters: number,
  thresholdMeters: number
): DeviationState {
  const warningBoundary = thresholdMeters * 0.75;
  if (distanceMeters < warningBoundary) {
    return 'on_route';
  } else if (distanceMeters <= thresholdMeters) {
    return 'approaching_deviation';
  } else {
    return 'deviated';
  }
}

/**
 * Format coordinates for human-readable display.
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lngStr}`;
}

/**
 * Format distance in meters to a human friendly string (e.g. "650 m" or "2.4 km").
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  const km = distanceMeters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Format duration in seconds to a human friendly string (e.g. "18 mins" or "1h 15m").
 */
export function formatDuration(durationSeconds: number): string {
  if (durationSeconds < 60) {
    return `${Math.round(durationSeconds)}s`;
  }
  const totalMinutes = Math.ceil(durationSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min${totalMinutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Convenience alias for cross-track polyline deviation.
 */
export function calculateCrossTrackDeviation(
  userLat: number,
  userLng: number,
  routePolyline: [number, number][]
): {
  minDistanceMeters: number;
  nearestRoutePoint: { lat: number; lng: number };
  segmentIndex: number;
} {
  const res = calculatePolylineDeviation({ lat: userLat, lng: userLng }, routePolyline);
  return {
    minDistanceMeters: res.distanceMeters,
    nearestRoutePoint: res.nearestRoutePoint,
    segmentIndex: res.segmentIndex,
  };
}

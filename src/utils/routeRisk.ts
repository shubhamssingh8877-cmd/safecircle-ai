import { SafetyReport } from '../types';
import { haversineDistanceMeters, pointToSegmentDistance } from './geo';

export interface RouteRiskPoint {
  reportId: string;
  reportTitle: string;
  category: string;
  severity: string;
  description: string;
  location: string;
  upvotes: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceToRouteMeters: number;
  distanceToUserMeters?: number;
  nearestRoutePoint: {
    lat: number;
    lng: number;
  };
  segmentIndex: number;
  proximity: 'on_route' | 'near_route' | 'nearby' | 'distant';
  priorityScore: number;
  report?: SafetyReport;
}

/**
 * Calculates deterministic route-risk points by projecting community hazard reports
 * onto the active road polyline using local equirectangular planar mathematics.
 *
 * All distance metrics, projections, and proximity categorizations are 100% locally computed.
 */
export function calculateRouteRiskPoints(
  routeCoordinates: [number, number][],
  reports: SafetyReport[],
  userPosition?: { lat: number; lng: number },
  maxDistanceThresholdMeters: number = 1200
): RouteRiskPoint[] {
  if (!routeCoordinates || routeCoordinates.length < 2 || !reports || reports.length === 0) {
    return [];
  }

  const results: RouteRiskPoint[] = [];

  for (const report of reports) {
    if (
      !report.coordinates ||
      typeof report.coordinates.lat !== 'number' ||
      typeof report.coordinates.lng !== 'number'
    ) {
      continue;
    }

    const reportCoord = { lat: report.coordinates.lat, lng: report.coordinates.lng };
    let minDistanceToRoute = Infinity;
    let nearestPointOnRoute = { lat: routeCoordinates[0][0], lng: routeCoordinates[0][1] };
    let bestSegmentIndex = 0;

    // Project report onto each segment of the planned road polyline
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const segStart = { lat: routeCoordinates[i][0], lng: routeCoordinates[i][1] };
      const segEnd = { lat: routeCoordinates[i + 1][0], lng: routeCoordinates[i + 1][1] };

      const projection = pointToSegmentDistance(reportCoord, segStart, segEnd);
      if (projection.distanceMeters < minDistanceToRoute) {
        minDistanceToRoute = projection.distanceMeters;
        nearestPointOnRoute = projection.nearestPoint;
        bestSegmentIndex = i;
      }
    }

    // Filter reports within proximity threshold of the route
    if (minDistanceToRoute <= maxDistanceThresholdMeters) {
      let proximity: 'on_route' | 'near_route' | 'nearby' = 'nearby';
      if (minDistanceToRoute <= 50) {
        proximity = 'on_route';
      } else if (minDistanceToRoute <= 300) {
        proximity = 'near_route';
      }

      // Distance from current user position if available
      let distanceToUser: number | undefined = undefined;
      if (userPosition) {
        distanceToUser = Math.round(
          haversineDistanceMeters(userPosition.lat, userPosition.lng, reportCoord.lat, reportCoord.lng)
        );
      }

      // Deterministic explainable priority score:
      // Severity weight: warning = 50, caution = 25, advisory = 10
      // Proximity weight: closer to route = higher score
      // Community corroboration: upvotes * 5
      const severityWeight =
        report.severity === 'warning' ? 50 : report.severity === 'caution' ? 25 : 10;
      const proximityWeight = Math.max(0, (maxDistanceThresholdMeters - minDistanceToRoute) / 20);
      const communityWeight = (report.upvotes || 0) * 5;
      const priorityScore = Math.round(severityWeight + proximityWeight + communityWeight);

      results.push({
        reportId: report.id,
        reportTitle: report.title,
        category: report.category,
        severity: report.severity,
        description: report.description,
        location: report.location,
        upvotes: report.upvotes,
        coordinates: reportCoord,
        distanceToRouteMeters: Math.round(minDistanceToRoute),
        distanceToUserMeters: distanceToUser,
        nearestRoutePoint: {
          lat: Math.round(nearestPointOnRoute.lat * 100000) / 100000,
          lng: Math.round(nearestPointOnRoute.lng * 100000) / 100000,
        },
        segmentIndex: bestSegmentIndex,
        proximity,
        priorityScore,
      });
    }
  }

  // Sort by deterministic priority score descending, capped to top 5
  return results.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
}

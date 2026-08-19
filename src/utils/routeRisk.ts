import { SafetyReport } from '../types';
import { distanceToSegmentMeters, haversineDistanceMeters } from './geo';

export interface RouteRiskPoint {
  reportId: string;
  reportTitle: string;
  category: SafetyReport['category'];
  severity: SafetyReport['severity'];
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
}

export function calculateRouteRiskPoints(
  routePolyline: [number, number][],
  reports: SafetyReport[],
  userPosition?: { lat: number; lng: number },
  corridorRadiusMeters: number = 1200
): RouteRiskPoint[] {
  if (!routePolyline || routePolyline.length < 2 || !reports || reports.length === 0) {
    return [];
  }

  const riskPoints: RouteRiskPoint[] = [];

  for (const report of reports) {
    if (
      !report.coordinates ||
      typeof report.coordinates.lat !== 'number' ||
      typeof report.coordinates.lng !== 'number'
    ) {
      continue;
    }

    const rLat = report.coordinates.lat;
    const rLng = report.coordinates.lng;

    let minDistanceToRoute = Infinity;
    let closestRoutePoint = { lat: routePolyline[0][0], lng: routePolyline[0][1] };
    let bestSegmentIndex = 0;

    for (let i = 0; i < routePolyline.length - 1; i++) {
      const a = routePolyline[i];
      const b = routePolyline[i + 1];

      const { distanceMeters, nearestPoint } = distanceToSegmentMeters(
        rLat,
        rLng,
        a[0],
        a[1],
        b[0],
        b[1]
      );

      if (distanceMeters < minDistanceToRoute) {
        minDistanceToRoute = distanceMeters;
        closestRoutePoint = nearestPoint;
        bestSegmentIndex = i;
      }
    }

    if (minDistanceToRoute <= corridorRadiusMeters) {
      let proximity: RouteRiskPoint['proximity'] = 'distant';
      if (minDistanceToRoute <= 40) {
        proximity = 'on_route';
      } else if (minDistanceToRoute <= 250) {
        proximity = 'near_route';
      } else {
        proximity = 'nearby';
      }

      let severityMultiplier = 1;
      if (report.severity === 'warning') severityMultiplier = 3;
      else if (report.severity === 'caution') severityMultiplier = 2;

      const proximityWeight = Math.max(1, Math.round((corridorRadiusMeters - minDistanceToRoute) / 100));
      const upvoteBonus = Math.min(20, (report.upvotes || 0) * 2);
      const priorityScore = severityMultiplier * 25 + proximityWeight + upvoteBonus;

      const distanceToUser = userPosition
        ? Math.round(haversineDistanceMeters(userPosition.lat, userPosition.lng, rLat, rLng))
        : undefined;

      riskPoints.push({
        reportId: report.id,
        reportTitle: report.title,
        category: report.category,
        severity: report.severity,
        description: report.description,
        location: report.location,
        upvotes: report.upvotes,
        coordinates: report.coordinates,
        distanceToRouteMeters: Math.round(minDistanceToRoute),
        distanceToUserMeters: distanceToUser,
        nearestRoutePoint: closestRoutePoint,
        segmentIndex: bestSegmentIndex,
        proximity,
        priorityScore,
      });
    }
  }

  return riskPoints.sort((a, b) => b.priorityScore - a.priorityScore);
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Footprints,
  Car,
  Bus,
  Bike,
  Plus,
  Compass,
  Crosshair,
  Loader2,
  Clock,
  RefreshCw,
  ShieldCheck,
  Info,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { useJourney } from '../context/JourneyContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateRoadRoute, geocodeAddress, PRESET_LOCATIONS, RouteCoordinates } from '../services/routing';
import { haversineDistanceMeters } from '../utils/geo';
import { calculateRouteRiskPoints, RouteRiskPoint } from '../utils/routeRisk';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { TransportMode } from '../types';

// Map Auto-Fit/Recenter Controller for Route Polyline
const RouteMapController: React.FC<{
  routeCoordinates: [number, number][];
  userPosition?: [number, number];
}> = ({ routeCoordinates, userPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      if (userPosition) {
        bounds.extend(userPosition);
      }
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [routeCoordinates, userPosition, map]);

  return null;
};

// Custom Leaflet Icons for Journey View
const createOriginIcon = () =>
  L.divIcon({
    className: 'custom-origin-marker',
    html: `
      <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #059669; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
        A
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const createDestIcon = () =>
  L.divIcon({
    className: 'custom-dest-marker',
    html: `
      <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
        B
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const createUserGpsIcon = () =>
  L.divIcon({
    className: 'custom-user-gps-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background-color: rgba(2, 132, 199, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 18px; height: 18px; border-radius: 50%; background-color: #0284c7; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.5); z-index: 10;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const createNearestPointIcon = () =>
  L.divIcon({
    className: 'custom-nearest-route-marker',
    html: `
      <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #dc2626; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });

const createRouteHazardIcon = () =>
  L.divIcon({
    className: 'custom-route-hazard-marker',
    html: `
      <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #d97706; border: 2px solid #ffffff; box-shadow: 0 3px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });

export const JourneyPage: React.FC = () => {
  const {
    journey,
    contacts,
    reports,
    startJourney,
    openArrivalModal,
    recordCheckIn,
    snoozeCheckIn,
    openSosModal,
    processGpsDeviation,
    simulateDevDetour,
    dismissDeviationAlert,
    aiAssessment,
    isAiAnalyzing,
    refreshAiSafetyAssessment,
    applySuggestedCheckIn,
    preferences,
  } = useJourney();

  const { position, accuracy, requestLocation } = useGeolocation({
    autoRequest: true,
  });

  // Journey Creation Form State
  const [origin, setOrigin] = useState('Metropolitan Tech Hub, 4th Ave');
  const [destination, setDestination] = useState('North Ridge Residential Complex, Apt 4B');
  const [originCoords, setOriginCoords] = useState<RouteCoordinates>({
    lat: 37.7749,
    lng: -122.4194,
  });
  const [destCoords, setDestCoords] = useState<RouteCoordinates>({
    lat: 37.7820,
    lng: -122.4050,
  });
  const [mode, setMode] = useState<TransportMode>('walking');
  const [checkinInterval, setCheckinInterval] = useState(15);
  const [selectedContacts, setSelectedContacts] = useState<string[]>(
    contacts.slice(0, 2).map(c => c.id)
  );

  // Loading & Error States
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  const isJourneyActive = journey && journey.status === 'active';

  // Live GPS Telemetry Feed: continuously processes traveler position against active route
  useEffect(() => {
    if (isJourneyActive && position && !journey.isSimulatedDeviation) {
      processGpsDeviation({
        lat: position.latitude,
        lng: position.longitude,
        accuracy: accuracy ?? undefined,
      });
    }
  }, [position?.latitude, position?.longitude, accuracy, isJourneyActive, journey?.isSimulatedDeviation]);

  const handleUseCurrentGpsOrigin = () => {
    if (position) {
      setOrigin('Current Device Location (GPS)');
      setOriginCoords({ lat: position.latitude, lng: position.longitude });
    } else {
      requestLocation();
    }
  };

  const handleSelectPresetDestination = (key: string) => {
    const preset = PRESET_LOCATIONS[key];
    if (preset) {
      setDestination(preset.name);
      setDestCoords({ lat: preset.lat, lng: preset.lng });
    }
  };

  const handleStartJourneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    setIsCalculatingRoute(true);
    setRoutingError(null);

    let startCoord = originCoords;
    let endCoord = destCoords;

    // Resolve Origin coordinates if user entered custom text
    if (origin.includes('Current') && position) {
      startCoord = { lat: position.latitude, lng: position.longitude };
    } else {
      const geoOrigin = await geocodeAddress(origin);
      if (geoOrigin) {
        startCoord = { lat: geoOrigin.lat, lng: geoOrigin.lng };
      }
    }

    // Resolve Destination coordinates
    const geoDest = await geocodeAddress(destination);
    if (geoDest) {
      endCoord = { lat: geoDest.lat, lng: geoDest.lng };
    }

    // Call real OSRM road routing service
    const routeResult = await calculateRoadRoute(startCoord, endCoord, mode);

    setIsCalculatingRoute(false);

    if (!routeResult.success && routeResult.coordinates.length < 2) {
      setRoutingError(routeResult.error || 'Failed to calculate road route.');
      return;
    }

    // Launch journey with real road polyline coordinates
    startJourney(origin, destination, mode, selectedContacts, checkinInterval, {
      coordinates: routeResult.coordinates,
      distanceMeters: routeResult.distanceMeters || 1850,
      durationSeconds: routeResult.durationSeconds || 1320,
      profileUsed: routeResult.profileUsed,
      originCoordinates: startCoord,
      destinationCoordinates: endCoord,
    });
  };

  // Recalculate Route from current GPS position to Destination
  const handleRecalculateRoute = async () => {
    if (!journey || !position) return;
    setIsRecalculating(true);

    const startCoord = { lat: position.latitude, lng: position.longitude };
    const endCoord = journey.destinationCoordinates || destCoords;

    const result = await calculateRoadRoute(startCoord, endCoord, journey.mode);
    setIsRecalculating(false);

    if (result.success && result.coordinates.length > 1) {
      dismissDeviationAlert();
      startJourney(
        'Current Position (Recalculated)',
        journey.destination,
        journey.mode,
        journey.assignedContacts,
        journey.checkInIntervalMinutes,
        {
          coordinates: result.coordinates,
          distanceMeters: result.distanceMeters,
          durationSeconds: result.durationSeconds,
          profileUsed: result.profileUsed,
          originCoordinates: startCoord,
          destinationCoordinates: endCoord,
        }
      );
    }
  };

  // Simulated GPS Deviation detours for testing
  const handleSimulateDetour100m = () => simulateDevDetour(115);
  const handleSimulateDetour350m = () => simulateDevDetour(350);
  const handleSimulateDetour600m = () => simulateDevDetour(600);

  // Calculate route risk corridor points
  const routeRiskPoints: RouteRiskPoint[] = journey?.routeCoordinates && journey.routeCoordinates.length > 1
    ? calculateRouteRiskPoints(
        journey.routeCoordinates,
        reports,
        journey.originCoordinates ? { lat: journey.originCoordinates.lat, lng: journey.originCoordinates.lng } : undefined,
        1200
      )
    : [];

  const defaultCenter: [number, number] = journey?.originCoordinates
    ? [journey.originCoordinates.lat, journey.originCoordinates.lng]
    : [37.7749, -122.4194];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
              {isJourneyActive ? 'Active Route Guardian' : 'Plan Protected Journey'}
            </h2>
            <Badge variant={isJourneyActive ? 'safe' : 'brand'} size="sm" dot>
              {isJourneyActive ? 'Live Telemetry Active' : 'Ready to Launch'}
            </Badge>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {isJourneyActive
              ? 'Real-time road routing, continuous cross-track monitoring, and autonomous escalation.'
              : 'Select your origin and destination. SafeCircle computes a secure road route via OSRM.'}
          </p>
        </div>

        {isJourneyActive && (
          <div className="flex items-center gap-2">
            <Button
              variant="safe"
              size="sm"
              onClick={openArrivalModal}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Arrived Safely
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={openSosModal}
              icon={<Radio className="w-4 h-4" />}
            >
              Trigger SOS
            </Button>
          </div>
        )}
      </div>

      {/* Main Split View: Map + Journey Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="overflow-hidden p-0 border-surface-200 dark:border-surface-800">
            <div className="relative h-[480px] sm:h-[540px] w-full bg-surface-100 dark:bg-surface-950">
              <MapContainer
                center={defaultCenter}
                zoom={14}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Auto recenter / bounds fit controller */}
                {journey?.routeCoordinates && journey.routeCoordinates.length > 0 && (
                  <RouteMapController
                    routeCoordinates={journey.routeCoordinates}
                    userPosition={position ? [position.latitude, position.longitude] : undefined}
                  />
                )}

                {/* Road Route Polyline (Green = Normal, Red = Deviated) */}
                {journey?.routeCoordinates && journey.routeCoordinates.length > 1 && (
                  <Polyline
                    positions={journey.routeCoordinates}
                    pathOptions={{
                      color: journey.deviationDetected ? '#dc2626' : '#059669',
                      weight: 5,
                      opacity: 0.85,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                )}

                {/* Origin Marker */}
                {journey?.originCoordinates && (
                  <Marker
                    position={[journey.originCoordinates.lat, journey.originCoordinates.lng]}
                    icon={createOriginIcon()}
                  >
                    <Popup>
                      <div className="text-xs space-y-1">
                        <strong className="text-safe-600 block">Departure Point</strong>
                        <p>{journey.origin}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Destination Marker */}
                {journey?.destinationCoordinates && (
                  <Marker
                    position={[journey.destinationCoordinates.lat, journey.destinationCoordinates.lng]}
                    icon={createDestIcon()}
                  >
                    <Popup>
                      <div className="text-xs space-y-1">
                        <strong className="text-brand-600 block">Destination</strong>
                        <p>{journey.destination}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Live Device / Traveler GPS Marker */}
                {position && (
                  <>
                    <Marker
                      position={[position.latitude, position.longitude]}
                      icon={createUserGpsIcon()}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <strong className="text-brand-600 block">Your Live GPS Position</strong>
                          <p>
                            {position.latitude.toFixed(5)}° N, {position.longitude.toFixed(5)}° W
                          </p>
                          {accuracy && (
                            <p className="text-[10px] text-surface-500">
                              Accuracy: ±{Math.round(accuracy)}m
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>

                    {accuracy && (
                      <Circle
                        center={[position.latitude, position.longitude]}
                        radius={accuracy}
                        pathOptions={{
                          color: '#0284c7',
                          fillColor: '#0284c7',
                          fillOpacity: 0.1,
                          weight: 1,
                        }}
                      />
                    )}
                  </>
                )}

                {/* Nearest Route Point (when deviated) */}
                {journey?.deviationDetected && journey.nearestRoutePoint && (
                  <Marker
                    position={[journey.nearestRoutePoint.lat, journey.nearestRoutePoint.lng]}
                    icon={createNearestPointIcon()}
                  >
                    <Popup>
                      <div className="text-xs space-y-1">
                        <strong className="text-danger-600 block">Planned Route Anchor</strong>
                        <p>Distance off corridor: {journey.distanceFromRouteMeters || 340}m</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Route Risk Hazards along corridor */}
                {routeRiskPoints.map(point => (
                  <Marker
                    key={point.reportId}
                    position={[point.coordinates.lat, point.coordinates.lng]}
                    icon={createRouteHazardIcon()}
                  >
                    <Popup>
                      <div className="text-xs space-y-1 max-w-[200px]">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-amber-600 font-bold capitalize">
                            {point.category}
                          </strong>
                          <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            {point.distanceToRouteMeters}m from route
                          </span>
                        </div>
                        <p className="font-medium text-surface-900">{point.reportTitle}</p>
                        <p className="text-surface-500 text-[11px]">{point.description}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Map Floating Controls & Indicators */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={requestLocation}
                  className="p-2.5 rounded-xl bg-white/90 dark:bg-surface-900/90 backdrop-blur-md shadow-md border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:text-brand-600 transition-colors"
                  title="Locate Device GPS"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>

              {/* Map Bottom Floating Status Strip */}
              {isJourneyActive && (
                <div className="absolute bottom-3 left-3 right-3 z-10 p-3 rounded-xl bg-white/90 dark:bg-surface-900/90 backdrop-blur-md border border-surface-200/80 dark:border-surface-800/80 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-surface-500">Route:</span>
                      <span className="font-semibold text-surface-900 dark:text-surface-100">
                        {((journey.distanceMeters || 1850) / 1000).toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-surface-500">ETA:</span>
                      <span className="font-semibold text-surface-900 dark:text-surface-100">
                        {Math.ceil((journey.durationSeconds || 1320) / 60)} mins
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {journey.deviationDetected ? (
                      <Badge variant="danger" size="sm">
                        Detour: +{journey.distanceFromRouteMeters || 340}m
                      </Badge>
                    ) : (
                      <Badge variant="safe" size="sm">
                        Corridor Locked
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Real Deviation & Detour Testing Controls */}
          {isJourneyActive && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning-500" />
                    <CardTitle>Route Deviation Telemetry & Simulation Controls</CardTitle>
                  </div>
                  <Badge variant={journey.deviationDetected ? 'danger' : 'safe'} size="sm">
                    {journey.deviationDetected ? 'Deviation Triggered' : 'On Track'}
                  </Badge>
                </div>
                <CardDescription>
                  SafeCircle monitors cross-track error in real-time. Use these controls to simulate detours for testing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateDetour100m}
                  >
                    Simulate 115m Detour
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateDetour350m}
                  >
                    Simulate 350m Detour
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateDetour600m}
                  >
                    Simulate 600m Detour
                  </Button>
                </div>

                {journey.deviationDetected && (
                  <div className="p-4 rounded-xl bg-danger-50 dark:bg-danger-950/40 border border-danger-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-danger-500 animate-ping" />
                        <h4 className="text-xs font-bold text-danger-900 dark:text-danger-200">
                          Route Deviation Active: {journey.distanceFromRouteMeters || 340}m from planned path
                        </h4>
                      </div>
                      <p className="text-[11px] text-danger-700 dark:text-danger-300">
                        Autonomous cross-track monitor detected movement away from the verified corridor.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleRecalculateRoute}
                        disabled={isRecalculating}
                        icon={isRecalculating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                      >
                        Recalculate Route
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={dismissDeviationAlert}
                      >
                        Dismiss Alert
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Controls & AI Corridor Intelligence (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {isJourneyActive ? (
            <>
              {/* Active Journey Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-500" />
                      <CardTitle>Autonomous Safety Cadence</CardTitle>
                    </div>
                    <Badge
                      variant={journey.checkInStatusState === 'overdue' ? 'danger' : 'brand'}
                      size="sm"
                    >
                      {journey.checkInStatusState === 'overdue' ? 'OVERDUE' : `${journey.checkInIntervalMinutes}m Ping`}
                    </Badge>
                  </div>
                  <CardDescription>
                    Automatic check-in countdown. Overdue pings escalate to your trusted circle.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border text-center space-y-2 ${
                      journey.checkInStatusState === 'overdue'
                        ? 'bg-danger-50 dark:bg-danger-950/60 border-danger-500/80 animate-pulse'
                        : 'bg-surface-50 dark:bg-surface-950 border-surface-200 dark:border-surface-800'
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        journey.checkInStatusState === 'overdue'
                          ? 'text-danger-700 dark:text-danger-300'
                          : 'text-surface-500'
                      }`}
                    >
                      {journey.checkInStatusState === 'overdue'
                        ? '⚠️ Scheduled Check-In Overdue'
                        : 'Next Automated Safety Check'}
                    </span>

                    {journey.checkInStatusState === 'overdue' ? (
                      <div className="space-y-1">
                        <div className="text-3xl font-black font-mono text-danger-600 dark:text-danger-400">
                          {journey.overdueGraceSecondsRemaining ?? 60}s
                        </div>
                        <p className="text-[11px] text-danger-600 dark:text-danger-300">
                          Auto-escalation triggers in {journey.overdueGraceSecondsRemaining ?? 60}s if unconfirmed.
                        </p>
                      </div>
                    ) : (
                      <div className="text-3xl font-black font-mono text-surface-900 dark:text-surface-50">
                        {Math.floor(journey.nextCheckInInSeconds / 60)}:
                        {String(journey.nextCheckInInSeconds % 60).padStart(2, '0')}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={journey.checkInStatusState === 'overdue' ? 'danger' : 'safe'}
                      size="sm"
                      onClick={() => recordCheckIn('confirmed', 'User confirmed safety from Journey map')}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      I'm Safe
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => snoozeCheckIn(5)}
                    >
                      Snooze 5m
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Gemini AI Route Intelligence Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-500" />
                      <CardTitle>Gemini AI Corridor Risk</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refreshAiSafetyAssessment(true)}
                      disabled={isAiAnalyzing}
                      icon={isAiAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    >
                      {isAiAnalyzing ? 'Evaluating' : 'Refresh'}
                    </Button>
                  </div>
                  <CardDescription>
                    Explainable risk analysis powered by Google Gemini.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiAssessment ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-surface-500">Corridor Risk Level:</span>
                        <Badge
                          variant={
                            aiAssessment.riskLevel === 'low'
                              ? 'safe'
                              : aiAssessment.riskLevel === 'moderate'
                              ? 'brand'
                              : aiAssessment.riskLevel === 'elevated'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {aiAssessment.riskLevel.toUpperCase()} ({aiAssessment.riskScore}/100)
                        </Badge>
                      </div>

                      <p className="text-xs text-surface-700 dark:text-surface-300 font-medium leading-relaxed">
                        "{aiAssessment.summary}"
                      </p>

                      {aiAssessment.recommendations && aiAssessment.recommendations.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-surface-200 dark:border-surface-800">
                          <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">
                            Recommended Actions:
                          </span>
                          <ul className="space-y-1 text-xs text-surface-600 dark:text-surface-400">
                            {aiAssessment.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-brand-500 font-bold">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-surface-500">
                      Loading AI route analysis...
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            /* Journey Creation Form */
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-brand-500" />
                  <CardTitle>Route Setup & Routing</CardTitle>
                </div>
                <CardDescription>
                  Enter departure and destination points to calculate real road coordinates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStartJourneySubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                        Origin Point
                      </label>
                      <button
                        type="button"
                        onClick={handleUseCurrentGpsOrigin}
                        className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <Crosshair className="w-3 h-3" />
                        Use My Current GPS
                      </button>
                    </div>
                    <Input
                      value={origin}
                      onChange={e => setOrigin(e.target.value)}
                      placeholder="e.g. 4th Ave Tech Hub"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                      Target Destination
                    </label>
                    <Input
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      placeholder="e.g. North Ridge Apartments"
                      required
                    />
                  </div>

                  {/* Preset Quick Locations */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-medium text-surface-500">
                      Quick Preset Locations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(PRESET_LOCATIONS).map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectPresetDestination(key)}
                          className="px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[11px] text-surface-700 dark:text-surface-300 hover:bg-surface-200 transition-colors"
                        >
                          {PRESET_LOCATIONS[key].name.split('(')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                      Transport Mode
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'walking', label: 'Walk', icon: <Footprints className="w-4 h-4" /> },
                        { id: 'rideshare', label: 'Ride', icon: <Car className="w-4 h-4" /> },
                        { id: 'transit', label: 'Transit', icon: <Bus className="w-4 h-4" /> },
                        { id: 'cycling', label: 'Bike', icon: <Bike className="w-4 h-4" /> },
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMode(item.id as TransportMode)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                            mode === item.id
                              ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
                              : 'bg-surface-50/50 dark:bg-surface-950/30 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100/50'
                          }`}
                        >
                          {item.icon}
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cadence */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                      Check-In Cadence
                    </label>
                    <select
                      value={checkinInterval}
                      onChange={e => setCheckinInterval(Number(e.target.value))}
                      className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 text-xs px-3 py-2"
                    >
                      <option value={10}>Every 10 minutes (High Vigilance)</option>
                      <option value={15}>Every 15 minutes (Standard)</option>
                      <option value={20}>Every 20 minutes (Moderate)</option>
                      <option value={30}>Every 30 minutes (Familiar)</option>
                    </select>
                  </div>

                  {routingError && (
                    <div className="p-3 rounded-xl bg-danger-50 dark:bg-danger-950/40 border border-danger-500/40 text-xs text-danger-700 dark:text-danger-300">
                      {routingError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    disabled={isCalculatingRoute}
                    icon={isCalculatingRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  >
                    {isCalculatingRoute ? 'Calculating Road Route...' : 'Start Guarded Route'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

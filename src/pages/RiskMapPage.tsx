import React, { useState, useEffect } from 'react';
import {
  Shield,
  Phone,
  Navigation,
  RefreshCw,
  Info,
  MapPin,
  ThumbsUp,
  Sparkles,
  AlertTriangle,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { useJourney } from '../context/JourneyContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistanceKm, formatCoordinates } from '../utils/geo';
import { calculateRouteRiskPoints, RouteRiskPoint } from '../utils/routeRisk';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { SafeHaven, SafetyReport } from '../types';

// Map View Recenter Controller
const MapViewController: React.FC<{
  center: [number, number];
  zoom: number;
  triggerRecenter?: number;
}> = ({ center, zoom, triggerRecenter }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, triggerRecenter, map]);

  return null;
};

// Map Click Listener to Capture Coordinates on Empty Space
const MapClickHandler: React.FC<{
  onMapClick: (coords: { lat: number; lng: number }) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (e.latlng) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

const createDraftIcon = () =>
  L.divIcon({
    className: 'custom-draft-pin-marker',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: rgba(245, 158, 11, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 30px; height: 30px; border-radius: 50%; background-color: #f59e0b; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; z-index: 20;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });

// Custom Leaflet DivIcons (Vector SVG based)
const createUserIcon = () =>
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

const createHavenIcon = (type: SafeHaven['type']) => {
  const isPolice = type === 'police';
  const isHospital = type === 'hospital';
  const isPharmacy = type === 'pharmacy_247' || type === 'pharmacy';
  const bgColor = isPolice ? '#0284c7' : isHospital ? '#dc2626' : isPharmacy ? '#059669' : '#4f46e5';

  return L.divIcon({
    className: 'custom-haven-marker',
    html: `
      <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${bgColor}; border: 2.5px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const createIncidentIcon = (category: string, severity: SafetyReport['severity'], isRouteRisk: boolean = false) => {
  const isWarning = severity === 'warning';
  const isCaution = severity === 'caution';
  const isLighting = category === 'lighting';

  const bgColor = isWarning ? '#dc2626' : isCaution ? '#d97706' : isLighting ? '#ca8a04' : '#0284c7';

  return L.divIcon({
    className: isRouteRisk ? 'custom-route-risk-marker' : 'custom-incident-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        ${
          isRouteRisk
            ? `<div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background-color: ${bgColor}33; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
        }
        <div style="width: 30px; height: 30px; border-radius: 50%; background-color: ${bgColor}; border: ${
      isRouteRisk ? '3px solid #fbbf24' : '2.5px solid #ffffff'
    }; box-shadow: 0 4px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; z-index: 10;">
          ${
            isLighting
              ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`
              : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
          }
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export const RiskMapPage: React.FC = () => {
  const { journey, riskZones, safeHavens, reports, upvoteReport, aiAssessment, addSafetyReport } = useJourney();
  const { position, accuracy, status, error, retry, requestLocation } = useGeolocation({
    autoRequest: true,
  });

  const [filterLayer, setFilterLayer] = useState<'all' | 'safe_havens' | 'incidents' | 'lighting' | 'route_risks'>('all');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(riskZones[0].id);
  const [recenterCount, setRecenterCount] = useState(0);

  // Click-to-Report Draft Pin State
  const [draftCoordinates, setDraftCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Form Fields for Clicked Map Report
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<SafetyReport['category']>('lighting');
  const [formSeverity, setFormSeverity] = useState<SafetyReport['severity']>('advisory');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Default fallback center for demo safety mesh (San Francisco corridor)
  const defaultCenter: [number, number] = [37.7765, -122.4150];

  // Map center state: if user position is available, use real GPS; else use default center
  const activeMapCenter: [number, number] = position
    ? [position.latitude, position.longitude]
    : defaultCenter;

  const selectedZone = riskZones.find(z => z.id === selectedZoneId) || riskZones[0];

  // Calculate local deterministic route-risk points
  const activeRouteCoords = journey?.routeCoordinates && journey.routeCoordinates.length > 1
    ? journey.routeCoordinates
    : null;

  const routeRiskPoints: RouteRiskPoint[] = activeRouteCoords
    ? calculateRouteRiskPoints(
        activeRouteCoords,
        reports,
        position ? { lat: position.latitude, lng: position.longitude } : undefined,
        1200
      )
    : [];

  const handleLocateMe = () => {
    if (position) {
      setRecenterCount(prev => prev + 1);
    } else {
      requestLocation();
    }
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setDraftCoordinates(coords);
    setFormLocation(`${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° W`);
  };

  const handleCancelDraftPin = () => {
    setDraftCoordinates(null);
  };

  const handleOpenReportFromDraft = () => {
    setIsReportModalOpen(true);
  };

  const handleSubmitModalReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formLocation.trim() || !formDescription.trim()) return;

    const coordsToUse = draftCoordinates || {
      lat: position ? position.latitude : 37.7765,
      lng: position ? position.longitude : -122.4150,
    };

    addSafetyReport({
      title: formTitle.trim(),
      category: formCategory,
      severity: formSeverity,
      location: formLocation.trim(),
      coordinates: coordsToUse,
      description: formDescription.trim(),
    });

    // Reset and close
    setFormTitle('');
    setFormDescription('');
    setDraftCoordinates(null);
    setIsReportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Layer Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
              Contextual Risk Radar
            </h2>
            <Badge variant="brand" size="sm">
              Live Geospatial Mesh
            </Badge>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            OpenStreetMap radar highlighting community hazard alerts, verified safe havens, and real GPS position.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocateMe}
            icon={<Navigation className="w-3.5 h-3.5 text-brand-500" />}
          >
            Center on GPS
          </Button>
        </div>
      </div>

      {/* Layer Filter Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-xs font-semibold text-surface-500 shrink-0 mr-1">Filter Radar:</span>
        {[
          { id: 'all', label: 'All Markers' },
          { id: 'safe_havens', label: `Safe Havens (${safeHavens.length})` },
          { id: 'incidents', label: `Community Reports (${reports.length})` },
          { id: 'lighting', label: 'Dark / Lighting Issues' },
          { id: 'route_risks', label: `Corridor Risks (${routeRiskPoints.length})` },
        ].map(filter => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setFilterLayer(filter.id as any)}
            className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-all ${
              filterLayer === filter.id
                ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Interactive Map + Context Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container */}
        <div className="lg:col-span-8 relative">
          <div className="h-[560px] sm:h-[620px] rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-sm relative z-0">
            <MapContainer
              center={activeMapCenter}
              zoom={14}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapViewController center={activeMapCenter} zoom={14} triggerRecenter={recenterCount} />
              <MapClickHandler onMapClick={handleMapClick} />

              {/* User GPS Live Position Marker */}
              {position && (
                <>
                  <Marker
                    position={[position.latitude, position.longitude]}
                    icon={createUserIcon()}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs">
                        <div className="font-bold text-surface-900">Your Live GPS Location</div>
                        <div className="font-mono text-[11px] text-surface-500">
                          {position.latitude.toFixed(5)}° N, {position.longitude.toFixed(5)}° W
                        </div>
                        {accuracy !== null && (
                          <div className="text-[10px] text-surface-400">
                            Accuracy radius: ±{Math.round(accuracy)}m
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>

                  {/* Accuracy buffer circle */}
                  {accuracy && accuracy < 200 && (
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

              {/* Click-to-Pin Draft Marker */}
              {draftCoordinates && (
                <Marker
                  position={[draftCoordinates.lat, draftCoordinates.lng]}
                  icon={createDraftIcon()}
                >
                  <Popup>
                    <div className="p-2 space-y-2 text-xs max-w-[200px]">
                      <div className="font-bold text-amber-800">Pin Placed on Map</div>
                      <div className="font-mono text-[11px] text-surface-600">
                        {draftCoordinates.lat.toFixed(5)}°, {draftCoordinates.lng.toFixed(5)}°
                      </div>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={handleOpenReportFromDraft}
                          className="w-full py-1 px-2 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] text-center"
                        >
                          Report Incident Here
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelDraftPin}
                          className="w-full py-0.5 text-[10px] text-surface-500 hover:text-surface-800 text-center"
                        >
                          Remove Pin
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Active Journey Route Polyline (if active) */}
              {journey && journey.status === 'active' && journey.routeCoordinates && (
                <Polyline
                  positions={journey.routeCoordinates}
                  pathOptions={{
                    color: journey.deviationDetected ? '#dc2626' : '#2563eb',
                    weight: 5,
                    opacity: 0.85,
                    dashArray: journey.deviationDetected ? '6, 8' : undefined,
                  }}
                />
              )}

              {/* Safe Havens Layer */}
              {(filterLayer === 'all' || filterLayer === 'safe_havens') &&
                safeHavens.map(haven => (
                  <Marker
                    key={haven.id}
                    position={[haven.coordinates.lat, haven.coordinates.lng]}
                    icon={createHavenIcon(haven.type)}
                  >
                    <Popup>
                      <div className="p-1 space-y-1.5 text-xs max-w-[220px]">
                        <div className="font-bold text-surface-900">{haven.name}</div>
                        <div className="text-[11px] text-surface-600">{haven.address}</div>
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <Badge variant="safe" size="sm">
                            {haven.isOpen24Hours ? 'Open 24/7' : 'Standard Hours'}
                          </Badge>
                          <a
                            href={`tel:${haven.phoneNumber}`}
                            className="font-semibold text-brand-600 hover:underline"
                          >
                            {haven.phoneNumber}
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {/* Community Reports Layer */}
              {(filterLayer === 'all' || filterLayer === 'incidents' || filterLayer === 'lighting' || filterLayer === 'route_risks') &&
                reports
                  .filter(rep => {
                    if (filterLayer === 'lighting') return rep.category === 'lighting';
                    if (filterLayer === 'route_risks') {
                      return routeRiskPoints.some(r => r.reportId === rep.id);
                    }
                    return true;
                  })
                  .map(report => {
                    const isRiskPoint = routeRiskPoints.some(r => r.reportId === report.id);
                    return (
                      <Marker
                        key={report.id}
                        position={[report.coordinates.lat, report.coordinates.lng]}
                        icon={createIncidentIcon(report.category, report.severity, isRiskPoint)}
                      >
                        <Popup>
                          <div className="p-1 space-y-2 text-xs max-w-[220px]">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={
                                  report.severity === 'warning'
                                    ? 'danger'
                                    : report.severity === 'caution'
                                    ? 'warning'
                                    : 'neutral'
                                }
                                size="sm"
                              >
                                {report.category.toUpperCase()}
                              </Badge>
                              <span className="text-[10px] text-surface-400">{report.timeAgo}</span>
                            </div>
                            <div className="font-bold text-surface-900 leading-tight">
                              {report.title}
                            </div>
                            <p className="text-[11px] text-surface-600">{report.description}</p>
                            <div className="flex items-center justify-between pt-1 border-t border-surface-200">
                              <span className="text-[10px] text-surface-500 font-mono">
                                {report.upvotes} verified votes
                              </span>
                              <button
                                type="button"
                                onClick={() => upvoteReport(report.id)}
                                className="text-[11px] font-semibold text-brand-600 hover:underline"
                              >
                                Upvote
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
            </MapContainer>

            {/* Click-to-Pin Instruction Banner on Map */}
            <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
              <div className="px-3 py-1.5 rounded-lg bg-surface-900/85 backdrop-blur-md text-white text-[11px] font-medium border border-surface-700 shadow-md flex items-center gap-1.5 pointer-events-auto">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Click anywhere on the map to drop an observation pin</span>
              </div>
            </div>

            {/* Floating Draft Pin Control (appears when a draft pin is placed) */}
            {draftCoordinates && (
              <div className="absolute bottom-4 left-4 right-4 z-[1000] p-3.5 rounded-xl bg-surface-900/95 backdrop-blur-md text-white border border-amber-500/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-amber-400">
                    <MapPin className="w-4 h-4" />
                    <span>Observation Pin Placed: {formatCoordinates(draftCoordinates.lat, draftCoordinates.lng)}</span>
                  </div>
                  <p className="text-[11px] text-surface-300">
                    Ready to log a safety observation at these exact geographic coordinates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelDraftPin}
                    className="text-surface-300 hover:text-white"
                  >
                    Cancel Pin
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenReportFromDraft}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                  >
                    Report Hazard Here
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Safety Corridor & Live Signals */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live GPS Telemetry Status */}
          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-brand-500" />
                GPS Telemetry Stream
              </span>
              <Badge
                variant={
                  status === 'active'
                    ? 'safe'
                    : status === 'requesting'
                    ? 'warning'
                    : status === 'denied'
                    ? 'danger'
                    : 'neutral'
                }
                size="sm"
              >
                {status === 'active'
                  ? 'LIVE GPS'
                  : status === 'requesting'
                  ? 'ACQUIRING'
                  : status === 'denied'
                  ? 'PERMISSION DENIED'
                  : 'STANDBY'}
              </Badge>
            </div>
            <p className="text-[11px] text-surface-500 leading-relaxed">
              {status === 'active' && position
                ? `Position fix: ${position.latitude.toFixed(5)}° N, ${position.longitude.toFixed(5)}° W (accuracy ±${Math.round(accuracy || 15)}m)`
                : error || 'Click "Enable Location" to show your real-time position on the safety radar.'}
            </p>
            {status !== 'active' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={retry}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                className="w-full mt-1"
              >
                {status === 'denied' ? 'Try Again' : 'Enable Location'}
              </Button>
            ) : null}
          </div>

          {/* AI Route Corridor Intelligence (if journey active) */}
          {journey && journey.status === 'active' && journey.routeCoordinates && journey.routeCoordinates.length > 0 && (
            <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-500/30 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-brand-700 dark:text-brand-300">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Route Corridor Analysis</span>
                </div>
                <Badge variant={journey.deviationDetected ? 'danger' : 'safe'} size="sm">
                  {journey.deviationDetected ? 'DEVIATING' : 'CORRIDOR ACTIVE'}
                </Badge>
              </div>

              <div className="p-2.5 rounded-lg bg-white/80 dark:bg-surface-900/80 border border-brand-500/20 text-[11px] text-surface-600 dark:text-surface-300 leading-relaxed">
                {aiAssessment?.summary || 'SafeCircle AI continuously monitors community hazards and lighting along your active route.'}
              </div>

              {routeRiskPoints.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-surface-700 dark:text-surface-300">
                    {routeRiskPoints.length} Hazard Signals Along Corridor:
                  </div>
                  {routeRiskPoints.map(pt => (
                    <div
                      key={pt.reportId}
                      className="p-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-surface-900 dark:text-surface-100">{pt.reportTitle}</span>
                        <div className="text-[10px] text-surface-500 capitalize">
                          {pt.category} • {pt.distanceToRouteMeters}m from road
                        </div>
                      </div>
                      <Badge
                        variant={pt.severity === 'warning' ? 'danger' : pt.severity === 'caution' ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        {pt.proximity.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick List of Nearby Safe Havens */}
          <div className="p-4 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-safe-500" />
                Nearby Verified Havens
              </span>
              <span className="text-[11px] text-surface-400 font-mono">{safeHavens.length} active</span>
            </div>

            <div className="space-y-2">
              {safeHavens.slice(0, 3).map(haven => (
                <div
                  key={haven.id}
                  className="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-950/60 border border-surface-200 dark:border-surface-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-surface-900 dark:text-surface-100">{haven.name}</span>
                    <span className="text-[10px] font-mono text-surface-500">{haven.distanceKm} km</span>
                  </div>
                  <div className="text-[11px] text-surface-500">{haven.address}</div>
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="safe" size="sm">
                      {haven.isOpen24Hours ? '24/7 Accessible' : 'Open'}
                    </Badge>
                    <a
                      href={`tel:${haven.phoneNumber}`}
                      className="text-[11px] font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{haven.phoneNumber}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map Click-to-Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Hazard at Pinned Location"
        description="Share a safety observation tagged to your clicked map coordinates."
      >
        <form onSubmit={handleSubmitModalReport} className="space-y-4">
          <Input
            label="Observation Title"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="e.g. Streetlights extinguished along park pathway"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Hazard Category"
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as any)}
              options={[
                { value: 'lighting', label: 'Dark / Missing Streetlights' },
                { value: 'suspicious', label: 'Suspicious Activity / Loitering' },
                { value: 'infrastructure', label: 'Damaged Infrastructure / Debris' },
                { value: 'transit', label: 'Transit Delay / Outage' },
                { value: 'harassment', label: 'Harassment / Unsafe Corridor' },
              ]}
            />

            <Select
              label="Advisory Severity"
              value={formSeverity}
              onChange={e => setFormSeverity(e.target.value as any)}
              options={[
                { value: 'advisory', label: 'Advisory (General Info)' },
                { value: 'caution', label: 'Caution (Be Aware)' },
                { value: 'warning', label: 'Warning (Urgent / Avoid Zone)' },
              ]}
            />
          </div>

          <Input
            label="Location Description / Coordinates"
            value={formLocation}
            onChange={e => setFormLocation(e.target.value)}
            placeholder="e.g. Near Market St & 8th intersection"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-700 dark:text-surface-300">
              Details & Advice for Other Travelers
            </label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg text-xs bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 p-2.5 text-surface-900 dark:text-surface-100"
              placeholder="Describe the condition, exact landmarks, or precautions..."
              required
            />
          </div>

          <Switch
            checked={isAnonymous}
            onChange={setIsAnonymous}
            label="Submit Anonymously"
            description="Your name and account identity will not be attached to this report."
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Publish Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

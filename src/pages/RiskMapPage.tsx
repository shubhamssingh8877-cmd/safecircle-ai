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
  const isPharmacy = type === 'pharmacy';
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
    setFormLocation(`Pinned Location (${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°)`);
  };

  const handleOpenModalFromDraft = () => {
    if (!draftCoordinates) return;
    setIsReportModalOpen(true);
  };

  const handleCancelDraft = () => {
    setDraftCoordinates(null);
  };

  const handleSubmitMapReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !draftCoordinates) return;

    addSafetyReport({
      title: formTitle,
      category: formCategory,
      severity: formSeverity,
      location: formLocation || `Near ${draftCoordinates.lat.toFixed(4)}°, ${draftCoordinates.lng.toFixed(4)}°`,
      coordinates: draftCoordinates,
      description: formDescription || 'Observed by traveler and pinned directly to the safety map.',
    });

    // Reset Form
    setFormTitle('');
    setFormLocation('');
    setFormDescription('');
    setDraftCoordinates(null);
    setIsReportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
              Contextual Risk Radar & Safe Havens
            </h2>
            <Badge variant="brand" size="sm">
              Live Map Engine
            </Badge>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            OpenStreetMap geospatial layer featuring verified 24/7 safe havens, crowd hazard pins, and AI risk scoring.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-100 dark:bg-surface-800/80 rounded-xl border border-surface-200/80 dark:border-surface-700/80">
          {[
            { id: 'all', label: 'All Layers' },
            { id: 'safe_havens', label: 'Safe Havens (24/7)' },
            { id: 'incidents', label: 'Hazard Pins' },
            { id: 'lighting', label: 'Streetlight Radar' },
            { id: 'route_risks', label: 'Route Corridor Risks' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterLayer(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterLayer === tab.id
                  ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Container Card */}
      <Card className="overflow-hidden p-0 border-surface-200 dark:border-surface-800">
        <div className="relative h-[540px] sm:h-[620px] w-full bg-surface-100 dark:bg-surface-950">
          {/* Leaflet Map */}
          <MapContainer
            center={activeMapCenter}
            zoom={14}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Recenter controller */}
            <MapViewController center={activeMapCenter} zoom={14} triggerRecenter={recenterCount} />

            {/* Map click listener */}
            <MapClickHandler onMapClick={handleMapClick} />

            {/* Active Journey Route Polyline (if present) */}
            {activeRouteCoords && (
              <Polyline
                positions={activeRouteCoords}
                pathOptions={{
                  color: journey?.deviationDetected ? '#dc2626' : '#059669',
                  weight: 5,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}

            {/* User GPS Live Marker */}
            {position && (
              <>
                <Marker
                  position={[position.latitude, position.longitude]}
                  icon={createUserIcon()}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <strong className="text-brand-600 block">Your Verified GPS Location</strong>
                      <p>
                        {position.latitude.toFixed(5)}° N, {position.longitude.toFixed(5)}° W
                      </p>
                      {accuracy && (
                        <p className="text-[10px] text-surface-500">
                          Accuracy Radius: ±{Math.round(accuracy)}m
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

            {/* Click-to-Report Draft Pin Marker */}
            {draftCoordinates && (
              <Marker
                position={[draftCoordinates.lat, draftCoordinates.lng]}
                icon={createDraftIcon()}
              >
                <Popup autoPan={true}>
                  <div className="text-xs space-y-2 p-1 min-w-[200px]">
                    <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>Pin Location Selected</span>
                    </div>
                    <p className="text-[11px] text-surface-600 dark:text-surface-300 font-mono">
                      {draftCoordinates.lat.toFixed(5)}° N, {draftCoordinates.lng.toFixed(5)}° W
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleOpenModalFromDraft}
                        className="px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[11px] transition-colors"
                      >
                        Report Hazard Here
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelDraft}
                        className="px-2 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-[11px] transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
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
                    <div className="text-xs space-y-1.5 max-w-[220px]">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-surface-900 block font-bold truncate">
                          {haven.name}
                        </strong>
                        <Badge variant="brand" size="sm">
                          {haven.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-surface-600 text-[11px]">{haven.address}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-surface-200 text-[10px]">
                        <span className="text-safe-600 font-semibold">
                          {haven.isOpen24Hours ? '● Open 24/7' : 'Standard Hours'}
                        </span>
                        <a
                          href={`tel:${haven.phoneNumber}`}
                          className="text-brand-600 font-bold hover:underline"
                        >
                          Call Direct
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Safety Hazard Reports Layer */}
            {(filterLayer === 'all' || filterLayer === 'incidents' || filterLayer === 'lighting') &&
              reports
                .filter(rep => (filterLayer === 'lighting' ? rep.category === 'lighting' : true))
                .map(rep => (
                  <Marker
                    key={rep.id}
                    position={[rep.coordinates.lat, rep.coordinates.lng]}
                    icon={createIncidentIcon(rep.category, rep.severity)}
                  >
                    <Popup>
                      <div className="text-xs space-y-2 max-w-[220px]">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant={
                              rep.severity === 'warning'
                                ? 'danger'
                                : rep.severity === 'caution'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {rep.category.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-surface-400 font-mono">
                            {rep.timeAgo}
                          </span>
                        </div>
                        <strong className="text-surface-900 font-semibold block">
                          {rep.title}
                        </strong>
                        <p className="text-surface-600 text-[11px] leading-relaxed">
                          {rep.description}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-surface-200 text-[10px]">
                          <span className="text-surface-500">{rep.location}</span>
                          <button
                            type="button"
                            onClick={() => upvoteReport(rep.id)}
                            className="flex items-center gap-1 text-brand-600 font-bold hover:underline"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{rep.upvotes}</span>
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
          </MapContainer>

          {/* Floating Map Controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleLocateMe}
              className="p-2.5 rounded-xl bg-white/90 dark:bg-surface-900/90 backdrop-blur-md shadow-md border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:text-brand-600 transition-colors"
              title="Locate Device GPS"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>

          {/* Click to Report Help Pill */}
          <div className="absolute top-3 left-3 z-10 p-2.5 rounded-xl bg-white/90 dark:bg-surface-900/90 backdrop-blur-md border border-surface-200/80 dark:border-surface-800/80 shadow-md flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-surface-600 dark:text-surface-300">
              {draftCoordinates ? 'Pin selected! Tap "Report Hazard Here"' : 'Click anywhere on map to pin a hazard'}
            </span>
          </div>

          {/* Live Floating Draft Banner when coordinates pinned */}
          {draftCoordinates && (
            <div className="absolute bottom-3 left-3 right-3 z-10 p-3 rounded-xl bg-amber-500 text-white shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block">Pin Placed at Coordinates</span>
                  <span className="font-mono text-[11px] opacity-90">
                    {draftCoordinates.lat.toFixed(5)}° N, {draftCoordinates.lng.toFixed(5)}° W
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenModalFromDraft}
                  className="bg-white text-surface-900 hover:bg-surface-100 font-bold"
                >
                  Create Incident Report Here
                </Button>
                <button
                  type="button"
                  onClick={handleCancelDraft}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white transition-colors"
                >
                  Clear Pin
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Click-to-Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Safety Hazard at Pinned Location"
        description="Submit crowd-sourced observation to protect other solo travelers in your area."
      >
        <form onSubmit={handleSubmitMapReport} className="space-y-4">
          {draftCoordinates && (
            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 text-xs flex items-center justify-between">
              <span className="text-surface-500">Pinned Geographic Anchor:</span>
              <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">
                {draftCoordinates.lat.toFixed(5)}° N, {draftCoordinates.lng.toFixed(5)}° W
              </span>
            </div>
          )}

          <Input
            label="Incident / Hazard Title"
            placeholder="e.g. Streetlamp outage on north sidewalk"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Hazard Category"
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as any)}
              options={[
                { value: 'lighting', label: 'Streetlight / Low Visibility' },
                { value: 'suspicious', label: 'Suspicious Activity' },
                { value: 'infrastructure', label: 'Broken Sidewalk / Construction' },
                { value: 'transit', label: 'Transit Stop Concern' },
                { value: 'harassment', label: 'Harassment / Safety Concern' },
              ]}
            />

            <Select
              label="Advisory Severity"
              value={formSeverity}
              onChange={e => setFormSeverity(e.target.value as any)}
              options={[
                { value: 'advisory', label: 'Advisory (General Info)' },
                { value: 'caution', label: 'Caution (Moderate Detour)' },
                { value: 'warning', label: 'Warning (Avoid Corridor)' },
              ]}
            />
          </div>

          <Input
            label="Location Description"
            placeholder="e.g. Near 5th & Market crosswalk"
            value={formLocation}
            onChange={e => setFormLocation(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Detailed Description
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Describe what you observed so nearby travelers and guardians can take precautions..."
              className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 text-xs p-3 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Publish Safety Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

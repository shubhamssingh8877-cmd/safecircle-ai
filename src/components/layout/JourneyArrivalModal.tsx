import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  AlertTriangle,
  Footprints,
  Car,
  Bus,
  Bike,
  Sparkles,
  Plus,
  ShieldAlert,
  Activity,
  Navigation,
  FileCheck2,
} from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const JourneyArrivalModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    journey,
    isArrivalModalOpen,
    closeArrivalModal,
    finishAndArchiveJourney,
    activeSosEvent,
    openSosModal,
    aiAssessment,
    reports,
  } = useJourney();

  if (!isArrivalModalOpen || !journey) return null;

  const modeIcons: Record<string, React.ReactNode> = {
    walking: <Footprints className="w-4 h-4" />,
    rideshare: <Car className="w-4 h-4" />,
    transit: <Bus className="w-4 h-4" />,
    driving: <Car className="w-4 h-4" />,
    cycling: <Bike className="w-4 h-4" />,
  };

  // Check-in counts
  const confirmedCheckIns = journey.recentCheckIns.filter(c => c.status === 'confirmed').length;
  const snoozedCheckIns = journey.recentCheckIns.filter(c => c.status === 'snoozed').length;
  const missedCheckIns = journey.recentCheckIns.filter(c => c.status === 'missed').length;

  // Real route distance and duration calculations
  const routeDistanceFormatted = journey.distanceMeters
    ? `${(journey.distanceMeters / 1000).toFixed(2)} km`
    : 'Not available';

  const routeDurationFormatted = journey.durationSeconds
    ? `${Math.ceil(journey.durationSeconds / 60)} mins`
    : 'Not available';

  const arrivalTimeFormatted = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate corridor incident count
  const nearbyIncidentsCount = reports.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm transition-opacity"
        onClick={closeArrivalModal}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-safe-600 via-emerald-600 to-teal-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Journey Arrival Summary</span>
                  <Badge variant="safe" size="sm" className="bg-white/25 text-white border-white/40">
                    Destination Reached
                  </Badge>
                </h2>
                <p className="text-xs text-white/80">
                  Review your safety metrics, check-in history, and corridor telemetry before archiving.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 text-xs font-mono text-white/90">
              <Clock className="w-3.5 h-3.5" />
              <span>Arrived at {arrivalTimeFormatted}</span>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Active SOS Warning Barrier */}
          {activeSosEvent && (
            <div className="p-4 rounded-xl bg-danger-50 dark:bg-danger-950/40 border-2 border-danger-500 text-danger-900 dark:text-danger-200 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-danger-700 dark:text-danger-300 text-sm">
                <ShieldAlert className="w-5 h-5 text-danger-600 shrink-0" />
                <span>Unresolved Emergency SOS Active</span>
              </div>
              <p className="text-xs text-danger-700 dark:text-danger-300">
                SafeCircle cannot archive an active journey while an emergency SOS escalation is in progress. Please resolve the emergency protocol on your emergency desk first.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    closeArrivalModal();
                    openSosModal();
                  }}
                  icon={<ShieldAlert className="w-4 h-4" />}
                >
                  Open Emergency Desk & Resolve SOS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeArrivalModal}
                >
                  Back to Journey
                </Button>
              </div>
            </div>
          )}

          {/* Route Overview */}
          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-950/60 border border-surface-200 dark:border-surface-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Planned Corridor
              </span>
              <div className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-surface-300 capitalize font-medium">
                {modeIcons[journey.mode]}
                <span>{journey.mode} Mode</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-brand-500 mt-1 shrink-0" />
                <div>
                  <span className="text-surface-500 text-[11px]">Origin: </span>
                  <span className="font-semibold text-surface-900 dark:text-surface-100">{journey.origin}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-safe-500 mt-1 shrink-0" />
                <div>
                  <span className="text-surface-500 text-[11px]">Destination: </span>
                  <span className="font-semibold text-surface-900 dark:text-surface-100">{journey.destination}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Grid Key Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950/60 border border-surface-200 dark:border-surface-800 space-y-1">
              <div className="text-[11px] text-surface-500 font-medium flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-brand-500" />
                <span>Distance</span>
              </div>
              <div className="text-sm font-bold font-mono text-surface-900 dark:text-surface-100">
                {routeDistanceFormatted}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950/60 border border-surface-200 dark:border-surface-800 space-y-1">
              <div className="text-[11px] text-surface-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                <span>Est. Duration</span>
              </div>
              <div className="text-sm font-bold font-mono text-surface-900 dark:text-surface-100">
                {routeDurationFormatted}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950/60 border border-surface-200 dark:border-surface-800 space-y-1">
              <div className="text-[11px] text-surface-500 font-medium flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>Route Deviations</span>
              </div>
              <div className="text-sm font-bold font-mono text-surface-900 dark:text-surface-100">
                {journey.deviationDetected
                  ? `${Math.round(journey.distanceFromRouteMeters || 0)}m off track`
                  : '0 (Corridor Kept)'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950/60 border border-surface-200 dark:border-surface-800 space-y-1">
              <div className="text-[11px] text-surface-500 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-safe-500" />
                <span>Safety Rating</span>
              </div>
              <div className="text-sm font-bold text-safe-600 dark:text-safe-400 font-mono">
                {journey.safetyScore ?? 92}/100 ({journey.riskLevel.toUpperCase()})
              </div>
            </div>
          </div>

          {/* Autonomous Check-In Summary Section */}
          <div className="p-4 rounded-xl border border-brand-500/20 bg-brand-50/40 dark:bg-brand-950/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-brand-500" />
                <span>Autonomous Check-in History</span>
              </h3>
              <Badge variant="brand" size="sm">
                Every {journey.checkInIntervalMinutes} mins
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <div className="text-safe-600 dark:text-safe-400 font-bold text-sm">
                  {confirmedCheckIns}
                </div>
                <div className="text-[10px] text-surface-500 font-medium mt-0.5">
                  ✓ Confirmed Safe
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <div className="text-amber-600 dark:text-amber-400 font-bold text-sm">
                  {snoozedCheckIns}
                </div>
                <div className="text-[10px] text-surface-500 font-medium mt-0.5">
                  ⏰ Snoozed (+5m)
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <div className="text-rose-600 dark:text-rose-400 font-bold text-sm">
                  {missedCheckIns}
                </div>
                <div className="text-[10px] text-surface-500 font-medium mt-0.5">
                  ⚠️ Missed Pings
                </div>
              </div>
            </div>
          </div>

          {/* AI Safety Assessment & Corridor Reports */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* AI Safety Analysis Summary */}
            <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-950/60 border border-surface-200 dark:border-surface-800 space-y-1.5">
              <div className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>AI Corridor Assessment</span>
              </div>
              <p className="text-[11px] text-surface-600 dark:text-surface-400 leading-relaxed">
                {aiAssessment?.isAiAvailable && aiAssessment.summary
                  ? aiAssessment.summary
                  : 'Safety assessment unavailable'}
              </p>
              {aiAssessment?.routeRecommendation && (
                <div className="text-[10px] text-brand-700 dark:text-brand-300 pt-1 border-t border-surface-200 dark:border-surface-800">
                  <strong>Recommendation:</strong> {aiAssessment.routeRecommendation}
                </div>
              )}
            </div>

            {/* Nearby Incident Reports Count */}
            <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-950/60 border border-surface-200 dark:border-surface-800 space-y-1.5">
              <div className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Corridor Incident Reports</span>
              </div>
              <p className="text-[11px] text-surface-600 dark:text-surface-400 leading-relaxed">
                {nearbyIncidentsCount > 0
                  ? `${nearbyIncidentsCount} community safety observations evaluated along your travel area.`
                  : 'No incidents reported along route'}
              </p>
              <div className="pt-1 border-t border-surface-200 dark:border-surface-800">
                <button
                  type="button"
                  onClick={() => {
                    closeArrivalModal();
                    navigate('/reports');
                  }}
                  className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Report an Observation</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 bg-surface-50 dark:bg-surface-950/90 border-t border-surface-200 dark:border-surface-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={closeArrivalModal}
            className="w-full sm:w-auto"
          >
            Back to Journey
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                closeArrivalModal();
                navigate('/reports');
              }}
              icon={<Plus className="w-4 h-4 text-brand-500" />}
              className="w-full sm:w-auto text-xs"
            >
              Report Observation
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={finishAndArchiveJourney}
              disabled={Boolean(activeSosEvent)}
              icon={<CheckCircle2 className="w-4 h-4" />}
              className="w-full sm:w-auto font-bold bg-safe-600 hover:bg-safe-500 text-white"
            >
              Finish & Archive Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

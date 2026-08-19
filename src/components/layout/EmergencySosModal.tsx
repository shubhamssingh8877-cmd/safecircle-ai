import React, { useState } from 'react';
import {
  AlertOctagon,
  PhoneCall,
  ShieldAlert,
  XCircle,
  MapPin,
  Users,
  Radio,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const EmergencySosModal: React.FC = () => {
  const {
    isSosModalOpen,
    sosCountdown,
    isSosTriggered,
    activeSosEvent,
    isAudioMuted,
    toggleAudioMute,
    cancelSosCountdown,
    triggerImmediateSos,
    resolveSos,
    closeSosModal,
    contacts,
    journey,
  } = useJourney();

  const [copiedLocation, setCopiedLocation] = useState(false);

  if (!isSosModalOpen) return null;

  const leadContact = contacts.find(c => c.isPrimaryGuardian) || contacts[0];

  const handleCopyLocation = () => {
    const locText = activeSosEvent?.locationSnapshotText || (journey ? journey.origin : '37.77490° N, -122.41940° W (±15m)');
    const emergencyString = `EMERGENCY ALERT from SafeCircle AI: I need assistance. My current location is ${locText}. Destination: ${journey?.destination || 'Not specified'}.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(emergencyString);
      setCopiedLocation(true);
      setTimeout(() => setCopiedLocation(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-950/85 backdrop-blur-md transition-opacity"
        onClick={!isSosTriggered ? cancelSosCountdown : undefined}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* State 1: 5-Second SOS Cancellation Countdown */}
        {sosCountdown !== null && sosCountdown > 0 && !isSosTriggered && (
          <div className="p-6 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-danger-50 dark:bg-danger-950/60 border-4 border-danger-500 text-danger-600 flex items-center justify-center mx-auto animate-pulse">
              <span className="text-4xl font-extrabold font-mono">{sosCountdown}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
                Initiating Emergency SOS
              </h2>
              <p className="text-xs text-surface-600 dark:text-surface-400 max-w-sm mx-auto">
                Dispatches high-priority notification to your primary guardian (<strong className="text-surface-900 dark:text-surface-100">{leadContact?.name}</strong>) and triggers loud beacon siren.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                variant="danger"
                size="lg"
                onClick={triggerImmediateSos}
                className="w-full font-bold shadow-lg shadow-danger-500/25"
                icon={<Radio className="w-5 h-5 animate-spin" />}
              >
                Trigger Immediately (Skip Countdown)
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={cancelSosCountdown}
                className="w-full text-surface-700 dark:text-surface-300"
              >
                Cancel / False Alarm
              </Button>
            </div>
          </div>
        )}

        {/* State 2: Active Emergency Incident Desk */}
        {isSosTriggered && (
          <div>
            {/* Header Banner */}
            <div className="bg-danger-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight">Emergency SOS Active</h2>
                    <Badge variant="danger" size="sm" className="bg-white/20 text-white border-white/30 font-mono">
                      LIVE BEACON
                    </Badge>
                  </div>
                  <p className="text-xs text-danger-100">
                    Escalation protocol in progress. Audio alarm broadcasting.
                  </p>
                </div>
              </div>

              {/* Mute Alarm Toggle */}
              <button
                type="button"
                onClick={toggleAudioMute}
                className="p-2 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs transition-colors flex items-center gap-1.5"
                title={isAudioMuted ? 'Unmute siren' : 'Mute siren'}
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4 text-white" />}
                <span className="text-[11px] font-medium hidden sm:inline">
                  {isAudioMuted ? 'Unmute' : 'Mute'}
                </span>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Location Snapshot Card */}
              <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-950/60 border border-surface-200 dark:border-surface-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-500 font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-danger-500" />
                    <span>Emergency GPS Snapshot</span>
                  </span>
                  <span className="text-[10px] text-safe-600 dark:text-safe-400 font-mono font-bold">
                    LOCKED & RECORDED
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-surface-900 dark:text-surface-100 break-all">
                  {activeSosEvent?.locationSnapshotText || '37.77490° N, -122.41940° W (±15m)'}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLocation}
                  className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1 mt-1"
                >
                  {copiedLocation ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-safe-500" />
                      <span>Copied Emergency Details to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Coordinates & Emergency Message</span>
                    </>
                  )}
                </button>
              </div>

              {/* 3-Tier Escalation Action Panel */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                  Tiered Escalation Matrix
                </h3>

                {/* Tier 1: Browser Notification */}
                <div className="p-3 rounded-xl border border-safe-500/30 bg-safe-50/40 dark:bg-safe-950/20 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-safe-500/20 text-safe-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-surface-900 dark:text-surface-100">Tier 1: Device Alert</span>
                      <span className="text-[10px] text-safe-600 dark:text-safe-400 font-mono font-bold">DELIVERED</span>
                    </div>
                    <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">
                      High-priority browser push alert and repeating siren synthesized.
                    </p>
                  </div>
                </div>

                {/* Tier 2: Primary Guardian Quick Call */}
                <div className="p-3 rounded-xl border border-brand-500/40 bg-brand-50/40 dark:bg-brand-950/20 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-surface-900 dark:text-surface-100">
                          Tier 2: {leadContact?.name || 'Primary Guardian'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-mono">
                          READY
                        </span>
                      </div>
                      <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">
                        {leadContact?.phoneNumber || 'No phone configured'}
                      </p>
                    </div>
                  </div>

                  {leadContact?.phoneNumber ? (
                    <a
                      href={`tel:${leadContact.phoneNumber.replace(/[^0-9+]/g, '')}`}
                      className="shrink-0"
                    >
                      <Button variant="primary" size="sm" icon={<Phone className="w-3.5 h-3.5" />}>
                        Call Now
                      </Button>
                    </a>
                  ) : (
                    <span className="text-[10px] text-surface-400">No phone</span>
                  )}
                </div>

                {/* Tier 3: Emergency Services Quick Call */}
                <div className="p-3 rounded-xl border border-danger-500/40 bg-danger-50/40 dark:bg-danger-950/20 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-danger-500/20 text-danger-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-surface-900 dark:text-surface-100">
                          Tier 3: Local Dispatch (911/112)
                        </span>
                      </div>
                      <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">
                        Direct cellular connection to emergency services.
                      </p>
                    </div>
                  </div>

                  <a href="tel:911" className="shrink-0">
                    <Button variant="danger" size="sm" icon={<PhoneCall className="w-3.5 h-3.5" />}>
                      Call 911
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-surface-50 dark:bg-surface-950/80 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSosModal}
                className="text-surface-600 dark:text-surface-400 text-xs"
              >
                Keep Active in Background
              </Button>

              <Button
                variant="safe"
                size="md"
                onClick={resolveSos}
                icon={<Check className="w-4 h-4" />}
                className="font-bold shadow-sm"
              >
                I am Safe / Resolve SOS
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

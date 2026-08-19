import React, { useState } from 'react';
import {
  Shield,
  Radio,
  Sliders,
  Moon,
  Sun,
  Heart,
  Save,
  CheckCircle2,
  Sparkles,
  Key,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';

export const SettingsPage: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    userProfile,
    updateUserProfile,
    customApiKey,
    setCustomApiKey,
    aiAssessment,
    refreshAiSafetyAssessment,
    openSosModal,
    requestNotifications,
  } = useJourney();
  const { theme, setTheme } = useTheme();

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Local editable settings
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey);
  const [checkinInterval, setCheckinInterval] = useState(preferences.defaultCheckinIntervalMinutes);
  const [deviationSensitivity, setDeviationSensitivity] = useState(preferences.routeDeviationSensitivity);
  const [stealthTrigger, setStealthTrigger] = useState(preferences.stealthTriggerMethod);
  const [stealthEnabled, setStealthEnabled] = useState(preferences.stealthSosEnabled);
  const [audioRecording, setAudioRecording] = useState(preferences.audioRecordingOnSos);
  const [batteryShare, setBatteryShare] = useState(preferences.autoShareBatteryLevel);
  const [autoEscalateCount, setAutoEscalateCount] = useState(preferences.autoEscalateAfterMissedCount);

  // Medical notes
  const [medicalNotes, setMedicalNotes] = useState(userProfile.medicalNotes);
  const [bloodType, setBloodType] = useState(userProfile.bloodType);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiKey(apiKeyInput);
    updatePreferences({
      defaultCheckinIntervalMinutes: checkinInterval,
      routeDeviationSensitivity: deviationSensitivity,
      stealthTriggerMethod: stealthTrigger,
      stealthSosEnabled: stealthEnabled,
      audioRecordingOnSos: audioRecording,
      autoShareBatteryLevel: batteryShare,
      autoEscalateAfterMissedCount: autoEscalateCount,
    });

    updateUserProfile({
      medicalNotes,
      bloodType,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);

    // Trigger AI evaluation with updated settings/key
    refreshAiSafetyAssessment(true);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
              Safety Rules & Preferences
            </h2>
            <Badge variant="brand" size="sm">
              Escalation Engine v2.4
            </Badge>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Tune deviation sensitivity thresholds, stealth triggers, and emergency escalation timers.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          type="submit"
          icon={savedSuccess ? <CheckCircle2 className="w-4 h-4 text-safe-400" /> : <Save className="w-4 h-4" />}
        >
          {savedSuccess ? 'Settings Saved!' : 'Save Changes'}
        </Button>
      </div>

      {/* Grid: 3 Main Categories */}
      <div className="space-y-6">
        {/* Section 1: Route Deviation & Monitoring Sensitivity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-500" />
              <CardTitle>Autonomous Route Guardian Sensitivity</CardTitle>
            </div>
            <CardDescription>
              Controls how aggressively the spatial engine flags deviations and triggers check-in prompts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-700 dark:text-surface-300">
                Route Deviation Threshold
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'strict', label: 'Strict (100m)', desc: 'Flags minor detours immediately. Best for high-risk zones.' },
                  { id: 'balanced', label: 'Balanced (250m)', desc: 'Standard tolerance for urban walking corridors.' },
                  { id: 'relaxed', label: 'Relaxed (500m)', desc: 'Allows broad routing variations before alert.' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDeviationSensitivity(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      deviationSensitivity === item.id
                        ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
                        : 'bg-surface-50/50 dark:bg-surface-950/30 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100/50'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <p className="text-[11px] text-surface-500 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Select
                label="Default Check-In Cadence"
                value={String(checkinInterval)}
                onChange={e => setCheckinInterval(Number(e.target.value))}
                options={[
                  { value: '10', label: 'Every 10 minutes (High Vigilance)' },
                  { value: '15', label: 'Every 15 minutes (Standard Solo)' },
                  { value: '20', label: 'Every 20 minutes (Moderate Commute)' },
                  { value: '30', label: 'Every 30 minutes (Familiar Route)' },
                ]}
              />

              <Select
                label="Missed Check-in Escalation Rule"
                value={String(autoEscalateCount)}
                onChange={e => setAutoEscalateCount(Number(e.target.value))}
                options={[
                  { value: '1', label: 'Escalate after 1 missed prompt (Fastest response)' },
                  { value: '2', label: 'Escalate after 2 missed prompts (Recommended)' },
                  { value: '3', label: 'Escalate after 3 missed prompts' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Stealth Emergency Gestures */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-danger-500" />
              <CardTitle>Stealth SOS & Duress Triggers</CardTitle>
            </div>
            <CardDescription>
              Discrete hardware gestures to trigger emergency escalation without unlocking your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Switch
              checked={stealthEnabled}
              onChange={setStealthEnabled}
              label="Enable Stealth Emergency Trigger"
              description="Allows hardware gesture SOS dispatch even when phone screen is locked."
            />

            {stealthEnabled && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-surface-700 dark:text-surface-300">
                  Primary Discrete Trigger Gesture
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'power_quad_press', label: 'Power Button 4x', desc: 'Rapidly press power button 4 times in pocket' },
                    { id: 'volume_sequence', label: 'Vol Up + Vol Down + Up', desc: 'Hardware volume toggle sequence' },
                    { id: 'shake_gesture', label: 'Vigorous Shake (3x)', desc: 'Accelerated triple wrist shake motion' },
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setStealthTrigger(method.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        stealthTrigger === method.id
                          ? 'bg-danger-50 dark:bg-danger-950/40 border-danger-500 text-danger-700 dark:text-danger-300 font-semibold shadow-xs'
                          : 'bg-surface-50/50 dark:bg-surface-950/30 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100/50'
                      }`}
                    >
                      <div className="text-xs font-bold">{method.label}</div>
                      <p className="text-[11px] text-surface-500 mt-1">{method.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-surface-100 dark:border-surface-800 space-y-3">
              <Switch
                checked={audioRecording}
                onChange={setAudioRecording}
                label="Discrete Audio Beacon Recording"
                description="Securely captures 30-second encrypted audio clip upon SOS activation to forward to Primary Guardian."
              />
              <Switch
                checked={batteryShare}
                onChange={setBatteryShare}
                label="Stream Live Battery & Network Signal Telemetry"
                description="Includes remaining battery percentage in automated emergency SMS packets."
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Medical Emergency & Application Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-danger-500" />
                <CardTitle>Medical Emergency Escrow</CardTitle>
              </div>
              <CardDescription>
                Included in Tier 3 emergency dispatch broadcasts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                label="Blood Type"
                value={bloodType}
                onChange={e => setBloodType(e.target.value)}
                placeholder="e.g. O+, A-, B+"
              />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-surface-700 dark:text-surface-300">
                  Critical Medical Notes / Allergies
                </label>
                <textarea
                  value={medicalNotes}
                  onChange={e => setMedicalNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg text-xs bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 p-2.5 text-surface-900 dark:text-surface-100"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-500" />
                <CardTitle>Interface & Theme</CardTitle>
              </div>
              <CardDescription>
                High-contrast night vision vs daylight readability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dark', label: 'Dark (Night Guard)', icon: Moon },
                  { id: 'light', label: 'Light (Day Mode)', icon: Sun },
                  { id: 'system', label: 'System Automatic', icon: Sliders },
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-700 dark:text-brand-300 font-semibold'
                          : 'bg-surface-50 dark:bg-surface-950 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] text-center">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 text-[11px] text-surface-500 leading-relaxed">
                SafeCircle automatically preserves screen contrast and applies high-visibility accents when Night Guard is active.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 4: Google Gemini AI Safety Risk Engine */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <CardTitle>Google Gemini AI Safety Risk Engine</CardTitle>
              </div>
              <Badge variant={aiAssessment?.isAiAvailable ? 'safe' : 'neutral'} size="sm">
                {aiAssessment?.isAiAvailable ? 'AI Engine Active' : 'Standby / Unconfigured'}
              </Badge>
            </div>
            <CardDescription>
              Powers explainable contextual risk analysis, time-of-day vigilance, and intelligent check-in recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-700 dark:text-surface-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-brand-500" />
                Google Gemini API Key
              </label>
              <Input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="Paste your Gemini API key (or set VITE_GEMINI_API_KEY in .env)"
              />
              <p className="text-[11px] text-surface-500">
                SafeCircle never transmits your API key or personal profile to external servers. Inference calls are made directly and locally from your browser to Google Generative Language APIs.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 flex items-center justify-between text-[11px]">
              <div className="space-y-0.5">
                <div className="font-semibold text-surface-900 dark:text-surface-100">
                  Model: Gemini 2.5 Flash
                </div>
                <div className="text-surface-500">
                  Structured JSON Schema • 5-Minute Telemetry Cooldown Guard
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => refreshAiSafetyAssessment(true)}
              >
                Test AI Engine
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Browser Emergency Protocols & Testing */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-danger-500" />
                <CardTitle>Browser Emergency Protocols & Testing</CardTitle>
              </div>
              <Badge variant="brand" size="sm">
                Local Web APIs
              </Badge>
            </div>
            <CardDescription>
              Test browser push notifications, synthesize Web Audio alarms, and verify client emergency permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                  <span>Browser Notification Permission</span>
                  <Badge
                    variant={
                      typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
                        ? 'safe'
                        : typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {typeof window !== 'undefined' && 'Notification' in window
                      ? Notification.permission.toUpperCase()
                      : 'UNSUPPORTED'}
                  </Badge>
                </div>
                <p className="text-[11px] text-surface-500">
                  Enables background alert banners for route deviations and missed check-ins.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={async () => {
                  await requestNotifications();
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 2000);
                }}
              >
                Request Permission
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 space-y-2">
                <div className="font-semibold text-surface-900 dark:text-surface-100">
                  Web Audio Synthesizer
                </div>
                <p className="text-[11px] text-surface-500">
                  Synthesizes dual-tone 880Hz/660Hz alarm without downloading audio files.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    openSosModal();
                  }}
                  className="w-full text-danger-600 dark:text-danger-400"
                >
                  Test 5s SOS Protocol
                </Button>
              </div>

              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 space-y-2">
                <div className="font-semibold text-surface-900 dark:text-surface-100">
                  Test Push Notification
                </div>
                <p className="text-[11px] text-surface-500">
                  Sends an immediate test ping to verify device notification routing.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const ok = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
                    if (ok) {
                      new Notification('🔔 SafeCircle Test Notification', {
                        body: 'Browser notification system is operating nominally.',
                        icon: '/favicon.ico',
                      });
                    } else {
                      requestNotifications();
                    }
                  }}
                  className="w-full"
                >
                  Send Sample Notification
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
};

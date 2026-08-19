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
  const [checkinInterval, setCheckinInterval] = useState(15);
  const [deviationSensitivity, setDeviationSensitivity] = useState(preferences.routeDeviationSensitivity);
  const [stealthTrigger, setStealthTrigger] = useState(preferences.stealthGesture);
  const [stealthEnabled, setStealthEnabled] = useState(preferences.stealthTriggerEnabled);
  const [autoEscalateCount, setAutoEscalateCount] = useState(preferences.autoEscalateAfterMissedCount);

  // Medical notes
  const [medicalNotes, setMedicalNotes] = useState(userProfile.medicalNotes);
  const [bloodType, setBloodType] = useState(userProfile.bloodType);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiKey(apiKeyInput);
    updatePreferences({
      routeDeviationSensitivity: deviationSensitivity,
      stealthGesture: stealthTrigger,
      stealthTriggerEnabled: stealthEnabled,
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
                    { id: 'power_button_4x', label: 'Power Button 4x', desc: 'Rapidly press power button 4 times in pocket' },
                    { id: 'volume_down_triple', label: 'Vol Down (3x)', desc: 'Hardware volume toggle sequence' },
                    { id: 'shake_device', label: 'Vigorous Shake (3x)', desc: 'Accelerated triple wrist shake motion' },
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
                Included in Tier 3 emergency dispatch payloads to first responders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Blood Type"
                value={bloodType}
                onChange={e => setBloodType(e.target.value)}
                placeholder="e.g. O+, A-, B+"
              />
              <Input
                label="Allergies & Critical Notes"
                value={medicalNotes}
                onChange={e => setMedicalNotes(e.target.value)}
                placeholder="e.g. Asthma, Penicillin allergy"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-brand-500" />
                <CardTitle>Theme & Interface Mode</CardTitle>
              </div>
              <CardDescription>
                Switch between high-contrast dark mode for low-light travel or daytime theme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'light'
                      ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
                      : 'bg-surface-50/50 dark:bg-surface-950/30 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100/50'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span className="text-xs">Day Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'dark'
                      ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
                      : 'bg-surface-50/50 dark:bg-surface-950/30 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100/50'
                  }`}
                >
                  <Moon className="w-5 h-5 text-brand-500" />
                  <span className="text-xs">Night Guard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'system'
                      ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
                      : 'bg-surface-50/50 dark:bg-surface-950/30 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100/50'
                  }`}
                >
                  <Sliders className="w-5 h-5 text-surface-500" />
                  <span className="text-xs">System Auto</span>
                </button>
              </div>

              {/* Notification Permission Request */}
              <div className="pt-2 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-surface-900 dark:text-surface-100">
                    System Browser Notifications
                  </span>
                  <p className="text-[11px] text-surface-500">
                    Enable native browser push prompts for urgent safety pings.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={requestNotifications}
                >
                  Enable Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 4: Google Gemini AI Key Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <CardTitle>Google Gemini AI Route Intelligence</CardTitle>
              </div>
              <Badge variant={aiAssessment?.isAiAvailable ? 'brand' : 'neutral'} size="sm">
                {aiAssessment?.isAiAvailable ? 'API Connected' : 'Fallback Engine'}
              </Badge>
            </div>
            <CardDescription>
              Configure your custom Gemini API Key for dynamic route safety scoring and explainable corridor analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Gemini API Key"
              type="password"
              placeholder="AIzaSy..."
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              helperText="Key is securely stored in client-side localStorage and only used for direct generative calls."
              icon={<Key className="w-4 h-4 text-surface-400" />}
            />
          </CardContent>
        </Card>
      </div>
    </form>
  );
};

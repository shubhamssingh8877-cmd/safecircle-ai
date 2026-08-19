import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Navigation,
  Activity,
  AlertTriangle,
  Radio,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  Phone,
  Sparkles,
  RefreshCw,
  Loader2,
  Check,
  Sliders,
  ShieldAlert,
  PhoneCall,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { calculateRouteRiskPoints } from '../utils/routeRisk';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';

export const DashboardPage: React.FC = () => {
  const {
    journey,
    contacts,
    reports,
    safeHavens,
    riskZones,
    userProfile,
    preferences,
    aiAssessment,
    isAiAnalyzing,
    refreshAiSafetyAssessment,
    applySuggestedCheckIn,
    recordCheckIn,
    snoozeCheckIn,
    toggleSimulatedDeviation,
    openArrivalModal,
    openSosModal,
    activeSosEvent,
    resolveSos,
    isAudioMuted,
    toggleAudioMute,
  } = useJourney();

  const [copiedLoc, setCopiedLoc] = useState(false);

  const isJourneyActive = journey && journey.status === 'active';
  const primaryContact = contacts.find(c => c.isPrimaryGuardian) || contacts[0];
  const currentRiskZone = riskZones[0];

  const handleCopyLocation = () => {
    const locText = activeSosEvent?.locationSnapshotText || '37.77490° N, -122.41940° W';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`SafeCircle Emergency SOS: Location is ${locText}`);
      setCopiedLoc(true);
      setTimeout(() => setCopiedLoc(false), 3000);
    }
  };

  const routeRiskPoints = journey?.routeCoordinates && journey.routeCoordinates.length > 1
    ? calculateRouteRiskPoints(
        journey.routeCoordinates,
        reports,
        journey.originCoordinates ? { lat: journey.originCoordinates.lat, lng: journey.originCoordinates.lng } : undefined,
        1200
      )
    : [];

  return (
    <div className="space-y-6">
      {/* High-Priority Active SOS Emergency Banner (if SOS is active) */}
      {activeSosEvent && (
        <div className="p-5 rounded-2xl bg-danger-950/90 border-2 border-danger-500 text-white space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-danger-500/30 border border-danger-500 text-danger-400 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight">
                    🚨 EMERGENCY SOS ACTIVE
                  </h3>
                  <Badge variant="danger" size="sm">
                    {activeSosEvent.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-danger-200">
                  Triggered at {activeSosEvent.createdAt} • Audio beacon & guardian escalation protocols engaged.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAudioMute}
                className="p-2 rounded-lg bg-surface-900 border border-surface-700 text-xs text-surface-200 hover:text-white flex items-center gap-1.5"
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4 text-warning-400" /> : <Volume2 className="w-4 h-4 text-danger-400" />}
                <span>{isAudioMuted ? 'Unmute Siren' : 'Mute Siren'}</span>
              </button>
              <Button
                variant="primary"
                size="sm"
                className="bg-safe-600 hover:bg-safe-500 text-white font-bold"
                onClick={resolveSos}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                I'm Safe — Resolve SOS
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-surface-950/80 p-3 rounded-xl border border-surface-800">
            <div>
              <span className="text-[11px] text-surface-400 block">Location Snapshot:</span>
              <div className="font-mono text-white font-semibold flex items-center gap-2 mt-0.5">
                <span>{activeSosEvent.locationSnapshotText}</span>
                <button
                  type="button"
                  onClick={handleCopyLocation}
                  className="text-brand-400 hover:text-brand-300 text-[10px] underline"
                >
                  {copiedLoc ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-surface-400 block">Corridor Telemetry:</span>
              <span className="text-white capitalize mt-0.5 block">
                {activeSosEvent.deviationState?.replace('_', ' ') || 'On Route'}
                {activeSosEvent.distanceFromRouteMeters ? ` (${activeSosEvent.distanceFromRouteMeters}m)` : ''}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-surface-400 block">AI Contextual Risk:</span>
              <span className="text-amber-400 font-semibold uppercase mt-0.5 block">
                {activeSosEvent.aiRiskLevel || 'Standard'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <a
              href="tel:911"
              className="px-3.5 py-2 rounded-xl bg-danger-600 hover:bg-danger-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 911 Emergency Services</span>
            </a>
            {primaryContact.phoneNumber && (
              <a
                href={`tel:${primaryContact.phoneNumber}`}
                className="px-3.5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors border border-surface-700"
              >
                <Phone className="w-4 h-4 text-brand-400" />
                <span>Call Lead Guardian ({primaryContact.name})</span>
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={openSosModal}
              className="border-surface-700 text-surface-200"
            >
              View Full Escalation Modal
            </Button>
          </div>
        </div>
      )}

      {/* Top Welcome & Readiness Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-surface-900 p-5 rounded-2xl border border-surface-200 dark:border-surface-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
              Welcome back, {userProfile.fullName.split(' ')[0]}
            </h2>
            <Badge variant={activeSosEvent ? 'danger' : 'safe'} size="sm">
              {activeSosEvent ? 'Emergency Active' : 'System Online'}
            </Badge>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {activeSosEvent
              ? 'Emergency alert is broadcasting. Review escalation status above.'
              : 'Autonomous Safety Net is active. Circle readiness is optimal.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/journey">
            <Button
              variant={isJourneyActive ? 'secondary' : 'primary'}
              size="sm"
              icon={<Navigation className="w-4 h-4" />}
            >
              {isJourneyActive ? 'View Active Route' : 'Plan New Journey'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Safe Journeys"
          value={userProfile.totalSafeJourneys}
          subtitle="100% arrival rate"
          change="+3 this week"
          changeType="positive"
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="brand"
        />
        <MetricCard
          title="Circle Health"
          value={`${userProfile.circleHealthScore}%`}
          subtitle={`${contacts.length} guardians active`}
          icon={<Activity className="w-5 h-5" />}
          variant="safe"
        />
        <MetricCard
          title="Active Route Score"
          value={isJourneyActive ? `${journey.safetyScore}/100` : '—'}
          subtitle={isJourneyActive ? `${journey.riskLevel.toUpperCase()} RISK` : 'No journey in progress'}
          icon={<Navigation className="w-5 h-5" />}
          variant={isJourneyActive && journey.riskLevel === 'high' ? 'danger' : 'default'}
        />
        <MetricCard
          title="Area Safety Index"
          value={currentRiskZone ? `${100 - currentRiskZone.overallScore}/100` : '82/100'}
          subtitle={currentRiskZone?.name || 'Metropolitan Core'}
          icon={<Radio className="w-5 h-5" />}
          variant="brand"
        />
      </div>

      {/* Main Content Split: Active Journey / Quick Actions & Circle Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Journey Monitor or Quick Start */}
        <div className="lg:col-span-2 space-y-6">
          {isJourneyActive ? (
            <Card className="border-brand-500/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-safe-500 animate-ping" />
                      <CardTitle>Active Journey Guardian</CardTitle>
                      <Badge variant="brand" size="sm">
                        {journey.mode.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                      Started at {journey.startTime} • ETA {journey.estimatedArrival}
                    </CardDescription>
                  </div>
                  <Link to="/journey">
                    <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />}>
                      Full Map View
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Route Path Indicator */}
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200/80 dark:border-surface-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-surface-700 dark:text-surface-300">
                    <span className="truncate max-w-[45%]">📍 {journey.origin}</span>
                    <span className="text-surface-400">➔</span>
                    <span className="truncate max-w-[45%] text-right">🏁 {journey.destination}</span>
                  </div>

                  {/* Deviation Status Pill */}
                  <div className="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-800 text-xs">
                    <span className="text-surface-500">Geospatial Deviation Status:</span>
                    <div className="flex items-center gap-2">
                      {journey.deviationDetected ? (
                        <Badge variant="danger" size="sm">
                          DEVIATION DETECTED ({journey.distanceFromRouteMeters || 340}m off track)
                        </Badge>
                      ) : (
                        <Badge variant="safe" size="sm">
                          ON PLANNED CORRIDOR
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={toggleSimulatedDeviation}
                        className="text-[10px] text-brand-600 dark:text-brand-400 underline hover:opacity-80"
                      >
                        {journey.deviationDetected ? 'Reset Detour' : 'Simulate Detour'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Autonomous Check-In Countdown Box */}
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    journey.checkInStatusState === 'overdue'
                      ? 'bg-danger-50 dark:bg-danger-950/60 border-danger-500/80 animate-pulse'
                      : 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-500/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock
                        className={`w-4 h-4 ${
                          journey.checkInStatusState === 'overdue' ? 'text-danger-600 dark:text-danger-400' : 'text-brand-600 dark:text-brand-400'
                        }`}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          journey.checkInStatusState === 'overdue' ? 'text-danger-900 dark:text-danger-200' : 'text-surface-900 dark:text-surface-100'
                        }`}
                      >
                        {journey.checkInStatusState === 'overdue'
                          ? '⚠️ Autonomous Check-In OVERDUE'
                          : 'Autonomous Check-In Cadence'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      {journey.checkInStatusState === 'overdue' ? (
                        <div className="text-xl font-bold font-mono text-danger-600 dark:text-danger-400">
                          Auto-escalation in {journey.overdueGraceSecondsRemaining ?? 60}s
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold font-mono text-surface-900 dark:text-surface-50">
                            {Math.floor(journey.nextCheckInInSeconds / 60)}:
                            {String(journey.nextCheckInInSeconds % 60).padStart(2, '0')}
                          </div>
                          <span className="text-xs text-surface-500">
                            remaining until next safety ping
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={journey.checkInStatusState === 'overdue' ? 'danger' : 'safe'}
                      size="sm"
                      onClick={() => recordCheckIn('confirmed', 'Confirmed safe from Dashboard')}
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
                </div>

                {/* AI Safety Assessment Widget */}
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200/80 dark:border-surface-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <span className="text-xs font-semibold text-surface-900 dark:text-surface-100">
                        Gemini AI Route Intelligence
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refreshAiSafetyAssessment(true)}
                        disabled={isAiAnalyzing}
                        icon={
                          isAiAnalyzing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {isAiAnalyzing ? 'Analyzing...' : 'Refresh AI'}
                      </Button>
                    </div>
                  </div>

                  {aiAssessment ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-surface-500">
                          Assessed: {aiAssessment.analyzedAt}
                        </span>
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
                          {aiAssessment.riskLevel.toUpperCase()} RISK ({aiAssessment.riskScore}/100)
                        </Badge>
                      </div>
                      <p className="text-surface-700 dark:text-surface-300 leading-relaxed font-medium">
                        "{aiAssessment.summary}"
                      </p>

                      {aiAssessment.routeRecommendation && (
                        <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[11px] text-surface-600 dark:text-surface-400">
                          <span className="font-semibold text-surface-900 dark:text-surface-200">Advisory:</span> {aiAssessment.routeRecommendation}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-surface-500">
                      AI safety analysis is loading for this corridor...
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
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
                  Trigger Emergency SOS
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Start Guarded Journey</CardTitle>
                <CardDescription>
                  Choose your departure point, destination, and transport mode for continuous cross-track protection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-dashed border-surface-300 dark:border-surface-700 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                      No active journey running
                    </h4>
                    <p className="text-xs text-surface-500 max-w-sm mx-auto">
                      SafeCircle will monitor road deviations, handle automatic check-ins, and notify your circle.
                    </p>
                  </div>
                  <Link to="/journey">
                    <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
                      Create Route Guard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contextual Safe Havens Quick List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Nearest Verified Safe Havens</CardTitle>
                  <CardDescription>
                    24/7 staffed emergency shelters, pharmacies, and police substations along your corridor.
                  </CardDescription>
                </div>
                <Link to="/risk-map">
                  <Button variant="ghost" size="sm">
                    View on Map
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {safeHavens.slice(0, 4).map(haven => (
                  <div
                    key={haven.id}
                    className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200/60 dark:border-surface-800/60 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-surface-900 dark:text-surface-100">
                          {haven.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-surface-500">{haven.address}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="brand" size="sm">
                          {haven.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-[11px] font-mono text-surface-400">
                          {haven.distanceKm} km away
                        </span>
                      </div>
                    </div>

                    <a
                      href={`tel:${haven.phoneNumber}`}
                      className="p-2 rounded-lg bg-surface-200/60 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:text-brand-600 transition-colors"
                      title="Call Safe Haven"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Trusted Circle Status & Recent Incident Signals */}
        <div className="space-y-6">
          {/* Trusted Circle Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trusted Circle Mesh</CardTitle>
                  <CardDescription>Active emergency escalation chain</CardDescription>
                </div>
                <Link to="/contacts">
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {contacts.map(contact => (
                <div
                  key={contact.id}
                  className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200/60 dark:border-surface-800/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-surface-900 dark:text-surface-100">
                          {contact.name}
                        </span>
                        {contact.isPrimaryGuardian && (
                          <Badge variant="brand" size="sm">
                            Lead
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-surface-500">{contact.relationship}</span>
                    </div>
                  </div>

                  <Badge
                    variant={
                      contact.escalationTier === 1
                        ? 'brand'
                        : contact.escalationTier === 2
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    Tier {contact.escalationTier}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Corridor Hazard Radar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Corridor Hazard Radar</CardTitle>
                  <CardDescription>Community safety reports</CardDescription>
                </div>
                <Link to="/reports">
                  <Button variant="ghost" size="sm">
                    All Reports
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.slice(0, 3).map(report => (
                <div
                  key={report.id}
                  className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200/60 dark:border-surface-800/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-surface-900 dark:text-surface-100 line-clamp-1">
                      {report.title}
                    </span>
                    <Badge
                      variant={
                        report.severity === 'warning'
                          ? 'danger'
                          : report.severity === 'caution'
                          ? 'warning'
                          : 'brand'
                      }
                      size="sm"
                    >
                      {report.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-surface-500 line-clamp-2">
                    {report.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-surface-400">
                    <span>{report.location}</span>
                    <span>{report.timeAgo}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

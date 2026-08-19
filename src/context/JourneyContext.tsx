import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Contact,
  DeviationState,
  EmergencySosEvent,
  Journey,
  RiskZone,
  SafeHaven,
  SafetyAlert,
  SafetyAssessment,
  SafetyReport,
  TransportMode,
  UserPreferences,
  UserProfile,
} from '../types';
import {
  mockActiveJourney,
  mockContacts,
  mockRiskZones,
  mockSafeHavens,
  mockAlerts,
  mockUserPreferences,
  mockReports,
  mockCurrentUser,
} from '../data/mockData';
import { storageService } from '../utils/storage';
import { calculateCrossTrackDeviation, getDeviationThresholdMeters } from '../utils/geo';
import {
  analyzeSafetyContext,
  filterRelevantCommunityReports,
  getUnavailableFallbackAssessment,
  SafetyContextPayload,
} from '../services/aiSafety';
import {
  requestNotificationPermission,
  NotificationPermissionStatus,
  NotificationTriggers,
} from '../services/notifications';
import { audioAlertEngine } from '../services/audioAlert';

export interface StartJourneyRouteData {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  profileUsed: string;
  originCoordinates?: { lat: number; lng: number };
  destinationCoordinates?: { lat: number; lng: number };
}

interface JourneyContextType {
  journey: Journey | null;
  journeyHistory: Journey[];
  contacts: Contact[];
  reports: SafetyReport[];
  riskZones: RiskZone[];
  safeHavens: SafeHaven[];
  alerts: SafetyAlert[];
  preferences: UserPreferences;
  userProfile: UserProfile;
  upvotedReportIds: string[];
  isSosModalOpen: boolean;
  sosCountdown: number | null;
  isSosTriggered: boolean;
  activeSosEvent: EmergencySosEvent | null;
  isAudioMuted: boolean;

  // AI Safety Risk Engine State & Actions
  aiAssessment: SafetyAssessment | null;
  isAiAnalyzing: boolean;
  customApiKey: string;
  refreshAiSafetyAssessment: (force?: boolean) => Promise<void>;
  setCustomApiKey: (key: string) => void;
  applySuggestedCheckIn: (minutes: number) => void;

  // Real-time GPS Deviation Engine Actions
  processGpsDeviation: (coords: { lat: number; lng: number; accuracy?: number }) => void;
  simulateDevDetour: (offsetMeters?: number) => void;
  dismissDeviationAlert: () => void;

  // SOS & Notification Actions
  openSosModal: () => void;
  closeSosModal: () => void;
  triggerImmediateSos: (customGps?: { lat: number; lng: number; accuracy?: number }) => void;
  cancelSosCountdown: () => void;
  activateSos: (
    type?: 'manual_sos' | 'missed_checkin_escalation' | 'deviation_escalation',
    customGps?: { lat: number; lng: number; accuracy?: number }
  ) => void;
  resolveSos: () => void;
  toggleAudioMute: () => void;
  requestNotifications: () => Promise<NotificationPermissionStatus>;

  // Arrival Summary Actions
  isArrivalModalOpen: boolean;
  openArrivalModal: () => void;
  closeArrivalModal: () => void;
  finishAndArchiveJourney: () => void;

  // Standard Lifecycle Actions
  startJourney: (
    origin: string,
    destination: string,
    mode: TransportMode,
    contactIds: string[],
    checkinInterval: number,
    routeData?: StartJourneyRouteData
  ) => void;
  endJourney: (status?: 'arrived' | 'canceled') => void;
  recordCheckIn: (status: 'confirmed' | 'missed' | 'snoozed', note?: string) => void;
  snoozeCheckIn: (minutes?: number) => void;
  toggleSimulatedDeviation: () => void;
  addContact: (contact: Omit<Contact, 'id' | 'status' | 'lastActive'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addSafetyReport: (report: Omit<SafetyReport, 'id' | 'timestamp' | 'timeAgo' | 'upvotes' | 'verified' | 'verifiedBy'>) => void;
  upvoteReport: (id: string) => void;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  dismissAlert: (id: string) => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from persistent storage with fallback to mock data
  const [journey, setJourney] = useState<Journey | null>(() =>
    storageService.getActiveJourney(mockActiveJourney)
  );
  const [journeyHistory, setJourneyHistory] = useState<Journey[]>(() =>
    storageService.getJourneyHistory([])
  );
  const [contacts, setContacts] = useState<Contact[]>(() =>
    storageService.getContacts(mockContacts)
  );
  const [reports, setReports] = useState<SafetyReport[]>(() =>
    storageService.getReports(mockReports)
  );
  const [upvotedReportIds, setUpvotedReportIds] = useState<string[]>(() =>
    storageService.getUpvotes([])
  );
  const [riskZones] = useState<RiskZone[]>(mockRiskZones);
  const [safeHavens] = useState<SafeHaven[]>(mockSafeHavens);
  const [alerts, setAlerts] = useState<SafetyAlert[]>(() =>
    storageService.getAlerts(mockAlerts)
  );
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    storageService.getPreferences(mockUserPreferences)
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    storageService.getUserProfile(mockCurrentUser)
  );

  // AI Safety Risk Engine State
  const [aiAssessment, setAiAssessment] = useState<SafetyAssessment | null>(() =>
    storageService.getAiAssessment<SafetyAssessment | null>(null)
  );
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [customApiKey, setCustomApiKeyState] = useState<string>(() =>
    storageService.getCustomApiKey()
  );

  // Emergency SOS State
  const [activeSosEvent, setActiveSosEvent] = useState<EmergencySosEvent | null>(() =>
    storageService.getActiveSos<EmergencySosEvent | null>(null)
  );
  const [isSosModalOpen, setIsSosModalOpen] = useState(() => Boolean(storageService.getActiveSos<EmergencySosEvent | null>(null)));
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [isSosTriggered, setIsSosTriggered] = useState(() => Boolean(storageService.getActiveSos<EmergencySosEvent | null>(null)));
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Arrival Safety Summary Modal State
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);

  // GPS consecutive deviation counter (for false-positive noise protection)
  const consecutiveDeviationsRef = useRef<number>(0);
  const lastDeviationStateRef = useRef<DeviationState>('on_route');
  const lastAiAnalysisTimeRef = useRef<number>(0);

  // Persistence synchronizers
  useEffect(() => {
    storageService.saveActiveJourney(journey);
  }, [journey]);

  useEffect(() => {
    storageService.saveJourneyHistory(journeyHistory);
  }, [journeyHistory]);

  useEffect(() => {
    storageService.saveContacts(contacts);
  }, [contacts]);

  useEffect(() => {
    storageService.saveReports(reports);
  }, [reports]);

  useEffect(() => {
    storageService.saveUpvotes(upvotedReportIds);
  }, [upvotedReportIds]);

  useEffect(() => {
    storageService.savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    storageService.saveUserProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    storageService.saveAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    storageService.saveAiAssessment(aiAssessment);
  }, [aiAssessment]);

  useEffect(() => {
    storageService.saveActiveSos(activeSosEvent);
  }, [activeSosEvent]);

  // Request Notification Permissions on user action
  const requestNotifications = async (): Promise<NotificationPermissionStatus> => {
    return await requestNotificationPermission();
  };

  // SOS Countdown Timer Tick & Auto-trigger
  useEffect(() => {
    let timer: any = null;
    if (sosCountdown !== null && sosCountdown > 0) {
      audioAlertEngine.playCountdownTick(660, 120);
      timer = setTimeout(() => {
        setSosCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (sosCountdown === 0) {
      activateSos('manual_sos');
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [sosCountdown]);

  // SOS Activation Engine
  const activateSos = (
    type: 'manual_sos' | 'missed_checkin_escalation' | 'deviation_escalation' = 'manual_sos',
    customGps?: { lat: number; lng: number; accuracy?: number }
  ) => {
    setSosCountdown(null);
    setIsSosTriggered(true);
    setIsSosModalOpen(true);

    const now = new Date();
    const lat = customGps?.lat ?? journey?.originCoordinates?.lat ?? 37.7749;
    const lng = customGps?.lng ?? journey?.originCoordinates?.lng ?? -122.4194;
    const accuracy = customGps?.accuracy ?? (journey?.isGpsAccuracyLow ? 65 : 15);

    const locationSnapshotText = `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° W (±${accuracy}m)`;

    // 1. Dispatch Native Browser Notification
    const notificationSent = NotificationTriggers.sosActivated(locationSnapshotText);

    // 2. Play Web Audio Emergency Beacon Alarm
    if (!isAudioMuted) {
      audioAlertEngine.startEmergencyAlarm();
    }

    const leadContact = contacts.find(c => c.isPrimaryGuardian) || contacts[0];

    // 3. Build Emergency Event with Escalation Tiers
    const newSosEvent: EmergencySosEvent = {
      id: `sos_${Date.now()}`,
      createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'active',
      type,
      latitude: lat,
      longitude: lng,
      accuracyMeters: accuracy,
      locationSnapshotText,
      journeyId: journey?.id,
      origin: journey?.origin,
      destination: journey?.destination,
      deviationState: journey?.deviationState || 'on_route',
      distanceFromRouteMeters: journey?.distanceFromRouteMeters || 0,
      aiRiskLevel: aiAssessment?.riskLevel || 'low',
      browserNotificationSent: notificationSent,
      audioAlertTriggered: !isAudioMuted,
      escalationLog: [
        {
          tier: 1,
          title: 'Tier 1 — Browser Emergency Alert',
          recipientName: 'Active Device / Traveler',
          action: 'Browser Notification & Web Audio Siren',
          status: notificationSent ? 'browser_delivered' : 'simulated',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          details: notificationSent
            ? 'Native browser notification delivered with high-priority alert beacon.'
            : 'Browser notifications not permitted or unsupported on current client.',
        },
        {
          tier: 2,
          title: 'Tier 2 — Primary Guardian Call Ready',
          recipientName: leadContact?.name || 'Primary Guardian',
          recipientPhone: leadContact?.phoneNumber,
          action: 'Native Phone Call Shortcut',
          status: 'call_ready',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          details: `Direct dial ready for ${leadContact?.name || 'Guardian'} (${leadContact?.phoneNumber || 'No phone configured'}).`,
        },
        {
          tier: 3,
          title: 'Tier 3 — Emergency Services Escalation',
          recipientName: 'Local Emergency Dispatch (911/112)',
          action: 'Direct Emergency Call (tel:911)',
          status: 'unconfigured',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          details: 'Automated 3rd-party cellular SMS gateway not configured. Tap to call 911 directly.',
        },
      ],
    };

    setActiveSosEvent(newSosEvent);
    storageService.saveActiveSos(newSosEvent);

    // Also update journey state if active
    if (journey && journey.status === 'active') {
      setJourney(prev => (prev ? { ...prev, status: 'escalated' } : null));
    }
  };

  const resolveSos = () => {
    audioAlertEngine.stopEmergencyAlarm();
    setSosCountdown(null);
    setIsSosTriggered(false);
    setIsSosModalOpen(false);

    if (activeSosEvent) {
      const now = new Date();
      const resolvedEvent: EmergencySosEvent = {
        ...activeSosEvent,
        status: 'resolved',
        resolvedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      const existingHistory = storageService.getSosHistory<EmergencySosEvent[]>([]);
      storageService.saveSosHistory([resolvedEvent, ...existingHistory]);
    }

    setActiveSosEvent(null);
    storageService.clearActiveSos();

    if (journey && journey.status === 'escalated') {
      setJourney(prev => (prev ? { ...prev, status: 'active' } : null));
    }
  };

  const toggleAudioMute = () => {
    setIsAudioMuted(prev => {
      const next = !prev;
      audioAlertEngine.setMuted(next);
      return next;
    });
  };

  const openSosModal = () => {
    if (activeSosEvent) {
      setIsSosModalOpen(true);
      setIsSosTriggered(true);
      return;
    }
    setIsSosModalOpen(true);
    setSosCountdown(5);
    setIsSosTriggered(false);
  };

  const closeSosModal = () => {
    setIsSosModalOpen(false);
    setSosCountdown(null);
  };

  const cancelSosCountdown = () => {
    setSosCountdown(null);
    setIsSosModalOpen(false);
    setIsSosTriggered(false);
  };

  const triggerImmediateSos = (customGps?: { lat: number; lng: number; accuracy?: number }) => {
    activateSos('manual_sos', customGps);
  };

  const setCustomApiKey = (key: string) => {
    const sanitized = key.trim();
    setCustomApiKeyState(sanitized);
    storageService.saveCustomApiKey(sanitized);
  };

  // AI Safety Risk Assessment Refresher
  const refreshAiSafetyAssessment = useCallback(
    async (force: boolean = false) => {
      const now = Date.now();
      if (!force && now - lastAiAnalysisTimeRef.current < 5 * 60 * 1000) {
        return;
      }

      const activeKey = customApiKey || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
      if (!activeKey) {
        setAiAssessment(getUnavailableFallbackAssessment('AI Safety Analysis Unavailable (API Key Not Configured)'));
        return;
      }

      setIsAiAnalyzing(true);
      lastAiAnalysisTimeRef.current = now;

      const currentDate = new Date();
      const currentHour = currentDate.getHours();
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'afternoon';
      if (currentHour >= 5 && currentHour < 12) timeOfDay = 'morning';
      else if (currentHour >= 12 && currentHour < 17) timeOfDay = 'afternoon';
      else if (currentHour >= 17 && currentHour < 21) timeOfDay = 'evening';
      else timeOfDay = 'night';

      const relevantRoutePoints = filterRelevantCommunityReports(
        reports,
        journey?.originCoordinates,
        journey?.routeCoordinates
      );

      const routeRiskPointsForAi = relevantRoutePoints.map(p => ({
        reportId: p.reportId,
        reportTitle: p.reportTitle,
        category: p.category,
        severity: p.severity,
        distanceToRouteMeters: p.distanceToRouteMeters,
        proximity: p.proximity,
        upvotes: p.upvotes,
        description: p.description,
        segmentIndex: p.segmentIndex,
      }));

      const payload: SafetyContextPayload = {
        journey: {
          mode: journey?.mode || 'walking',
          routeDistanceMeters: journey?.distanceMeters || 1850,
          estimatedDurationSeconds: journey?.durationSeconds || 1320,
          deviationState: journey?.deviationState || 'on_route',
          distanceFromRouteMeters: journey?.distanceFromRouteMeters || 0,
          deviationThresholdMeters: journey?.deviationThresholdMeters || 250,
          gpsAccuracyMeters: journey?.gpsAccuracyMeters,
          originName: journey?.origin || 'Departure Location',
          destinationName: journey?.destination || 'Destination',
          isSimulatedDeviation: Boolean(journey?.isSimulatedDeviation),
        },
        timeContext: {
          localTime: currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          localHour: currentHour,
          timeOfDay,
        },
        routeRiskPoints: routeRiskPointsForAi,
        totalCommunityReportsInArea: reports.length,
      };

      try {
        const assessment = await analyzeSafetyContext(payload, customApiKey);
        setAiAssessment(assessment);

        if (assessment.isAiAvailable && journey && journey.status === 'active') {
          setJourney(prev => {
            if (!prev) return null;
            return {
              ...prev,
              safetyScore: Math.max(10, 100 - assessment.riskScore),
              riskLevel: assessment.riskLevel,
            };
          });
        }
      } catch {
        setAiAssessment(getUnavailableFallbackAssessment('AI Safety Analysis Failed'));
      } finally {
        setIsAiAnalyzing(false);
      }
    },
    [customApiKey, journey, reports]
  );

  const applySuggestedCheckIn = (minutes: number) => {
    const clamped = Math.max(5, Math.min(60, minutes));
    setPreferences(prev => ({
      ...prev,
      defaultCheckinIntervalMinutes: clamped,
    }));
    if (journey && journey.status === 'active') {
      setJourney(prev => (prev ? { ...prev, checkInIntervalMinutes: clamped } : null));
    }
  };

  // Continuous GPS Telemetry & Cross-Track Deviation Processor
  const processGpsDeviation = useCallback(
    (coords: { lat: number; lng: number; accuracy?: number }) => {
      if (!journey || journey.status !== 'active' || !journey.routeCoordinates || journey.routeCoordinates.length < 2) {
        return;
      }

      if (journey.isSimulatedDeviation) {
        return;
      }

      const thresholdMeters = getDeviationThresholdMeters(preferences.routeDeviationSensitivity);
      const isAccuracyLow = typeof coords.accuracy === 'number' && coords.accuracy > 40;

      const deviationResult = calculateCrossTrackDeviation(
        coords.lat,
        coords.lng,
        journey.routeCoordinates
      );

      let calculatedState: DeviationState = 'on_route';
      if (deviationResult.minDistanceMeters > thresholdMeters) {
        calculatedState = 'deviated';
      }

      if (calculatedState === 'deviated') {
        consecutiveDeviationsRef.current += 1;
      } else {
        consecutiveDeviationsRef.current = 0;
      }

      const confirmedDeviationState: DeviationState =
        consecutiveDeviationsRef.current >= 2 ? 'deviated' : 'on_route';

      const isStateChanged = confirmedDeviationState !== lastDeviationStateRef.current;
      lastDeviationStateRef.current = confirmedDeviationState;

      setJourney(prev => {
        if (!prev) return null;
        return {
          ...prev,
          distanceFromRouteMeters: deviationResult.minDistanceMeters,
          nearestRoutePoint: deviationResult.nearestRoutePoint,
          deviationThresholdMeters: thresholdMeters,
          deviationDetected: confirmedDeviationState === 'deviated',
          deviationState: confirmedDeviationState,
          gpsAccuracyMeters: coords.accuracy,
          isGpsAccuracyLow: isAccuracyLow,
        };
      });

      // Dispatch browser notification on deviation transition
      if (isStateChanged && confirmedDeviationState === 'deviated') {
        NotificationTriggers.routeDeviation(deviationResult.minDistanceMeters);
        refreshAiSafetyAssessment(true);
      }
    },
    [journey, preferences.routeDeviationSensitivity, refreshAiSafetyAssessment]
  );

  const simulateDevDetour = (offsetMeters: number = 340) => {
    if (!journey) return;
    consecutiveDeviationsRef.current = 2;
    lastDeviationStateRef.current = 'deviated';

    setJourney(prev => {
      if (!prev) return null;
      return {
        ...prev,
        distanceFromRouteMeters: offsetMeters,
        deviationDetected: true,
        deviationState: 'deviated',
        isSimulatedDeviation: true,
      };
    });

    NotificationTriggers.routeDeviation(offsetMeters);
    refreshAiSafetyAssessment(true);
  };

  const dismissDeviationAlert = () => {
    consecutiveDeviationsRef.current = 0;
    lastDeviationStateRef.current = 'on_route';

    setJourney(prev => {
      if (!prev) return null;
      return {
        ...prev,
        distanceFromRouteMeters: 0,
        deviationDetected: false,
        deviationState: 'on_route',
        isSimulatedDeviation: false,
      };
    });
  };

  // Track last tick timestamp to protect against browser tab throttling & suspension
  const lastCheckInTickTimeRef = useRef<number>(Date.now());

  // Autonomous Check-in Countdown & Escalation Timer (1-second tick with elapsed timestamp protection)
  useEffect(() => {
    if (!journey || journey.status !== 'active') return;
    lastCheckInTickTimeRef.current = Date.now();

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.max(1, Math.round((now - lastCheckInTickTimeRef.current) / 1000));
      lastCheckInTickTimeRef.current = now;

      setJourney(prev => {
        if (!prev || prev.status !== 'active') return prev;

        // If currently in overdue grace countdown
        if (prev.checkInStatusState === 'overdue') {
          const currentGrace = prev.overdueGraceSecondsRemaining ?? 60;
          const newGrace = currentGrace - elapsedSeconds;

          if (newGrace <= 0) {
            // Grace period expired without user confirmation!
            const newMissedCount = (prev.missedCheckInCount || 0) + 1;
            const threshold = preferences.autoEscalateAfterMissedCount || 2;

            const missedCheckInRecord = {
              id: `chk_${Date.now()}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'missed' as const,
              notes: `Automated check-in missed (${newMissedCount}/${threshold} threshold)`,
            };

            // If missed count meets or exceeds threshold, trigger Step 8 SOS escalation
            if (newMissedCount >= threshold) {
              setTimeout(() => {
                activateSos('missed_checkin_escalation');
              }, 0);

              return {
                ...prev,
                checkInStatusState: 'escalating',
                missedCheckInCount: newMissedCount,
                overdueGraceSecondsRemaining: 0,
                nextCheckInInSeconds: prev.checkInIntervalMinutes * 60,
                recentCheckIns: [missedCheckInRecord, ...prev.recentCheckIns],
              };
            } else {
              // Return to on_schedule while preserving accumulated missed count
              return {
                ...prev,
                checkInStatusState: 'on_schedule',
                missedCheckInCount: newMissedCount,
                overdueGraceSecondsRemaining: 60,
                nextCheckInInSeconds: prev.checkInIntervalMinutes * 60,
                recentCheckIns: [missedCheckInRecord, ...prev.recentCheckIns],
              };
            }
          } else {
            return {
              ...prev,
              overdueGraceSecondsRemaining: newGrace,
            };
          }
        } else {
          // On normal schedule
          const remaining = prev.nextCheckInInSeconds - elapsedSeconds;
          if (remaining <= 0) {
            // Check-in timer reached zero -> transition to OVERDUE
            audioAlertEngine.playWarningBeep();
            NotificationTriggers.checkinOverdue(60);

            return {
              ...prev,
              checkInStatusState: 'overdue',
              overdueGraceSecondsRemaining: 60,
              nextCheckInInSeconds: 0,
            };
          } else {
            return {
              ...prev,
              nextCheckInInSeconds: remaining,
            };
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [journey?.status, journey?.checkInStatusState, preferences.autoEscalateAfterMissedCount]);

  const startJourney = (
    origin: string,
    destination: string,
    mode: TransportMode,
    contactIds: string[],
    checkinInterval: number,
    routeData?: StartJourneyRouteData
  ) => {
    const now = new Date();
    const startTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const durationMins = routeData?.durationSeconds ? Math.ceil(routeData.durationSeconds / 60) : 22;
    const etaDate = new Date(now.getTime() + durationMins * 60 * 1000);
    const etaStr = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newJourney: Journey = {
      id: `j_${Date.now()}`,
      origin,
      destination,
      originCoordinates: routeData?.originCoordinates || { lat: 37.7749, lng: -122.4194 },
      destinationCoordinates: routeData?.destinationCoordinates || { lat: 37.7820, lng: -122.4050 },
      mode,
      startTime: startTimeStr,
      estimatedArrival: etaStr,
      status: 'active',
      safetyScore: 92,
      riskLevel: 'low',
      deviationDetected: false,
      deviationState: 'on_route',
      distanceFromRouteMeters: 0,
      deviationThresholdMeters: getDeviationThresholdMeters(preferences.routeDeviationSensitivity),
      checkInIntervalMinutes: checkinInterval,
      nextCheckInInSeconds: checkinInterval * 60,
      checkInStatusState: 'on_schedule',
      overdueGraceSecondsRemaining: 60,
      missedCheckInCount: 0,
      assignedContacts: contactIds,
      routeCoordinates: routeData?.coordinates || [],
      distanceMeters: routeData?.distanceMeters || 1850,
      durationSeconds: routeData?.durationSeconds || 1320,
      profileUsed: routeData?.profileUsed || 'foot',
      waypoints: [
        {
          id: 'wp_1',
          name: 'Origin Departure Point',
          timestamp: startTimeStr,
          passed: true,
          latitude: routeData?.originCoordinates?.lat || 37.7749,
          longitude: routeData?.originCoordinates?.lng || -122.4194,
        },
        {
          id: 'wp_2',
          name: 'Mid-route Checkpoint',
          timestamp: new Date(now.getTime() + 10 * 60000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          passed: false,
          latitude: 37.7785,
          longitude: -122.4120,
        },
        {
          id: 'wp_3',
          name: 'Target Destination',
          timestamp: etaStr,
          passed: false,
          latitude: routeData?.destinationCoordinates?.lat || 37.7820,
          longitude: routeData?.destinationCoordinates?.lng || -122.4050,
        },
      ],
      recentCheckIns: [],
    };

    setJourney(newJourney);
    refreshAiSafetyAssessment(true);
  };

  const openArrivalModal = () => {
    setIsArrivalModalOpen(true);
  };

  const closeArrivalModal = () => {
    setIsArrivalModalOpen(false);
  };

  const finishAndArchiveJourney = () => {
    endJourney('arrived');
    setIsArrivalModalOpen(false);
  };

  const endJourney = (status: 'arrived' | 'canceled' = 'arrived') => {
    if (!journey) return;
    if (activeSosEvent !== null) {
      console.warn('[SafeCircle] Cannot end or archive journey while an active SOS event is unresolved.');
      return;
    }
    const now = new Date();
    const arrivalTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const completedJourney: Journey = {
      ...journey,
      status,
      completedArrivalTime: arrivalTimeStr,
    };
    setJourneyHistory(prev => [completedJourney, ...prev]);
    setJourney(null);
    setIsArrivalModalOpen(false);

    if (status === 'arrived') {
      setUserProfile(prev => ({
        ...prev,
        totalSafeJourneys: prev.totalSafeJourneys + 1,
      }));
    }
  };

  const recordCheckIn = (status: 'confirmed' | 'missed' | 'snoozed', note?: string) => {
    if (!journey) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const defaultNote =
      status === 'confirmed'
        ? 'User confirmed safety'
        : status === 'snoozed'
        ? 'Check-in snoozed by user for 5 minutes'
        : 'Automated check-in missed';

    const newCheckIn = {
      id: `chk_${Date.now()}`,
      time: timeStr,
      status,
      notes: note || defaultNote,
    };

    setJourney(prev => {
      if (!prev) return null;
      if (status === 'confirmed') {
        return {
          ...prev,
          checkInStatusState: 'on_schedule',
          missedCheckInCount: 0,
          overdueGraceSecondsRemaining: 60,
          nextCheckInInSeconds: prev.checkInIntervalMinutes * 60,
          recentCheckIns: [newCheckIn, ...prev.recentCheckIns],
        };
      } else if (status === 'snoozed') {
        return {
          ...prev,
          checkInStatusState: 'on_schedule',
          overdueGraceSecondsRemaining: 60,
          nextCheckInInSeconds: 5 * 60,
          recentCheckIns: [newCheckIn, ...prev.recentCheckIns],
        };
      } else {
        return {
          ...prev,
          recentCheckIns: [newCheckIn, ...prev.recentCheckIns],
        };
      }
    });
  };

  const snoozeCheckIn = (minutes: number = 5) => {
    recordCheckIn('snoozed', `Check-in snoozed by user for ${minutes} minutes.`);
  };

  const toggleSimulatedDeviation = () => {
    if (!journey) return;
    if (journey.deviationDetected) {
      dismissDeviationAlert();
    } else {
      simulateDevDetour(340);
    }
  };

  const addContact = (contactData: Omit<Contact, 'id' | 'status' | 'lastActive'>) => {
    const newContact: Contact = {
      ...contactData,
      id: `ct_${Date.now()}`,
      status: 'active',
      lastActive: 'Just added',
    };
    setContacts(prev => [newContact, ...prev]);
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const addSafetyReport = (reportData: Omit<SafetyReport, 'id' | 'timestamp' | 'timeAgo' | 'upvotes' | 'verified' | 'verifiedBy'>) => {
    const now = new Date();
    const newReport: SafetyReport = {
      ...reportData,
      id: `rep_${Date.now()}`,
      timestamp: now.toISOString().replace('T', ' ').slice(0, 16),
      timeAgo: 'Just now',
      upvotes: 1,
      verified: false,
      verifiedBy: 'Pending Community Verification',
    };
    setReports(prev => [newReport, ...prev]);
  };

  const upvoteReport = (id: string) => {
    setUpvotedReportIds(prevUpvotes => {
      const alreadyUpvoted = prevUpvotes.includes(id);
      if (alreadyUpvoted) {
        setReports(prevReports =>
          prevReports.map(r => (r.id === id ? { ...r, upvotes: Math.max(0, r.upvotes - 1) } : r))
        );
        return prevUpvotes.filter(upId => upId !== id);
      } else {
        setReports(prevReports =>
          prevReports.map(r => (r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r))
        );
        return [...prevUpvotes, id];
      }
    });
  };

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <JourneyContext.Provider
      value={{
        journey,
        journeyHistory,
        contacts,
        reports,
        riskZones,
        safeHavens,
        alerts,
        preferences,
        userProfile,
        upvotedReportIds,
        isSosModalOpen,
        sosCountdown,
        isSosTriggered,
        activeSosEvent,
        isAudioMuted,
        aiAssessment,
        isAiAnalyzing,
        customApiKey,
        refreshAiSafetyAssessment,
        setCustomApiKey,
        applySuggestedCheckIn,
        processGpsDeviation,
        simulateDevDetour,
        dismissDeviationAlert,
        openSosModal,
        closeSosModal,
        triggerImmediateSos,
        cancelSosCountdown,
        activateSos,
        resolveSos,
        toggleAudioMute,
        requestNotifications,
        isArrivalModalOpen,
        openArrivalModal,
        closeArrivalModal,
        finishAndArchiveJourney,
        startJourney,
        endJourney,
        recordCheckIn,
        snoozeCheckIn,
        toggleSimulatedDeviation,
        addContact,
        updateContact,
        deleteContact,
        addSafetyReport,
        upvoteReport,
        updatePreferences,
        updateUserProfile,
        dismissAlert,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourney = (): JourneyContextType => {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
};

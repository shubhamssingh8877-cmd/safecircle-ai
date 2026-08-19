export type JourneyStatus = 'idle' | 'active' | 'paused' | 'arrived' | 'completed' | 'escalated' | 'canceled' | 'sos';

export type TransportMode = 'walking' | 'rideshare' | 'transit' | 'driving' | 'cycling';

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high';

export type DeviationState = 'on_route' | 'approaching_deviation' | 'deviated';

export interface Waypoint {
  id: string;
  name: string;
  timestamp: string;
  passed: boolean;
  isCurrent?: boolean;
  latitude: number;
  longitude: number;
}

export interface CheckIn {
  id: string;
  time: string;
  status: 'confirmed' | 'missed' | 'pending' | 'snoozed' | 'overdue';
  notes?: string;
  batteryLevel?: number;
  locationName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type CheckInRecord = CheckIn;

export type CheckInStatusState = 'on_schedule' | 'overdue' | 'escalating';

export interface Journey {
  id: string;
  origin: string;
  destination: string;
  originCoordinates?: {
    lat: number;
    lng: number;
  };
  destinationCoordinates?: {
    lat: number;
    lng: number;
  };
  mode: TransportMode;
  startTime: string;
  estimatedArrival: string;
  status: JourneyStatus;
  safetyScore: number; // 0-100
  riskLevel: RiskLevel;
  deviationDetected: boolean;
  deviationState?: DeviationState;
  distanceFromRouteMeters?: number;
  deviationThresholdMeters?: number;
  nearestRoutePoint?: {
    lat: number;
    lng: number;
  };
  lastDeviationCheckedAt?: string;
  isGpsAccuracyLow?: boolean;
  gpsAccuracyMeters?: number;
  isSimulatedDeviation?: boolean;
  deviationDetails?: {
    distanceMeters: number;
    minutesOffTrack: number;
    lastKnownAddress: string;
  };
  checkInIntervalMinutes: number;
  currentCheckinIntervalMinutes?: number;
  nextCheckInInSeconds: number;
  nextCheckinDueTime?: string;
  secondsUntilCheckin?: number;
  checkInStatusState?: CheckInStatusState;
  isCheckinOverdue?: boolean;
  overdueGraceSecondsRemaining?: number;
  overdueGraceSecondsLeft?: number;
  missedCheckInCount?: number;
  lastCheckinStatus?: 'confirmed' | 'missed' | 'snoozed' | 'pending' | 'overdue';
  waypoints: Waypoint[];
  recentCheckIns: CheckIn[];
  checkinHistory?: CheckIn[];
  assignedContacts: string[]; // Contact IDs
  shareWithCircle?: boolean;
  notes?: string;
  emergencyTierTriggered?: number;
  
  // Real OSRM Routing metadata
  routeCoordinates?: [number, number][]; // [lat, lng] array for Leaflet Polyline
  distanceMeters?: number;
  totalDistanceMeters?: number;
  durationSeconds?: number;
  estimatedDurationSeconds?: number;
  routeProfile?: string;
  profileUsed?: string;
  completedArrivalTime?: string;
  routeDeviationSensitivity?: 'relaxed' | 'balanced' | 'strict';
}

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
  isPrimaryGuardian: boolean;
  status: 'active' | 'invited' | 'offline';
  avatarUrl?: string;
  escalationTier: 1 | 2 | 3;
  notifyOnDeviation: boolean;
  notifyOnCheckinMissed: boolean;
  notifyOnBatteryLow: boolean;
  lastActive: string;
}

export interface SafetyReport {
  id: string;
  title: string;
  category: 'lighting' | 'suspicious' | 'harassment' | 'infrastructure' | 'transit' | 'wildlife';
  severity: 'advisory' | 'caution' | 'warning';
  timestamp: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  upvotes: number;
  verified: boolean;
  verifiedBy: string;
  timeAgo: string;
}

export interface SafeHaven {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'pharmacy' | 'pharmacy_247' | 'fire_station' | 'transit_hub';
  address: string;
  distanceKm: number;
  isOpen24Hours: boolean;
  phoneNumber: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  verificationBadge?: string;
}

export interface RiskZone {
  id: string;
  name: string;
  neighborhood: string;
  riskScore: number; // 0-100 (higher = safer)
  overallScore?: number;
  riskLevel: RiskLevel;
  lightingQuality: 'poor' | 'fair' | 'good' | 'excellent';
  crowdDensity: 'isolated' | 'sparse' | 'moderate' | 'busy';
  activeIncidentsCount: number;
  lastUpdated: string;
  keyConcerns: string[];
}

export interface SafetyAlert {
  id: string;
  type: 'deviation' | 'missed_checkin' | 'battery_low' | 'manual_sos' | 'high_risk_zone' | 'zone_warning';
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  title: string;
  description: string;
  resolved: boolean;
  actionRequired?: string;
}

export interface UserPreferences {
  defaultCheckinIntervalMinutes: number;
  routeDeviationSensitivity: 'relaxed' | 'balanced' | 'strict';
  stealthSosEnabled: boolean;
  stealthTriggerMethod: 'power_quad_press' | 'shake_gesture' | 'volume_sequence' | 'power_button_4x' | 'volume_down_triple' | 'shake_device';
  autoShareBatteryLevel: boolean;
  autoEscalateAfterMissedCount: number;
  audioRecordingOnSos: boolean;
  nightModeAutoStart: boolean;
  theme: 'dark' | 'light' | 'system';
  lowBatteryThresholdPercent?: number;
  stealthTriggerEnabled?: boolean;
  stealthGesture?: string;
  liveAudioBeaconVolume?: number;
  shareLocationWithCircleOnStart?: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bloodType: string;
  medicalNotes: string;
  totalSafeJourneys: number;
  circleHealthScore: number;
}

export interface SafetyRiskFactor {
  category: string;
  severity: 'low' | 'moderate' | 'high';
  explanation: string;
}

export interface AiRouteInsight {
  reportId: string;
  importance: 'low' | 'moderate' | 'high';
  explanation: string;
}

export interface SafetyAssessment {
  riskScore: number; // 0–100 (higher score = more caution/risk indicated)
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  summary: string;
  factors: SafetyRiskFactor[];
  recommendations: string[];
  suggestedCheckInMinutes: number; // 1–60
  confidence: number; // 0.0–1.0
  analyzedAt: string;
  isAiAvailable: boolean;
  isDemoTelemetry?: boolean;
  statusMessage?: string;
  routeInsights?: AiRouteInsight[];
  routeRecommendation?: string;
}

export interface EmergencyEscalationEntry {
  tier: 1 | 2 | 3;
  title: string;
  recipientName: string;
  recipientPhone?: string;
  action: string;
  status: 'browser_delivered' | 'call_ready' | 'simulated' | 'unconfigured';
  timestamp: string;
  details: string;
}

export interface EmergencySosEvent {
  id: string;
  createdAt: string;
  resolvedAt?: string;
  status: 'active' | 'resolved';
  type: 'manual_sos' | 'missed_checkin_escalation' | 'deviation_escalation';
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  locationSnapshotText: string;
  journeyId?: string;
  origin?: string;
  destination?: string;
  deviationState?: DeviationState;
  distanceFromRouteMeters?: number;
  aiRiskLevel?: RiskLevel;
  browserNotificationSent: boolean;
  audioAlertTriggered: boolean;
  escalationLog: EmergencyEscalationEntry[];
}

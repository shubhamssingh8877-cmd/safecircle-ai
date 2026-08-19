export type TransportMode = 'walking' | 'rideshare' | 'transit' | 'driving' | 'cycling';
export type JourneyStatus = 'active' | 'arrived' | 'paused' | 'escalated' | 'canceled';
export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high';
export type DeviationSensitivity = 'strict' | 'balanced' | 'relaxed';
export type DeviationState = 'on_route' | 'caution' | 'deviated';

export interface Waypoint {
  id: string;
  name: string;
  timestamp: string;
  passed: boolean;
  latitude?: number;
  longitude?: number;
}

export interface CheckIn {
  id: string;
  time: string;
  status: 'confirmed' | 'missed' | 'snoozed';
  notes?: string;
  locationName?: string;
}

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
  nextCheckInInSeconds: number;
  checkInStatusState?: CheckInStatusState;
  overdueGraceSecondsRemaining?: number;
  missedCheckInCount?: number;
  waypoints: Waypoint[];
  recentCheckIns: CheckIn[];
  assignedContacts: string[]; // Contact IDs
  emergencyTierTriggered?: number;
  
  // Real OSRM Routing metadata
  routeCoordinates?: [number, number][]; // [lat, lng] array for Leaflet Polyline
  distanceMeters?: number;
  durationSeconds?: number;
  routeProfile?: string;
  profileUsed?: string;
  completedArrivalTime?: string;
}

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
  isPrimaryGuardian: boolean;
  status: 'active' | 'pending' | 'invited';
  escalationTier: 1 | 2 | 3;
  notifyOnDeviation: boolean;
  notifyOnCheckinMissed: boolean;
  notifyOnBatteryLow: boolean;
  lastActive: string;
}

export interface SafetyReport {
  id: string;
  title: string;
  category: 'lighting' | 'suspicious' | 'infrastructure' | 'transit' | 'harassment';
  severity: 'advisory' | 'caution' | 'warning';
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  timeAgo: string;
  upvotes: number;
  verified: boolean;
  verifiedBy: string;
  description: string;
}

export interface SafeHaven {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'pharmacy' | 'transit_hub' | 'verified_business';
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceKm: number;
  isOpen24Hours: boolean;
  phoneNumber: string;
  verificationBadge: string;
}

export interface RiskZone {
  id: string;
  name: string;
  overallScore: number; // 0-100, lower is safer
  lightingQuality: 'poor' | 'moderate' | 'good';
  pedestrianDensity: 'low' | 'moderate' | 'high';
  activeIncidentsCount: number;
  description: string;
  recentAlert?: string;
}

export interface UserPreferences {
  routeDeviationSensitivity: DeviationSensitivity;
  stealthTriggerEnabled: boolean;
  stealthGesture: 'power_button_4x' | 'volume_down_triple' | 'shake_device';
  autoEscalateAfterMissedCount: number;
  lowBatteryThresholdPercent: number;
  liveAudioBeaconVolume: number;
  shareLocationWithCircleOnStart: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bloodType: string;
  medicalNotes: string;
  emergencyContactId?: string;
  totalSafeJourneys: number;
  circleHealthScore: number;
}

export interface SafetyAlert {
  id: string;
  timestamp: string;
  type: 'deviation' | 'checkin_missed' | 'zone_warning' | 'sos_triggered' | 'battery_critical';
  title: string;
  message: string;
  resolved: boolean;
  actionRequired?: string;
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
  riskScore: number; // 0-100 (higher = greater caution)
  riskLevel: RiskLevel;
  summary: string;
  factors: SafetyRiskFactor[];
  recommendations: string[];
  suggestedCheckInMinutes: number;
  confidence: number;
  analyzedAt: string;
  isAiAvailable: boolean;
  isDemoTelemetry?: boolean;
  statusMessage?: string;
  routeInsights?: AiRouteInsight[];
  routeRecommendation?: string;
}

export interface EmergencyEscalationStep {
  tier: 1 | 2 | 3;
  title: string;
  recipientName: string;
  recipientPhone?: string;
  action: string;
  status: 'pending' | 'browser_delivered' | 'call_ready' | 'simulated' | 'unconfigured';
  timestamp: string;
  details: string;
}

export interface EmergencySosEvent {
  id: string;
  createdAt: string;
  resolvedAt?: string;
  status: 'active' | 'resolved' | 'cancelled';
  type: 'manual_sos' | 'missed_checkin_escalation' | 'deviation_escalation';
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  locationSnapshotText: string;
  journeyId?: string;
  origin?: string;
  destination?: string;
  deviationState?: DeviationState;
  distanceFromRouteMeters?: number;
  aiRiskLevel?: RiskLevel;
  browserNotificationSent: boolean;
  audioAlertTriggered: boolean;
  escalationLog: EmergencyEscalationStep[];
}

import { AiRouteInsight, DeviationState, SafetyAssessment, SafetyReport, SafetyRiskFactor, TransportMode } from '../types';
import { haversineDistanceMeters } from '../utils/geo';
import { calculateRouteRiskPoints, RouteRiskPoint } from '../utils/routeRisk';

export interface RouteRiskPointContext {
  reportId: string;
  reportTitle: string;
  category: string;
  severity: string;
  distanceToRouteMeters: number;
  proximity: 'on_route' | 'near_route' | 'nearby';
  upvotes: number;
  description: string;
  segmentIndex: number;
}

export interface SafetyContextPayload {
  journey: {
    mode: TransportMode;
    routeDistanceMeters: number;
    estimatedDurationSeconds: number;
    deviationState: DeviationState;
    distanceFromRouteMeters: number;
    deviationThresholdMeters: number;
    gpsAccuracyMeters?: number;
    originName: string;
    destinationName: string;
    isSimulatedDeviation?: boolean;
  };
  timeContext: {
    localTime: string;
    localHour: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
  routeRiskPoints: RouteRiskPointContext[];
  totalCommunityReportsInArea: number;
}

export function filterRelevantCommunityReports(
  reports: SafetyReport[],
  userCoord?: { lat: number; lng: number },
  routeCoordinates?: [number, number][]
): RouteRiskPoint[] {
  if (!reports || reports.length === 0) return [];
  if (routeCoordinates && routeCoordinates.length >= 2) {
    return calculateRouteRiskPoints(routeCoordinates, reports, userCoord, 1200);
  }

  const evaluated: RouteRiskPoint[] = [];
  for (const rep of reports) {
    if (!rep.coordinates || typeof rep.coordinates.lat !== 'number' || typeof rep.coordinates.lng !== 'number') {
      continue;
    }
    const distToUser = userCoord
      ? haversineDistanceMeters(userCoord.lat, userCoord.lng, rep.coordinates.lat, rep.coordinates.lng)
      : 800;

    if (distToUser <= 1500) {
      evaluated.push({
        reportId: rep.id,
        reportTitle: rep.title,
        category: rep.category,
        severity: rep.severity,
        description: rep.description,
        location: rep.location,
        upvotes: rep.upvotes,
        coordinates: rep.coordinates,
        distanceToRouteMeters: Math.round(distToUser),
        distanceToUserMeters: Math.round(distToUser),
        nearestRoutePoint: { lat: rep.coordinates.lat, lng: rep.coordinates.lng },
        segmentIndex: 0,
        proximity: distToUser <= 50 ? 'on_route' : distToUser <= 300 ? 'near_route' : 'nearby',
        priorityScore: 50,
      });
    }
  }

  return evaluated.slice(0, 5);
}

export function getUnavailableFallbackAssessment(reason: string = 'AI Safety Analysis Unavailable'): SafetyAssessment {
  const now = new Date();
  return {
    riskScore: 0,
    riskLevel: 'low',
    summary: `${reason}. Deterministic guardian safety net and GPS cross-track monitor remain fully active.`,
    factors: [],
    recommendations: [
      'Follow your planned route corridor',
      'Keep check-in cadences active with your trusted circle',
      'Stay in well-lit areas during night travel',
    ],
    suggestedCheckInMinutes: 15,
    confidence: 0,
    analyzedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isAiAvailable: false,
    statusMessage: reason,
    routeInsights: [],
    routeRecommendation: 'Follow the planned road corridor and maintain active check-ins.',
  };
}

export async function analyzeSafetyContext(
  context: SafetyContextPayload,
  customApiKey?: string
): Promise<SafetyAssessment> {
  const apiKey = customApiKey || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();

  if (!apiKey) {
    return getUnavailableFallbackAssessment('AI Safety Analysis Unavailable (API Key Not Configured)');
  }

  const systemInstruction = `You are SafeCircle AI, a safety decision-support assistant analyzing a real planned road route and a set of community reports supplied by the application.
Your purpose is to analyze contextual safety signals and provide cautious, explainable recommendations.
You are NOT an emergency dispatcher.
You must NOT claim certainty about whether an area is objectively safe or dangerous.
You must NOT invent incidents, crime statistics, police presence, lighting conditions, coordinates, or external facts.
Use only the supplied structured context and route hazard distances.

When analyzing supplied community reports:
1. Explain specifically why a given report matters along the route (e.g. proximity to road, severity, or nighttime relevance).
2. If no relevant reports are near the route, explicitly state that no community hazard signals were found near the corridor.
3. If multiple reports indicate a similar concern, you may identify that as corroborating user-submitted information, but you must make clear that these are community reports.
4. Frame all conclusions as advisory decision-support.

Return ONLY valid structured JSON matching this schema:
{
  "riskScore": number (0 to 100, where higher indicates greater caution/risk),
  "riskLevel": "low" | "moderate" | "elevated" | "high",
  "summary": string (concise 1-2 sentence advisory summary),
  "factors": [
    {
      "category": string,
      "severity": "low" | "moderate" | "high",
      "explanation": string
    }
  ],
  "recommendations": string[] (2-4 clear actionable precautions),
  "suggestedCheckInMinutes": number (recommended checkin interval in minutes: 5 to 30),
  "confidence": number (confidence score from 0.1 to 1.0 based on data completeness),
  "routeInsights": [
    {
      "reportId": string (must match one of the supplied reportIds in routeRiskPoints),
      "importance": "low" | "moderate" | "high",
      "explanation": string (explainable contextual assessment of this hazard along the route)
    }
  ],
  "routeRecommendation": string (concise actionable navigation advisory regarding the corridor)
}`;

  const promptUserMessage = `Here is the current structured safety and route context:
${JSON.stringify(context, null, 2)}

Provide your cautious, explainable route-risk assessment as JSON.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: promptUserMessage }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 400 || res.status === 403) {
        return getUnavailableFallbackAssessment('AI API Key Invalid or Permissions Denied');
      } else if (res.status === 429) {
        return getUnavailableFallbackAssessment('AI Rate Limit Exceeded — Cooldown Active');
      }
      return getUnavailableFallbackAssessment(`AI Service Returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return getUnavailableFallbackAssessment('AI Safety Analysis Returned Empty Response');
    }

    const parsed = JSON.parse(rawText);

    const rawRiskScore = Number(parsed.riskScore);
    const riskScore = isNaN(rawRiskScore) ? 50 : Math.max(0, Math.min(100, Math.round(rawRiskScore)));

    const validLevels: Array<'low' | 'moderate' | 'elevated' | 'high'> = ['low', 'moderate', 'elevated', 'high'];
    const riskLevel: 'low' | 'moderate' | 'elevated' | 'high' = validLevels.includes(parsed.riskLevel)
      ? parsed.riskLevel
      : riskScore >= 75
      ? 'high'
      : riskScore >= 50
      ? 'elevated'
      : riskScore >= 25
      ? 'moderate'
      : 'low';

    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : 'Contextual risk analyzed from active journey telemetry and community reports.';

    const rawFactors = Array.isArray(parsed.factors) ? parsed.factors : [];
    const factors: SafetyRiskFactor[] = rawFactors
      .filter((f: any) => f && typeof f === 'object' && f.category && f.explanation)
      .map((f: any) => ({
        category: String(f.category),
        severity: ['low', 'moderate', 'high'].includes(f.severity) ? f.severity : 'moderate',
        explanation: String(f.explanation),
      }));

    const rawRecs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    const recommendations: string[] = rawRecs
      .filter((r: any) => typeof r === 'string' && r.trim().length > 0)
      .map((r: any) => r.trim());

    const rawMinutes = Number(parsed.suggestedCheckInMinutes);
    const suggestedCheckInMinutes = isNaN(rawMinutes)
      ? 15
      : Math.max(5, Math.min(60, Math.round(rawMinutes)));

    const rawConf = Number(parsed.confidence);
    const confidence = isNaN(rawConf) ? 0.8 : Math.max(0.1, Math.min(1.0, Math.round(rawConf * 100) / 100));

    const rawInsights = Array.isArray(parsed.routeInsights) ? parsed.routeInsights : [];
    const routeInsights: AiRouteInsight[] = rawInsights
      .filter((ins: any) => ins && typeof ins === 'object' && ins.reportId && ins.explanation)
      .map((ins: any) => ({
        reportId: String(ins.reportId),
        importance: ['low', 'moderate', 'high'].includes(ins.importance) ? ins.importance : 'moderate',
        explanation: String(ins.explanation),
      }));

    const routeRecommendation =
      typeof parsed.routeRecommendation === 'string' && parsed.routeRecommendation.trim()
        ? parsed.routeRecommendation.trim()
        : 'Stay on the planned corridor and remain observant of surroundings.';

    const now = new Date();
    const analyzedAt = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      riskScore,
      riskLevel,
      summary,
      factors,
      recommendations: recommendations.length > 0 ? recommendations : ['Stay alert on your planned path'],
      suggestedCheckInMinutes,
      confidence,
      analyzedAt,
      isAiAvailable: true,
      isDemoTelemetry: Boolean(context.journey.isSimulatedDeviation),
      statusMessage: 'Live Gemini Analysis',
      routeInsights,
      routeRecommendation,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return getUnavailableFallbackAssessment('AI Request Timed Out');
    }
    return getUnavailableFallbackAssessment('AI Network Connection Error');
  }
}

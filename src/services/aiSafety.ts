import { AiRouteInsight, DeviationState, SafetyAssessment, SafetyReport, SafetyRiskFactor, TransportMode } from '../types';
import { haversineDistanceMeters } from '../utils/geo';
import { calculateRouteRiskPoints, RouteRiskPoint } from '../utils/routeRisk';

export interface RouteRiskPointContext {
  reportId: string;
  reportTitle: string;
  category: string;
  severity: string;
  distanceToRouteMeters: number;
  proximity: 'on_route' | 'near_route' | 'nearby' | 'distant';
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

/**
 * Filter community reports within ~1.5km of the traveler's route or current location.
 * Adds distance and proximity classification ('near_route' | 'nearby' | 'distant').
 */
export function filterRelevantCommunityReports(
  reports: SafetyReport[],
  userCoord?: { lat: number; lng: number },
  routeCoordinates?: [number, number][]
): RouteRiskPoint[] {
  if (!reports || reports.length === 0) return [];
  if (routeCoordinates && routeCoordinates.length >= 2) {
    return calculateRouteRiskPoints(routeCoordinates, reports, userCoord, 1200);
  }

  // Fallback if no full polyline exists yet (evaluate distance to user coordinate)
  const evaluated: RouteRiskPoint[] = [];
  for (const rep of reports) {
    if (!rep.coordinates || typeof rep.coordinates.lat !== 'number' || typeof rep.coordinates.lng !== 'number') {
      continue;
    }
    const distToUser = userCoord
      ? haversineDistanceMeters(userCoord.lat, userCoord.lng, rep.coordinates.lat, rep.coordinates.lng)
      : 9999;

    let prox: RouteRiskPoint['proximity'] = 'distant';
    if (distToUser <= 150) prox = 'on_route';
    else if (distToUser <= 450) prox = 'near_route';
    else if (distToUser <= 1200) prox = 'nearby';

    if (distToUser <= 1500) {
      evaluated.push({
        report: rep,
        distanceToRouteMeters: Math.round(distToUser),
        proximity: prox,
        nearestSegmentIndex: 0,
      });
    }
  }

  return evaluated.sort((a, b) => a.distanceToRouteMeters - b.distanceToRouteMeters);
}

/**
 * Fallback explainable assessment generator when API is unreachable or rate-limited.
 */
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

/**
 * Calls Google Gemini API to analyze journey safety context and produce explainable route-risk assessment.
 */
export async function analyzeSafetyContext(
  context: SafetyContextPayload,
  customApiKey?: string
): Promise<SafetyAssessment> {
  const apiKey = customApiKey || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();

  // If no API key is provided, return structured offline state immediately without crashing
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
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

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
          maxOutputTokens: 800,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[Gemini API Error] Status ${res.status}:`, errorText);
      return getUnavailableFallbackAssessment(`AI Engine Error (${res.status})`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return getUnavailableFallbackAssessment('AI Engine returned an empty response');
    }

    const parsed = JSON.parse(rawText);

    // Validate structured fields with type-safe guards
    const riskScore = typeof parsed.riskScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.riskScore)))
      : 25;

    const riskLevel: SafetyAssessment['riskLevel'] =
      ['low', 'moderate', 'elevated', 'high'].includes(parsed.riskLevel)
        ? parsed.riskLevel
        : riskScore >= 75 ? 'high' : riskScore >= 50 ? 'elevated' : riskScore >= 25 ? 'moderate' : 'low';

    const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : 'Route monitored under standard guardian protocols.';

    const factors = Array.isArray(parsed.factors)
      ? parsed.factors.filter((f: any) => f && typeof f.category === 'string' && typeof f.explanation === 'string')
      : [];

    const recommendations = Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
      ? parsed.recommendations.filter((r: any) => typeof r === 'string')
      : [
          'Stay along well-illuminated main roadways',
          'Confirm safety check-in prompt upon arrival',
        ];

    const suggestedCheckInMinutes = typeof parsed.suggestedCheckInMinutes === 'number'
      ? Math.max(5, Math.min(45, Math.round(parsed.suggestedCheckInMinutes)))
      : 15;

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0.1, Math.min(1.0, parsed.confidence))
      : 0.85;

    const routeInsights: AiRouteInsight[] = Array.isArray(parsed.routeInsights)
      ? parsed.routeInsights.filter((i: any) => i && typeof i.reportId === 'string' && typeof i.explanation === 'string')
      : [];

    const routeRecommendation = typeof parsed.routeRecommendation === 'string' && parsed.routeRecommendation.trim()
      ? parsed.routeRecommendation.trim()
      : 'Follow your planned road corridor and maintain active check-ins.';

    const now = new Date();
    return {
      riskScore,
      riskLevel,
      summary,
      factors,
      recommendations,
      suggestedCheckInMinutes,
      confidence,
      analyzedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiAvailable: true,
      statusMessage: 'Live AI Route Intelligence Active (Gemini 2.5 Flash)',
      routeInsights,
      routeRecommendation,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('[Gemini API] Request timed out after 12s. Reverting to fallback.');
      return getUnavailableFallbackAssessment('AI Safety Analysis Timed Out');
    }
    console.warn('[Gemini API] Network or execution failure:', error);
    return getUnavailableFallbackAssessment('AI Safety Network Failure');
  }
}

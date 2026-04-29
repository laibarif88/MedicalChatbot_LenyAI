/**
 * AI-Powered Medical Context Detection Service
 * Uses NLP to dynamically detect medical content and extract symptoms
 */
import aiService from "./aiService";
import { SymptomDetail } from '../types/contextType';

interface MedicalDetectionResult {
  isMedical: boolean;
  confidence: number;
  symptoms: string[];
  symptomDetails: SymptomDetail[];
  missingInformation: string[];
  contextType:
    | "symptom"
    | "medication"
    | "condition"
    | "procedure"
    | "general"
    | "non-medical";
}

// interface SymptomAnalysis {
//   name: string;
//   confidence: number;
//   attributes: {
//     duration?: string;
//     severity?: string;
//     location?: string;
//     character?: string;
//     timing?: string;
//   };
//   completeness: number; // 0-100
// }

export class MedicalContextDetector {
  /**
   * AI-Powered medical content detection
   */
  static async detectMedicalContent(
    message: string
  ): Promise<MedicalDetectionResult> {
    const analysisPrompt = `Analyze this user message to determine if it contains medical content and extract symptoms intelligently.

USER MESSAGE: "${message}"

Analyze for:
1. Medical relevance (symptoms, conditions, medications, health concerns)
2. Symptom mentions (explicit and implicit)
3. Context type (symptom inquiry, medication question, condition discussion, etc.)
4. Missing clinical information

Consider:
- Synonyms and related terms (e.g., "hurts" = pain, "throwing up" = vomiting)
- Negations (e.g., "no fever" means fever was considered)
- Severity indicators (e.g., "really bad", "mild")
- Duration mentions (e.g., "since yesterday", "for 3 days")
- Location descriptors (e.g., "in my head", "chest area")
- Associated symptoms (e.g., "with nausea", "and dizziness")

Respond with JSON:
{
  "isMedical": boolean,
  "confidence": number (0-1),
  "symptoms": string[],
  "symptomDetails": [{"name": string, "confidence": number, "attributes": {}}],
  "missingInformation": string[],
  "contextType": "symptom"|"medication"|"condition"|"procedure"|"general"|"non-medical"
}`;

    try {
      const response = await aiService.getResponse(
        analysisPrompt,
        "provider",
        false
      );
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("AI medical detection failed:", error);
    }

    // Fallback to enhanced keyword detection
    return this.enhancedKeywordDetection(message);
  }

  /**
   * Enhanced keyword detection with NLP patterns
   */
  private static enhancedKeywordDetection(
    message: string
  ): MedicalDetectionResult {
    const lowerMessage = message.toLowerCase();

    // Expanded medical patterns with synonyms
    const medicalPatterns = {
      pain: /\b(pain|hurt|ache|sore|tender|discomfort|sensation)\b/i,
      gastrointestinal:
        /\b(nausea|vomit|throw up|sick to stomach|diarrhea|constipation|bloat|indigestion|heartburn)\b/i,
      respiratory:
        /\b(cough|sneeze|congestion|runny nose|sore throat|shortness of breath|wheeze|chest tightness)\b/i,
      neurological:
        /\b(dizziness|vertigo|lightheaded|headache|migraine|numbness|tingling|weakness)\b/i,
      general: /\b(fever|chills|fatigue|tired|weak|malaise|unwell|sick|ill)\b/i,
      cardiovascular:
        /\b(chest pain|palpitations|racing heart|swelling|edema)\b/i,
      dermatological: /\b(rash|itch|redness|swelling|inflammation|lesion)\b/i,
    };

    const symptoms: string[] = [];
    let medicalConfidence = 0;

    // Detect symptoms and calculate confidence
    Object.entries(medicalPatterns).forEach(([category, pattern]) => {
      if (pattern.test(lowerMessage)) {
        symptoms.push(category);
        medicalConfidence += 0.3;
      }
    });

    // Enhanced duration detection
    const durationPatterns = [
      /(\d+\s*(days?|hours?|weeks?|months?|years?))/i,
      /(since|for|last|yesterday|today|morning|evening|night)/i,
      /(acute|chronic|recent|sudden|gradual)/i,
    ];

    // Enhanced severity detection
    const severityPatterns = [
      /(\d+\s*\/\s*10|\d+\s*out\s*of\s*10)/i,
      /(mild|moderate|severe|extreme|unbearable|intense)/i,
      /(bad|terrible|awful|horrible|excruciating)/i,
    ];

    // Enhanced location detection
    const locationPatterns = [
      /\b(head|forehead|temple|sinus|chest|stomach|abdomen|back|neck|shoulder|arm|leg|joint)\b/i,
      /\b(throat|ear|eye|nose|mouth|lung|heart|kidney|liver)\b/i,
      /(left|right|upper|lower|middle|central)/i,
    ];

    const missingInfo: string[] = [];
    if (!durationPatterns.some((p) => p.test(lowerMessage)))
      missingInfo.push("duration");
    if (!severityPatterns.some((p) => p.test(lowerMessage)))
      missingInfo.push("severity");
    if (!locationPatterns.some((p) => p.test(lowerMessage)))
      missingInfo.push("location");

    const isMedical = medicalConfidence > 0.2;
    const contextType = isMedical ? "symptom" : "non-medical";

    return {
      isMedical,
      confidence: Math.min(medicalConfidence, 1),
      symptoms,
      symptomDetails: symptoms.map((symptom) => ({
        name: symptom,
        confidence: 0.7,
        attributes: {},
        completeness: 30,
      })),
      missingInformation: missingInfo,
      contextType,
    };
  }

  /**
   * Dynamic symptom completeness assessment
   */
  static async assessSymptomCompleteness(
    symptomDetails: SymptomDetail[]
  ): Promise<{
    overallCompleteness: number;
    missingFields: string[];
    priorityFields: string[];
  }> {
    const assessmentPrompt = `Assess the completeness of these symptom details for medical consultation:

SYMPTOM DETAILS: ${JSON.stringify(symptomDetails, null, 2)}

For each symptom, evaluate what clinical information is missing for proper medical assessment.
Consider standard medical history taking: OPQRST (Onset, Provocation, Quality, Radiation, Severity, Timing)

Return JSON:
{
  "overallCompleteness": number (0-100),
  "missingFields": string[],
  "priorityFields": string[] (most important missing fields)
}`;

    try {
      const response = await aiService.getResponse(
        assessmentPrompt,
        "provider",
        false
      );
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Symptom completeness assessment failed:", error);
    }

    // Fallback assessment
    return {
      overallCompleteness: 40,
      missingFields: ["duration", "severity", "location", "timing"],
      priorityFields: ["duration", "severity"],
    };
  }

  /**
   * Extract temporal information with NLP
   */
  /**
   * Extract temporal information with NLP
   */
  static extractTemporalInfo(message: string): {
    duration?: string;
    onset?: string;
    timing?: string;
  } {
    const lowerMessage = message.toLowerCase();
    const temporal: { duration?: string; onset?: string; timing?: string } = {};

    // Enhanced duration extraction
    const durationMatches = [
      ...lowerMessage.matchAll(
        /(\d+\s*(?:days?|hours?|weeks?|months?|years?))/gi
      ),
      ...lowerMessage.matchAll(/(since|for|last|past)\s+(\w+\s+\w+)/gi),
      ...lowerMessage.matchAll(
        /(yesterday|today|morning|evening|night|weekend)/gi
      ),
    ];

    if (
      durationMatches.length > 0 &&
      durationMatches[0] &&
      durationMatches[0][0]
    ) {
      temporal.duration = durationMatches[0][0];
    }

    // Onset patterns
    if (/(sudden|acute|rapid)/i.test(lowerMessage)) temporal.onset = "sudden";
    if (/(gradual|slow|progressiv)/i.test(lowerMessage))
      temporal.onset = "gradual";

    // Timing patterns
    if (/(morning|evening|night|noon|afternoon)/i.test(lowerMessage))
      temporal.timing = "specific time";
    if (/(after eating|before bed|during exercise)/i.test(lowerMessage))
      temporal.timing = "activity related";

    return temporal;
  }

  /**
   * Extract severity with context understanding
   */
  static extractSeverity(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();

    // Numeric scale
    const numericMatch = lowerMessage.match(/(\d+)\s*\/\s*10/);
    if (numericMatch) return `${numericMatch[1]}/10`;

    // Descriptive severity
    const severityMap: { [key: string]: string } = {
      mild: "mild",
      moderate: "moderate",
      severe: "severe",
      extreme: "severe",
      unbearable: "severe",
      intense: "severe",
      bad: "moderate",
      terrible: "severe",
      awful: "severe",
      horrible: "severe",
      excruciating: "severe",
    };

    for (const [term, severity] of Object.entries(severityMap)) {
      if (lowerMessage.includes(term)) return severity;
    }

    return undefined;
  }
}

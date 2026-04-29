/**
 * Medical Keyword Detection Service
 * Frontend keyword matching to identify medical queries
 */

export class MedicalKeywordDetector {
  private static medicalPatterns = {
    pain: /\b(pain|hurt|ache|sore|tender|discomfort|throbbing|stabbing)\b/i,
    headache: /\b(headache|migraine|head pain)\b/i,
    fever: /\b(fever|temperature|hot|chills)\b/i,
    nausea: /\b(nausea|sick to stomach|queasy|vomit|throw up)\b/i,
    fatigue: /\b(fatigue|tired|exhausted|weak|lethargic)\b/i,
    dizziness: /\b(dizziness|vertigo|lightheaded|woozy)\b/i,
    respiratory: /\b(cough|sneeze|breath|wheeze|congestion|runny nose)\b/i,
    gastrointestinal: /\b(stomach|abdomen|belly|diarrhea|constipation|bloat)\b/i,
    cardiovascular: /\b(chest pain|palpitations|heart|pulse|blood pressure)\b/i,
    general: /\b(symptom|ill|sick|unwell|condition|diagnosis|treatment)\b/i
  };

  /**
   * Detect medical keywords in user message
   */
  static detectMedicalKeywords(message: string): {
    isMedical: boolean;
    symptomType: string[];
    confidence: number;
  } {
    const lowerMessage = message.toLowerCase();
    const detectedSymptoms: string[] = [];
    let confidence = 0;

    // Check each medical pattern
    Object.entries(this.medicalPatterns).forEach(([symptomType, pattern]) => {
      if (pattern.test(lowerMessage)) {
        detectedSymptoms.push(symptomType);
        confidence += 0.2; // Increase confidence for each detected symptom
      }
    });

    // Additional confidence boost for clear medical terms
    if (/(doctor|hospital|clinic|medical|health|medicine)/i.test(lowerMessage)) {
      confidence += 0.3;
    }

    return {
      isMedical: detectedSymptoms.length > 0 || confidence > 0.3,
      symptomType: detectedSymptoms,
      confidence: Math.min(confidence, 1)
    };
  }

  /**
   * Check if symptom description is vague/incomplete
   */
  static isVagueSymptom(message: string, symptomType: string[]): boolean {
    const lowerMessage = message.toLowerCase();
    
    // If message is very short and contains only symptom names
    if (message.length < 20 && symptomType.length > 0) {
      return true;
    }

    // Check for missing details
    const hasDetails = 
      /\d+/.test(lowerMessage) || // Numbers (duration, severity)
      /(day|week|month|hour|minute)/i.test(lowerMessage) || // Time references
      /(scale|rate|score|level)/i.test(lowerMessage) || // Severity indicators
      /(location|where|area|part)/i.test(lowerMessage) || // Location references
      /(with|along|also|accompanied)/i.test(lowerMessage); // Associated symptoms

    return !hasDetails;
  }

  /**
   * Extract primary symptom from message
   */
  static getSymptomType(message: string): string {
    const detection = this.detectMedicalKeywords(message);
    return detection.symptomType[0] || 'general';
  }
}
import { MedicalContextDetector } from "./medicalContextDetector";
import {
  ContextState,
  createContextState,
  getContextState,
  updateContextState,
  deleteContextState,
  updateContextHistory,
} from "./firestoreService";
import { aiService } from "./aiService";
import { MedicalKeywordDetector } from "./keywordDetector";
import {
  MedicalDetectionResult,
  SymptomData,
  SymptomDetail,
} from "../types/contextType";

export interface ContextProcessingResult {
  shouldProceedToAI: boolean;
  enhancedMessage?: string;
  followUpQuestions?: string[];
  currentQuestionIndex?: number;
  currentContext?: ContextState;
  isMedical?: boolean;
}

export class DynamicContextManager {
  private static readonly MIN_COMPLETENESS_THRESHOLD = 70;

  /**
   * MAIN ENTRY POINT - Dynamic context processing
   */
  static async processMessage(
  message: string,
  conversationId: string,
  userId: string,
  userType: "patient" | "provider"
): Promise<ContextProcessingResult> {
  // Get context state and medical detection in parallel
  const [context, medicalAnalysis] = await Promise.all([
    getContextState(conversationId, userId),
    MedicalContextDetector.detectMedicalContent(message)
  ]);

  // Check if we're in the middle of context gathering
  if (context && context.currentState === "gathering") {
    console.log("🔄 Already in gathering state, processing as follow-up");
    // Process immediately without additional checks
    return await this.processWithDynamicContext(
      message,
      context,
      medicalAnalysis,
      userType
    );
  }

  // Only apply context gathering for patients with medical queries
  if (userType !== "patient" || !medicalAnalysis.isMedical) {
    return {
      shouldProceedToAI: true,
      enhancedMessage: message,
      isMedical: medicalAnalysis.isMedical,
    };
  }

  // Create context if needed and process in parallel
  let effectiveContext = context;
  if (!effectiveContext) {
    const contextId = await createContextState(
      conversationId,
      userId,
      message,
      message
    );
    effectiveContext = await getContextState(conversationId, userId);
  }

  if (!effectiveContext) {
    return {
      shouldProceedToAI: true,
      enhancedMessage: message,
      isMedical: true,
    };
  }

  // Extract structured data and update history in parallel
  const extractionPromise = this.extractStructuredData(message, medicalAnalysis);
  
  await updateContextHistory(effectiveContext.id, {
    role: "user",
    content: message,
    timestamp: new Date(),
    extractedData: await extractionPromise,
  });

  // Process with dynamic context
  return await this.processWithDynamicContext(
    message,
    effectiveContext,
    medicalAnalysis,
    userType
  );
}

  /**
   * Dynamic context processing with AI assessment
   */
  private static async processWithDynamicContext(
    message: string,
    context: ContextState,
    medicalAnalysis: MedicalDetectionResult,
    userType: "patient" | "provider"
  ): Promise<ContextProcessingResult> {
    // Check if this is an answer to a follow-up question
    const isFollowUpAnswer =
      context.currentState === "gathering" &&
      context.currentQuestionIndex !== undefined;

    console.log("🔍 Context analysis:", {
      currentState: context.currentState,
      currentQuestionIndex: context.currentQuestionIndex,
      followUpQuestionsCount: context.followUpQuestions?.length,
      isFollowUpAnswer,
      message: message,
      symptomType: context.symptomType,
      gatheredData: context.gatheredData,
    });

    if (isFollowUpAnswer) {
      console.log("🔄 Processing as follow-up answer");
      return await this.processFollowUpAnswer(
        message,
        context,
        medicalAnalysis
      );
    } else {
      // This is a new symptom description or initial message
      console.log("🆕 Processing as new symptom");
      return await this.processNewSymptom(message, context, medicalAnalysis);
    }
  }

  /**
   * Process answer to a follow-up question - AI-POWERED
   * FIXED: Be more lenient with medical responses
   */
  private static async processFollowUpAnswer(
    message: string,
    context: ContextState,
    medicalAnalysis: MedicalDetectionResult
  ): Promise<ContextProcessingResult> {
    const currentQuestionIndex = context.currentQuestionIndex || 0;

    // Check if currentQuestionIndex is within bounds
    if (
      !context.followUpQuestions ||
      currentQuestionIndex >= context.followUpQuestions.length
    ) {
      console.error("❌ Invalid question index, checking completeness...", {
        currentQuestionIndex,
        totalQuestions: context.followUpQuestions?.length,
      });

      // Check if we have sufficient context despite the index issue
      const completeness = await this.analyzeCompleteness(
        context.gatheredData,
        context
      );

      if (completeness.isComplete) {
        console.log(
          "✅ Context complete despite index issue, proceeding to AI"
        );
        return await this.handleCompleteContext(context);
      } else {
        // Generate new questions
        console.log("🔄 Generating new follow-up questions due to index issue");
        return await this.handleIncompleteContext(context, completeness);
      }
    }

    // Get the current field and question
    const currentField = context.missingFields?.[currentQuestionIndex];
    const currentQuestion = context.followUpQuestions[currentQuestionIndex];

    console.log("📝 Processing follow-up answer:", {
      currentQuestionIndex,
      currentField,
      currentQuestion,
      userAnswer: message,
      totalQuestions: context.followUpQuestions.length,
    });

    if (!currentField || !currentQuestion) {
      console.error(
        "❌ Missing current field or question, generating new questions"
      );
      const completeness = await this.analyzeCompleteness(
        context.gatheredData,
        context
      );
      return await this.handleIncompleteContext(context, completeness);
    }

    // Use AI-powered extraction and validation - FIXED: More lenient for medical context
    const extractionResult = await this.extractAndValidateField(
      message,
      currentField,
      context,
      currentQuestion
    );

    console.log("✅ AI Field extraction result:", extractionResult);

    // FIXED: Only treat as unclear if it's truly non-responsive, not vague medical answers
    const isTrulyUnclear = await this.isTrulyUnclearOrNonResponsive(
      message,
      currentQuestion,
      currentField
    );

    if (isTrulyUnclear && !extractionResult.isValid) {
      console.log("❌ User provided truly unclear answer, asking again differently");
      const rephrasedQuestion = await this.createRephrasedQuestion(
        currentQuestion,
        message,
        currentField
      );
      return {
        shouldProceedToAI: false,
        followUpQuestions: [rephrasedQuestion],
        currentQuestionIndex: currentQuestionIndex, // Stay on same question
        currentContext: context,
      };
    }

    if (extractionResult.isValid) {
      // Update the gathered data with the extracted value
      const updatedGatheredData = this.updateGatheredDataWithField(
        context.gatheredData,
        currentField,
        extractionResult.value
      );

      await updateContextState(context.id, {
        gatheredData: updatedGatheredData,
      });

      const updatedContext = {
        ...context,
        gatheredData: updatedGatheredData,
      };

      // Check if we have more questions to ask
      const nextQuestionIndex = currentQuestionIndex + 1;
      const hasMoreQuestions =
        context.followUpQuestions &&
        nextQuestionIndex < context.followUpQuestions.length;

      console.log("➡️ Next step analysis:", {
        nextQuestionIndex,
        totalQuestions: context.followUpQuestions.length,
        hasMoreQuestions,
        gatheredData: updatedGatheredData,
      });

      if (hasMoreQuestions) {
        // Ask the next question - ONLY ONE QUESTION
        await updateContextState(context.id, {
          currentQuestionIndex: nextQuestionIndex,
        });

        const nextQuestion = context.followUpQuestions[nextQuestionIndex];

        if (!nextQuestion) {
          console.error("❌ No valid next question found, proceeding to AI");
          return await this.handleCompleteContext(updatedContext);
        }

        console.log("❓ Asking next question:", nextQuestion);
        return {
          shouldProceedToAI: false,
          followUpQuestions: [nextQuestion],
          currentQuestionIndex: nextQuestionIndex,
          currentContext: updatedContext,
        };
      } else {
        // All questions answered - check if we have sufficient context
        console.log("🎯 All questions answered, checking completeness...");
        const completeness = await this.analyzeCompleteness(
          updatedContext.gatheredData,
          updatedContext
        );

        console.log("📊 Final completeness check:", completeness);

        if (completeness.isComplete) {
          console.log("✅ Context complete, proceeding to AI");
          return await this.handleCompleteContext(updatedContext);
        } else {
          // Still need more information - generate new follow-up questions
          console.log(
            "🔄 Still incomplete, generating new follow-up questions"
          );
          return await this.handleIncompleteContext(
            updatedContext,
            completeness
          );
        }
      }
    } else {
      // Invalid answer - ask the same question again with AI-guided help
      console.log("❌ Invalid answer, asking again with AI guidance");
      const guidedQuestion = await this.createGuidedQuestion(
        currentQuestion,
        extractionResult.reason ?? "Please provide a valid answer.",
        message
      );
      return {
        shouldProceedToAI: false,
        followUpQuestions: [guidedQuestion],
        currentQuestionIndex: currentQuestionIndex, // Same index
        currentContext: context,
      };
    }
  }
/**
   * IMPROVED: Create guided question with AI help
   */
  private static async createGuidedQuestion(
    originalQuestion: string,
    reason: string,
    userAnswer: string
  ): Promise<string> {
    const guidancePrompt = `Create a helpful, empathetic follow-up question when a user's answer was unclear or invalid.

ORIGINAL QUESTION: "${originalQuestion}"
USER'S ANSWER: "${userAnswer}"
REASON FOR GUIDANCE: "${reason}"

Create a natural, compassionate follow-up that:
1. Acknowledges their attempt to answer
2. Gives clear, specific guidance on what information is needed
3. Provides examples of acceptable answers
4. Maintains a supportive, non-judgmental tone
5. Encourages them to try again

Return only the follow-up question as a string.`;

    try {
      const guidedQuestion = await aiService.getResponse(
        guidancePrompt,
        "provider",
        false
      );

      return guidedQuestion.trim();
    } catch (error) {
      console.error("AI-guided question failed:", error);
      // Fallback guided question
      return `${reason} Let me ask again: ${originalQuestion}`;
    }
  }
  /**
 * FIXED: Use AI for all unclear answer detection - no pattern matching
 */
private static async isTrulyUnclearOrNonResponsive(
  message: string,
  currentQuestion: string,
  field: string
): Promise<boolean> {
  const clarityPrompt = `Analyze if this user's answer is truly unclear, non-responsive, or indicates they cannot provide the requested information.

QUESTION: "${currentQuestion}"
FIELD BEING ASKED: ${field}
USER'S ANSWER: "${message}"

Determine if the answer is:
1. CLEAR: Provides relevant information for the field (even if vague)
2. UNCLEAR: Truly non-responsive, indicates lack of knowledge, or completely unrelated

CRITICAL GUIDELINES:
- ACCEPT vague but relevant medical answers: "a couple months", "since start of year", "recently", "sometimes mild sometimes severe"
- REJECT truly unclear: "I don't know", "idk", "not sure", "no idea", "I don't remember", "can't say"
- ACCEPT descriptive answers even if not precise
- REJECT answers that avoid providing the requested information

EXAMPLES:
- ✅ ACCEPT: "a few months" → CLEAR (vague but relevant)
- ✅ ACCEPT: "since yesterday" → CLEAR 
- ✅ ACCEPT: "sometimes bad sometimes okay" → CLEAR (descriptive)
- ✅ ACCEPT: "in my knee area" → CLEAR
- ❌ REJECT: "I don't know" → UNCLEAR
- ❌ REJECT: "idk" → UNCLEAR  
- ❌ REJECT: "not sure" → UNCLEAR
- ❌ REJECT: "maybe" → UNCLEAR
- ❌ REJECT: "what?" → UNCLEAR
- ❌ REJECT: "I don't remember" → UNCLEAR

Return JSON:
{
  "isUnclear": boolean,
  "reason": "Brief explanation",
  "confidence": number
}`;

  try {
    const response = await aiService.getResponse(
      clarityPrompt,
      "provider", 
      false
    );

    console.log("🎯 AI clarity analysis response:", response);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      console.log("🎯 AI clarity analysis result:", analysis);
      return analysis.isUnclear === true;
    }
  } catch (error) {
    console.error("AI clarity analysis failed:", error);
  }

  // Fallback: Very conservative pattern matching only for obvious cases
  const lowerMessage = message.toLowerCase().trim();
  const obviousUnclearPatterns = [
    /^(i don't know|idk|not sure|unsure|no idea|i'm not sure)$/i,
    /^(i don't remember|i forgot|can't remember|not certain)$/i,
    /^(what|how|why|when|where|who)\s+(is|are|do|does|should|can)/i,
    /^(maybe|perhaps|probably)$/i,
    /^.{0,2}$/, // Extremely short
  ];

  return obviousUnclearPatterns.some(pattern => pattern.test(lowerMessage));
}

  /**
   * NEW: Create rephrased question for unclear answers
   */
  private static async createRephrasedQuestion(
    originalQuestion: string,
    userAnswer: string,
    field: string
  ): Promise<string> {
    const rephrasePrompt = `Create a rephrased, more specific question when a user gives an unclear answer.

ORIGINAL QUESTION: "${originalQuestion}"
USER'S UNCLEAR ANSWER: "${userAnswer}"
FIELD BEING ASKED: ${field}

Create a compassionate, rephrased question that:
1. Acknowledges their difficulty answering
2. Provides clearer guidance or examples
3. Breaks down the question into simpler terms if needed
4. Encourages them to provide any relevant information
5. Maintains supportive, understanding tone

Examples for different fields:

DURATION rephrasing:
- "I understand it's hard to recall exactly. Can you give me a rough estimate, like 'a few days', 'about a week', or 'since yesterday'?"
- "No problem if you're not sure. Was it recent (this week) or has it been going on for longer (weeks or months)?"

SEVERITY rephrasing:  
- "I know it's subjective. On a scale where 1 is barely noticeable and 10 is the worst imaginable, what number would you give it?"
- "Could you describe how it affects your daily activities - mild (can ignore), moderate (distracting), or severe (can't function)?"

LOCATION rephrasing:
- "Let me ask differently - if you had to point to one spot where it's most noticeable, where would that be?"
- "Can you describe the area - is it more on the left or right side, upper or lower part?"

CHARACTER rephrasing:
- "I understand it's hard to describe. Does it feel more like a sharp pain, dull ache, throbbing, burning, or something else?"
- "Could you compare it to any sensation you've felt before?"

TIMING rephrasing:
- "Let me ask differently - is there any particular time when it gets better or worse?"
- "Does it follow any pattern - like after meals, during certain activities, or at specific times of day?"

Return only the rephrased question as a string.`;

    try {
      const rephrasedQuestion = await aiService.getResponse(
        rephrasePrompt,
        "provider",
        false
      );
      return rephrasedQuestion.trim();
    } catch (error) {
      console.error("AI rephrasing failed:", error);
      // Fallback rephrased questions by field
      const fallbackRephrased: { [key: string]: string } = {
        duration: "I understand it's hard to recall exactly. Could you give me a rough estimate of how long this has been going on?",
        severity: "I know it's subjective, but could you try to describe how severe it feels on a scale from 1 to 10, where 1 is very mild and 10 is the worst possible?",
        location: "Let me ask differently - if you had to point to where it's most noticeable, where would that be?",
        character: "I understand it's hard to describe. Could you tell me what kind of sensation it feels like - sharp, dull, throbbing, burning, or something else?",
        timing: "Let me ask differently - is there any particular time or situation when it seems to get better or worse?"
      };
      return fallbackRephrased[field] || `Let me ask again: ${originalQuestion}`;
    }
  }

  /**
   * Process new symptom description
   */
  private static async processNewSymptom(
    message: string,
    context: ContextState,
    medicalAnalysis: MedicalDetectionResult
  ): Promise<ContextProcessingResult> {
    console.log("🆕 Processing new symptom:", message);

    // Update context with new medical analysis
    const updatedContext = await this.updateContextWithAnalysis(
      context,
      medicalAnalysis,
      message
    );

    console.log("📋 Updated context with analysis:", {
      symptomType: updatedContext.symptomType,
      gatheredData: updatedContext.gatheredData,
    });

    // AI-powered completeness assessment
    const completeness = await this.analyzeCompleteness(
      updatedContext.gatheredData,
      updatedContext
    );

    console.log("📊 New symptom completeness:", completeness);

    // Check if we have sufficient context
    if (completeness.isComplete) {
      console.log("✅ Sufficient context, proceeding to AI");
      return await this.handleCompleteContext(updatedContext);
    } else {
      console.log("❌ Insufficient context, generating follow-up questions");
      return await this.handleIncompleteContext(updatedContext, completeness);
    }
  }

  /**
   * Handle incomplete context - Generate questions but ask one at a time
   */
  private static async handleIncompleteContext(
    context: ContextState,
    completeness: {
      isComplete: boolean;
      missingFields: string[];
      priorityFields: string[];
      completenessScore: number;
    }
  ): Promise<ContextProcessingResult> {
    const followUpQuestions = await this.generateDynamicFollowUpQuestions(
      context,
      completeness
    );

    console.log("❓ Generated follow-up questions:", followUpQuestions);

    // Validate that we have questions
    if (!followUpQuestions || followUpQuestions.length === 0) {
      console.log(
        "✅ No follow-up questions needed or could be generated, proceeding to AI"
      );
      return await this.handleCompleteContext(context);
    }

    // Update context with new questions
    await updateContextState(context.id, {
      currentState: "gathering",
      gatheredData: context.gatheredData,
      missingFields: completeness.priorityFields,
      followUpQuestions,
      currentQuestionIndex: 0,
    });

    // Return ONLY the first question
    const firstQuestion = followUpQuestions[0];

    if (!firstQuestion) {
      console.error("❌ No valid first question found, proceeding to AI");
      return await this.handleCompleteContext(context);
    }

    return {
      shouldProceedToAI: false,
      followUpQuestions: [firstQuestion],
      currentQuestionIndex: 0,
      currentContext: {
        ...context,
        currentState: "gathering",
        missingFields: completeness.priorityFields,
        followUpQuestions,
        currentQuestionIndex: 0,
      },
    };
  }

  /**
   * Handle complete context - proceed to AI
   */
  private static async handleCompleteContext(
    context: ContextState
  ): Promise<ContextProcessingResult> {
    const enhancedMessage = this.buildComprehensiveQuery(context);

    console.log("🚀 Proceeding to AI with enhanced message:", enhancedMessage);

    // Clean up completed context
    await deleteContextState(context.id);

    return {
      shouldProceedToAI: true,
      enhancedMessage,
      currentContext: context,
    };
  }

  /**
   * Update gathered data with a specific field value - IMPROVED location handling
   */
  private static updateGatheredDataWithField(
    gatheredData: SymptomData,
    field: string,
    value: string
  ): SymptomData {
    const updated = { ...gatheredData };

    switch (field) {
      case "duration":
        updated.duration = value;
        if (updated.symptoms.length > 0) {
          updated.symptoms = updated.symptoms.map((symptom) => ({
            ...symptom,
            duration: value,
          }));
        }
        break;
      case "severity":
        updated.severity = value;
        if (updated.symptoms.length > 0) {
          updated.symptoms = updated.symptoms.map((symptom) => ({
            ...symptom,
            severity: value,
          }));
        }
        break;
      case "location":
        // FIXED: Better location handling - add to locations array and update symptoms
        if (!updated.locations.includes(value)) {
          updated.locations = [...updated.locations, value];
        }
        if (updated.symptoms.length > 0) {
          updated.symptoms = updated.symptoms.map((symptom) => ({
            ...symptom,
            location: value, // Update the specific symptom location
          }));
        }
        break;
      case "character":
        updated.character = value;
        if (updated.symptoms.length > 0) {
          updated.symptoms = updated.symptoms.map((symptom) => ({
            ...symptom,
            character: value,
          }));
        }
        break;
      case "timing": // NEW: Handle timing field
        updated.timing = value;
        if (updated.symptoms.length > 0) {
          updated.symptoms = updated.symptoms.map((symptom) => ({
            ...symptom,
            timing: value,
          }));
        }
        break;
    }

    return updated;
  }

/**
 * FIXED: Extract and validate field - use AI clarity check consistently
 */
private static async extractAndValidateField(
  message: string,
  field: string,
  context: ContextState,
  currentQuestion: string
): Promise<{ isValid: boolean; value: string; reason?: string }> {
  console.log("🔍 AI-Powered field extraction:", {
    field,
    message,
    currentQuestion,
  });

  // If we're in gathering mode, always treat this as a medical response
  if (context.currentState === "gathering") {
    console.log("🎯 In gathering mode - treating as medical response");
  }

  // Basic validation - check if answer is too short or non-responsive
  if (message.length < 1) {
    return {
      isValid: false,
      value: "",
      reason: "Your answer seems too short. Could you provide more details?",
    };
  }

  // FIXED: Use AI for all unclear detection consistently
  const isTrulyUnclear = await this.isTrulyUnclearOrNonResponsive(
    message,
    currentQuestion,
    field
  );

  if (isTrulyUnclear) {
    console.log("❌ AI detected unclear answer:", message);
    return {
      isValid: false,
      value: "",
      reason: "I understand it's difficult to answer. Let me ask the question differently.",
    };
  }

  // Use AI to extract and validate the field value
  try {
    const extractionResult = await this.aiExtractFieldValue(
      message,
      field,
      currentQuestion
    );
    
    console.log("✅ AI extraction result:", extractionResult);
    
    // FIXED: Even if AI extraction fails but answer isn't unclear, we should still handle it
    if (!extractionResult.isValid) {
      // If not unclear but extraction failed, it might be a valid but complex answer
      // Accept it as-is to keep conversation flowing
      console.log("🔄 AI extraction failed but answer not unclear, accepting as-is");
      return {
        isValid: true,
        value: message,
        reason: "Accepted user's complex description",
      };
    }
    
    return extractionResult;
  } catch (error) {
    console.error("AI extraction failed:", error);
    // Fallback: if not unclear, accept the answer
    if (!isTrulyUnclear) {
      return {
        isValid: true,
        value: message,
        reason: "Accepted user's description despite technical issues",
      };
    }
    return {
      isValid: false,
      value: "",
      reason: "I had trouble understanding your answer. Could you try explaining it differently?",
    };
  }
}
/**
 * FIXED: AI extraction - reject "I don't know" type answers
 */
private static async aiExtractFieldValue(
  message: string,
  field: string,
  currentQuestion: string
): Promise<{ isValid: boolean; value: string; reason?: string }> {
  
  const extractionPrompt = `Analyze this user's answer to a medical question and extract the relevant information.

USER'S QUESTION: "${currentQuestion}"
USER'S ANSWER: "${message}"
FIELD BEING ASKED: ${field}

INSTRUCTIONS:
1. Extract the most relevant information for the ${field} field
2. BE VERY LENIENT in medical context - accept vague but reasonable answers
3. REJECT answers that indicate lack of knowledge: "I don't know", "idk", "not sure", etc.
4. Convert descriptive answers to appropriate formats when possible
5. Preserve the user's original meaning and context

EXTRACTION GUIDELINES:

DURATION (BE LENIENT BUT REJECT UNCLEAR):
- ✅ ACCEPT: "a couple of months" → "2 months", "few months" → "several months"
- ✅ ACCEPT: "since start of year" → "since beginning of year" 
- ✅ ACCEPT: "recently" → "recent", "for a while" → "some time"
- ❌ REJECT: "I don't know", "idk", "not sure", "no idea"

SEVERITY:
- ✅ ACCEPT: "8" → "8/10", "really bad" → "8/10", "mild" → "3/10"
- ✅ ACCEPT: "sometimes bad sometimes okay" → "variable (4-7/10)"
- ❌ REJECT: "I don't know", "idk", "not sure"

LOCATION:
- ✅ ACCEPT: "in my knee" → "knee", "left side" → "left side"
- ❌ REJECT: "I don't know", "idk", "not sure"

CHARACTER:
- ✅ ACCEPT: "sharp and throbbing" → "sharp, throbbing"
- ✅ ACCEPT: "comes and goes" → "intermittent"
- ❌ REJECT: "I don't know", "idk", "not sure"

TIMING:
- ✅ ACCEPT: "morning" → "morning", "after eating" → "postprandial"
- ❌ REJECT: "I don't know", "idk", "not sure"

CRITICAL: REJECT any answer that indicates the user cannot provide the information.

RESPONSE FORMAT:
Return JSON:
{
  "isValid": boolean,
  "value": string (extracted value or empty if invalid),
  "reason": string (explanation)
}

Examples:
- Answer: "since start of year" → {"isValid": true, "value": "since beginning of year", "reason": "Accepted relative time"}
- Answer: "I don't know" → {"isValid": false, "value": "", "reason": "User cannot provide information"}
- Answer: "a couple months" → {"isValid": true, "value": "2 months", "reason": "Converted vague duration"}
- Answer: "sometimes mild sometimes severe" → {"isValid": true, "value": "variable (3-8/10)", "reason": "Extracted severity pattern"}`;

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('AI extraction timeout')), 5000) // 5 second timeout
    );

    const response = await Promise.race([
      aiService.getResponse(extractionPrompt, "provider", false),
      timeoutPromise
    ]);

    console.log("🤖 AI extraction response:", response);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }

    return this.fallbackExtraction(message, field);
  } catch (error) {
    console.error("AI extraction failed, using fallback:", error);
    return this.fallbackExtraction(message, field);
  }
}


/**
 * FIXED: Fallback extraction - reject unclear answers
 */
private static fallbackExtraction(
  message: string,
  field: string
): { isValid: boolean; value: string; reason?: string } {
  const lowerMessage = message.toLowerCase().trim();

  // Check for clear non-answers
  const nonAnswerPatterns = [
    /^(i don't know|idk|not sure|unsure|no idea)$/i,
    /^(i don't remember|i forgot|can't remember|not certain)$/i,
    /^(maybe|perhaps|probably)$/i,
  ];

  if (nonAnswerPatterns.some((pattern) => pattern.test(lowerMessage))) {
    return {
      isValid: false,
      value: "",
      reason: "I need more specific information to help you properly.",
    };
  }

  // For gathering mode, be lenient but not for truly unclear answers
  if (message.length < 2) {
    return {
      isValid: false,
      value: "",
      reason: "Please provide a more detailed answer.",
    };
  }

  return {
    isValid: true,
    value: message,
    reason: "Accepted user's description",
  };
}

  /**
   * AI-powered dynamic follow-up question generation - FIXED: Use actual symptoms
   */
  private static async generateDynamicFollowUpQuestions(
    context: ContextState,
    completeness: { missingFields: string[]; priorityFields: string[] }
  ): Promise<string[]> {
    if (
      !completeness.priorityFields ||
      completeness.priorityFields.length === 0
    ) {
      return [];
    }

    // Use ACTUAL symptoms from context, not hardcoded ones
    const actualSymptoms =
      context.symptomType && context.symptomType.length > 0
        ? context.symptomType.join(" and ")
        : "your symptoms";

    console.log("🎯 Using actual symptoms for questions:", actualSymptoms);

    // Map fields to natural questions using ACTUAL symptoms
    const fieldToQuestionMap: { [key: string]: string } = {
      duration: `How long have you been experiencing problems with your ${actualSymptoms}?`,
      severity: `On a scale of 1 to 10, how badly is this issue affecting you?`,
      location: `Is the issue limited to your ${actualSymptoms}, or does it spread to other areas or specific to any location (e.g left or right side, upper or lower area)?`,
      character: `Can you describe what kind of problem you're having with your ${actualSymptoms}? (e.g., pain, swelling, discomfort)`,
      timing: `Do you notice the problem with your ${actualSymptoms} getting worse at any particular time (day/night, after meals, etc.)?`,
    };

    // Generate questions for priority fields
    const questions = completeness.priorityFields
      .slice(0, 3)
      .map(
        (field) =>
          fieldToQuestionMap[field] ||
          `Can you tell me more about ${actualSymptoms}?`
      )
      .filter(Boolean);

    console.log("🎯 Generated questions for fields:", {
      priorityFields: completeness.priorityFields,
      actualSymptoms,
      questions,
    });

    return questions;
  }

  /**
   * Extract structured data from message using AI - FIXED: Better extraction
   */
  private static async extractStructuredData(
    message: string,
    medicalAnalysis: MedicalDetectionResult
  ): Promise<Partial<SymptomData>> {
    console.log("🔍 Extracting structured data from:", message);

    // Use the ACTUAL detected symptoms from medical analysis
    const actualSymptoms = medicalAnalysis.symptoms;

    const extractionPrompt = `Extract ONLY the clinical information explicitly mentioned in this patient message. Do NOT add any information that isn't there.

PATIENT MESSAGE: "${message}"

DETECTED SYMPTOMS: ${actualSymptoms.join(", ")}

Return as JSON. If information is not mentioned, use "not specified":
{
  "symptoms": [{"name": "symptom name from detected symptoms", "duration": "explicitly mentioned duration or 'not specified'", "severity": "explicitly mentioned severity or 'not specified'", "location": "explicitly mentioned location or 'not specified'", "character": "explicitly mentioned character or 'not specified'"}],
  "duration": "explicitly mentioned duration or 'not specified'",
  "severity": "explicitly mentioned severity or 'not specified'", 
  "locations": ["explicitly mentioned locations or empty array"],
  "character": "explicitly mentioned character or 'not specified'"
}`;

    try {
      const response = await aiService.getResponse(
        extractionPrompt,
        "provider",
        false
      );
      console.log("🤖 AI extraction response:", response);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        console.log("📋 Parsed extraction:", extracted);
        return extracted;
      }
    } catch (error) {
      console.error("Structured data extraction failed:", error);
    }

    // Fallback extraction - ONLY use what's actually in the message
    return this.fallbackStructuredExtraction(message, medicalAnalysis);
  }

  /**
   * Enhanced fallback extraction with NLP patterns - FIXED: Only extract what's there
   */
  private static fallbackStructuredExtraction(
    message: string,
    medicalAnalysis: MedicalDetectionResult
  ): Partial<SymptomData> {
    console.log("🔄 Using fallback extraction for:", message);

    const temporalInfo = MedicalContextDetector.extractTemporalInfo(message);
    const severity = MedicalContextDetector.extractSeverity(message);

    // ONLY use what's actually detected, don't make up data
    const extracted: Partial<SymptomData> = {
      symptoms: medicalAnalysis.symptoms.map((symptom) => ({
        name: symptom,
        duration: temporalInfo.duration || "not specified",
        severity: severity || "not specified",
        character: this.extractSymptomCharacter(message) || "not specified",
        timing: temporalInfo.timing || "not specified",
      })),
      duration: temporalInfo.duration || "not specified",
      severity: severity || "not specified",
      locations: this.extractLocations(message),
      associatedSymptoms: medicalAnalysis.symptoms,
    };

    console.log("📋 Fallback extraction result:", extracted);
    return extracted;
  }

  /**
   * Extract symptom character/quality
   */
  private static extractSymptomCharacter(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();
    const characterTerms = [
      "sharp",
      "dull",
      "throbbing",
      "pounding",
      "stabbing",
      "burning",
      "aching",
      "cramping",
      "pressure",
      "tightness",
      "tingling",
      "numbness",
    ];

    return characterTerms.find((term) => lowerMessage.includes(term));
  }

  /**
   * Extract multiple locations
   */
  private static extractLocations(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const locations: string[] = [];

    const locationTerms = [
      "head",
      "forehead",
      "temple",
      "sinus",
      "chest",
      "stomach",
      "abdomen",
      "back",
      "neck",
      "shoulder",
      "arm",
      "leg",
      "joint",
      "throat",
      "ear",
      "eye",
      "nose",
      "mouth",
      "lung",
      "heart",
      "kidney",
      "liver",
    ];

    locationTerms.forEach((term) => {
      if (lowerMessage.includes(term)) {
        locations.push(term);
      }
    });

    return locations;
  }

  /**
   * Update context with new medical analysis - FIXED: Don't overwrite with wrong data
   */
  private static async updateContextWithAnalysis(
    context: ContextState,
    medicalAnalysis: MedicalDetectionResult,
    message: string
  ): Promise<ContextState> {
    const extractedData = await this.extractStructuredData(
      message,
      medicalAnalysis
    );

    console.log("🔄 Updating context with:", {
      medicalSymptoms: medicalAnalysis.symptoms,
      extractedData: extractedData,
    });

    // Use the ACTUAL detected symptoms, don't let AI make up "nausea"
    const actualSymptoms =
      medicalAnalysis.symptoms.length > 0
        ? medicalAnalysis.symptoms
        : context.symptomType;

    const updatedGatheredData = this.mergeSymptomData(
      context.gatheredData,
      extractedData
    );

    await updateContextState(context.id, {
      symptomType: actualSymptoms,
      gatheredData: updatedGatheredData,
      medicalConfidence: medicalAnalysis.confidence,
    });

    return {
      ...context,
      symptomType: actualSymptoms,
      gatheredData: updatedGatheredData,
      medicalConfidence: medicalAnalysis.confidence,
    };
  }

  /**
   * Merge symptom data intelligently - FIXED: Prefer existing data over "not specified"
   */
  private static mergeSymptomData(
    existing: SymptomData,
    newData: Partial<SymptomData>
  ): SymptomData {
    const merged: SymptomData = {
      symptoms: [...existing.symptoms],
      locations: [...existing.locations],
      associatedSymptoms: [...existing.associatedSymptoms],
    };

    // Merge symptoms - avoid duplicates and prefer actual data over "not specified"
    if (newData.symptoms) {
      newData.symptoms.forEach((newSymptom) => {
        const existingIndex = merged.symptoms.findIndex(
          (s) => s.name === newSymptom.name
        );
        if (existingIndex === -1) {
          merged.symptoms.push(newSymptom);
        } else {
          // Only update if new data is not "not specified"
          const updatedSymptom = { ...merged.symptoms[existingIndex] };
          if (newSymptom.duration && newSymptom.duration !== "not specified") {
            updatedSymptom.duration = newSymptom.duration;
          }
          if (newSymptom.severity && newSymptom.severity !== "not specified") {
            updatedSymptom.severity = newSymptom.severity;
          }
          if (newSymptom.location && newSymptom.location !== "not specified") {
            updatedSymptom.location = newSymptom.location;
          }
          if (
            newSymptom.character &&
            newSymptom.character !== "not specified"
          ) {
            updatedSymptom.character = newSymptom.character;
          }
          merged.symptoms[existingIndex] = updatedSymptom;
        }
      });
    }

    // Merge other fields - prefer actual data over "not specified"
    const fieldsToMerge: (keyof SymptomData)[] = [
      "duration",
      "severity",
      "character",
    ];

    fieldsToMerge.forEach((field) => {
      const newValue = (newData as any)[field];
      const existingValue = (merged as any)[field];

      if (newValue && newValue !== "not specified") {
        (merged as any)[field] = newValue;
      } else if (!existingValue || existingValue === "not specified") {
        (merged as any)[field] = newValue || "not specified";
      }
      // Otherwise keep existing value
    });

    // Merge locations
    if (newData.locations && newData.locations.length > 0) {
      newData.locations.forEach((location) => {
        if (
          !merged.locations.includes(location) &&
          location !== "not specified"
        ) {
          merged.locations.push(location);
        }
      });
    }

    return merged;
  }

  /**
   * Build comprehensive medical query - IMPROVED location formatting
   */
  private static buildComprehensiveQuery(context: ContextState): string {
    const { gatheredData, symptomType } = context;

    let query = `I have ${symptomType.join(" and ")}`;

    // Only include fields that have actual data
    if (gatheredData.duration && gatheredData.duration !== "not specified")
      query += ` for ${gatheredData.duration}`;

    if (gatheredData.severity && gatheredData.severity !== "not specified")
      query += `, severity ${gatheredData.severity}`;

    const validLocations = gatheredData.locations.filter(
      (loc) => loc !== "not specified" && loc.length > 0
    );

    if (validLocations.length > 0) {
      // Format locations more naturally
      if (validLocations.length === 1) {
        query += `, located in ${validLocations[0]}`;
      } else {
        query += `, located in ${validLocations.slice(0, -1).join(", ")} and ${
          validLocations[validLocations.length - 1]
        }`;
      }
    }

    if (gatheredData.character && gatheredData.character !== "not specified")
      query += `, described as ${gatheredData.character}`;

    if (gatheredData.timing && gatheredData.timing !== "not specified")
      query += `, timing: ${gatheredData.timing}`;

    console.log("📝 Final query:", query);
    return query;
  }

  /**
   * Enhanced completeness analysis - FIXED: Proper field checking
   */
  private static async analyzeCompleteness(
    gatheredData: SymptomData,
    context: ContextState
  ): Promise<{
    isComplete: boolean;
    missingFields: string[];
    priorityFields: string[];
    completenessScore: number;
  }> {
    // Determine missing fields based on current data
    const missingFields: string[] = [];

    // Required fields for good medical context
    const requiredFields = [
      "duration",
      "severity",
      "location",
      "character",
      "timing",
    ];

    requiredFields.forEach((field) => {
      const hasField = this.hasField(gatheredData, field);
      if (!hasField) {
        missingFields.push(field);
      }
    });

    // Priority: duration and severity are most important
    const priorityFields = [...missingFields].sort((a, b) => {
      const priorityOrder = [
        "duration",
        "severity",
        "location",
        "character",
        "timing",
      ];
      return priorityOrder.indexOf(a) - priorityOrder.indexOf(b);
    });

    const completenessScore = Math.max(0, 100 - missingFields.length * 20);

    const isComplete = missingFields.length === 0;

    console.log("📊 Completeness analysis:", {
      gatheredData,
      missingFields,
      priorityFields,
      completenessScore,
      isComplete,
    });

    return {
      isComplete,
      missingFields,
      priorityFields,
      completenessScore,
    };
  }

  /**
   * Check if a specific field has valid data
   */
  private static hasField(gatheredData: SymptomData, field: string): boolean {
    switch (field) {
      case "duration":
        return Boolean(
          gatheredData.duration &&
            gatheredData.duration.length > 0 &&
            gatheredData.duration !== "unknown" &&
            gatheredData.duration !== "not specified"
        );
      case "severity":
        return Boolean(
          gatheredData.severity &&
            gatheredData.severity.length > 0 &&
            gatheredData.severity !== "unknown" &&
            gatheredData.severity !== "not specified"
        );
      case "location":
        return Boolean(
          gatheredData.locations &&
            gatheredData.locations.length > 0 &&
            !gatheredData.locations.every(
              (loc) => loc === "unknown" || loc === "not specified"
            )
        );
      case "character":
        return Boolean(
          gatheredData.character &&
            gatheredData.character.length > 0 &&
            gatheredData.character !== "unknown" &&
            gatheredData.character !== "not specified"
        );
      case "timing": // NEW: Check timing field
        return Boolean(
          gatheredData.timing &&
            gatheredData.timing.length > 0 &&
            gatheredData.timing !== "unknown" &&
            gatheredData.timing !== "not specified"
        );
      default:
        return false;
    }
  }
}
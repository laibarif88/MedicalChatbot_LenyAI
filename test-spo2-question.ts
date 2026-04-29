/**
 * Test script to debug the SpO2 bronchiolitis question truncation issue
 * We'll test each component of the system to identify where truncation occurs
 */

import { buildAdaptivePrompt, getPromptStats } from './functions/src/prompts/promptManager';

const testQuestion = "What is the target SpO2 range in bronchiolitis?";

console.log("=== TESTING QUESTION ===");
console.log(`Question: "${testQuestion}"`);
console.log(`Length: ${testQuestion.length} characters`);
console.log("");

// Test 1: Check how the prompt manager categorizes this question
console.log("=== PROMPT MANAGER TEST ===");

// Test as patient
const patientPrompt = buildAdaptivePrompt(testQuestion, 'patient', false);
const patientStats = getPromptStats(patientPrompt);

console.log("PATIENT MODE:");
console.log("- Prompt tier:", patientStats.tier);
console.log("- Estimated tokens:", patientStats.tokens);
console.log("- Sections:", patientStats.sections);

// Check if it contains the "quick" context
const hasQuickContext = patientPrompt.includes("QUICK QUESTIONS");
const hasMedicalDetection = /spo2|oxygen|saturation|bronchiolitis/i.test(testQuestion);

console.log("- Categorized as 'quick'?", hasQuickContext);
console.log("- Medical terms detected?", hasMedicalDetection);

// Check for any word limits in the prompt
const wordLimitMatches = patientPrompt.match(/\d+\s*words?/gi);
console.log("- Word limits found in prompt:", wordLimitMatches || "None");

// Check for "keep brief" instructions
const hasBriefInstruction = /keep brief|brief explanation|concise/i.test(patientPrompt);
console.log("- Has 'keep brief' instruction?", hasBriefInstruction);

console.log("");

// Test as provider
const providerPrompt = buildAdaptivePrompt(testQuestion, 'provider', false);
const providerStats = getPromptStats(providerPrompt);

console.log("PROVIDER MODE:");
console.log("- Prompt tier:", providerStats.tier);
console.log("- Estimated tokens:", providerStats.tokens);
console.log("- Sections:", providerStats.sections);

console.log("");

// Test 2: Check what context is detected
console.log("=== CONTEXT DETECTION TEST ===");

// Simulate the detectPrimaryContext function
function detectPrimaryContext(message: string, userType: 'patient' | 'provider'): string {
  const lower = message.toLowerCase();

  // Emergency check
  if (/emergency|urgent|severe|chest pain|difficulty breathing|stroke|heart attack|911/.test(lower)) {
    return 'emergency';
  }

  // Documentation check
  if ((/write|create|draft|help me with|prepare|compose|need a|make a|generate/.test(lower) &&
      /note|letter|document|appeal|denial|insurance|authorization|disability|fmla|accommodation/.test(lower)) ||
      /denial appeal|prior auth|sick note|work note|doctor.s note|medical letter/.test(lower)) {
    return 'documentation';
  }

  // Medication check
  if (/medication|drug|dose|pill|tablet|prescription|side effect|tylenol|acetaminophen|ibuprofen/.test(lower)) {
    return 'medication';
  }

  // Mental health check
  if (/anxiety|depression|stress|mental|emotional|panic|suicid/.test(lower)) {
    return 'mental';
  }

  // Chronic conditions check
  if (/diabetes|hypertension|arthritis|copd|asthma|heart disease|kidney|liver/.test(lower)) {
    return 'chronic';
  }

  // Symptoms check
  if (/pain|ache|fever|cough|nausea|vomit|dizzy|fatigue|swelling/.test(lower)) {
    return 'symptoms';
  }

  // Provider-specific checks
  if (userType === 'provider') {
    if (/differential|diagnos/.test(lower)) return 'differential';
    if (/procedure|technique|insert|remove/.test(lower)) return 'procedure';
    if (/lab|test|result|imaging|xray|ct|mri/.test(lower)) return 'labs';
  }

  // Quick questions check (with medical term detection)
  const isMedicalTopic = /spo2|oxygen|saturation|bronchiolitis|disease|condition|treatment|diagnosis|symptom|medical|clinical|guideline|protocol/i.test(lower);
  
  if (!isMedicalTopic && (message.length < 50 || /what is|how much|can i|should i|is it safe/.test(lower))) {
    return 'quick';
  }

  // Default
  return userType === 'patient' ? 'quick' : 'differential';
}

const detectedContext = detectPrimaryContext(testQuestion, 'patient');
console.log(`Detected context for patient: ${detectedContext}`);
console.log(`Should NOT be 'quick' for medical question: ${detectedContext !== 'quick' ? 'PASS ✓' : 'FAIL ✗'}`);

console.log("");

// Test 3: Check token limits in backend
console.log("=== BACKEND TOKEN LIMITS TEST ===");

const messageLength = testQuestion.length;
const isSimpleQuery = messageLength < 40 && !/emergency|urgent|severe|chest|pain|blood|breathing/i.test(testQuestion.toLowerCase());
const isMedicationQuery = /tylenol|acetaminophen|ibuprofen|aspirin|advil|motrin|medication|drug|dose|dosage|pill/i.test(testQuestion.toLowerCase());

console.log(`Message length: ${messageLength}`);
console.log(`Would be considered 'simple query': ${isSimpleQuery}`);
console.log(`Is medication query: ${isMedicationQuery}`);

// Simulate token calculation from backend
const maxTokens = isSimpleQuery ? 5000 : 6000;
console.log(`Max tokens that would be used: ${maxTokens}`);

// Estimate how many words this allows (roughly 0.75 words per token)
const estimatedMaxWords = Math.floor(maxTokens * 0.75);
console.log(`Estimated max words allowed: ${estimatedMaxWords}`);

console.log("");

// Test 4: Check for any hardcoded limits
console.log("=== CHECKING FOR HARDCODED LIMITS ===");

// Check the quick context content
const quickContextContent = `
## QUICK QUESTIONS:
- Direct answer first
- Brief explanation if helpful
- Any important warnings
- For non-medical topics only, keep brief`;

console.log("Quick context instructions:");
console.log(quickContextContent);
console.log("");
console.log("Issue found: 'For non-medical topics only, keep brief'");
console.log("This might still be causing truncation even though medical terms are detected!");

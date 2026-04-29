// Full trace of SpO2 question through the entire system

const testQuestion = "What is the target SpO2 range in bronchiolitis?";

// Step 1: Context Detection
function detectPrimaryContext(message, userType = 'patient') {
  const lower = message.toLowerCase();

  if (/emergency|urgent|severe|chest pain|difficulty breathing|stroke|heart attack|911/.test(lower)) {
    return 'emergency';
  }

  if ((/write|create|draft|help me with|prepare|compose|need a|make a|generate/.test(lower) &&
      /note|letter|document|appeal|denial|insurance|authorization|disability|fmla|accommodation/.test(lower)) ||
      /denial appeal|prior auth|sick note|work note|doctor.s note|medical letter/.test(lower)) {
    return 'documentation';
  }

  if (/medication|drug|dose|pill|tablet|prescription|side effect|tylenol|acetaminophen|ibuprofen/.test(lower)) {
    return 'medication';
  }

  if (/anxiety|depression|stress|mental|emotional|panic|suicid/.test(lower)) {
    return 'mental';
  }

  if (/diabetes|hypertension|arthritis|copd|asthma|heart disease|kidney|liver/.test(lower)) {
    return 'chronic';
  }

  // WITH FIX: SpO2 and bronchiolitis should match here
  if (/pain|ache|fever|cough|nausea|vomit|dizzy|fatigue|swelling|spo2|oxygen|saturation|bronchiolitis|respiratory|breathing|wheez|vital|range|level|measurement/.test(lower)) {
    return 'symptoms';
  }

  if (userType === 'provider') {
    if (/differential|diagnos/.test(lower)) return 'differential';
    if (/procedure|technique|insert|remove/.test(lower)) return 'procedure';
    if (/lab|test|result|imaging|xray|ct|mri/.test(lower)) return 'labs';
  }

  const isMedicalTopic = /spo2|oxygen|saturation|bronchiolitis|disease|condition|treatment|diagnosis|symptom|medical|clinical|guideline|protocol/i.test(lower);
  
  if (!isMedicalTopic && (message.length < 50 || /what is|how much|can i|should i|is it safe/.test(lower))) {
    return 'quick';
  }

  return userType === 'patient' ? 'quick' : 'differential';
}

// Step 2: Prompt Tier Selection
function getPromptTier(message, context) {
  // Full tier for complex/critical contexts
  if (context === 'emergency' || context === 'differential' || context === 'documentation' || context === 'chronic') {
    return 'full';
  }
  
  // For symptoms, medication, mental health - always use standard or full
  if (context === 'symptoms' || context === 'medication' || context === 'mental') {
    return 'standard';
  }
  
  // CRITICAL FIX: Never use minimal tier based on length alone
  if (context === 'quick') {
    const lower = message.toLowerCase();
    
    const nonMedicalPatterns = /^(hello|hi|thanks|thank you|yes|no|okay|bye|goodbye|what time|weather|calculate|math|\d+\s*[\+\-\*\/]\s*\d+)$/i;
    
    if (nonMedicalPatterns.test(lower.trim())) {
      return 'minimal';
    }
    
    const hasMedicalContent = /health|medical|doctor|nurse|hospital|clinic|patient|symptom|disease|condition|treatment|medication|drug|pain|sick|ill|injury|diagnosis|test|lab|exam|therapy|surgery|procedure|care|wellness|vitamin|supplement|dose|side effect|allergic|infection|virus|bacteria|cancer|diabetes|heart|lung|kidney|liver|brain|blood|pressure|temperature|fever|cough|headache|nausea|fatigue|breathing|oxygen|spo2|pulse|vital|range|normal|abnormal|chronic|acute/i.test(lower);
    
    if (hasMedicalContent) {
      return 'standard';
    }
    
    return 'standard';
  }
  
  return 'standard';
}

// Step 3: Backend token limits (FIXED to match actual backend)
function getBackendTokens(message) {
  const lower = message.toLowerCase();
    // This matches EXACTLY what the backend checks (with the FIX)
    const isNonMedical = /^what is \d+[\+\-\*\/]\d+|^calculate|^math|^weather$|^hello$|^hi$|^yes$|^no$|^thanks?$|^thank you$/i.test(lower.trim());
  const isMedicationQuery = /tylenol|acetaminophen|ibuprofen|aspirin|advil|motrin|medication|drug|dose|dosage|pill/i.test(lower);
  const isSimpleQuery = message.length < 40 && !/(emergency|urgent|severe|chest|pain|blood|breathing)/i.test(lower) && !isMedicationQuery;
  
  console.log(`  → isNonMedical: ${isNonMedical}`);
  console.log(`  → isMedicationQuery: ${isMedicationQuery}`);
  console.log(`  → isSimpleQuery: ${isSimpleQuery} (length < 40: ${message.length < 40})`);
  
  const maxTokens = isNonMedical ? 100 :
                    isSimpleQuery ? 5000 :
                    6000;
                    
  return maxTokens;
}

console.log("=== FULL TRACE: SpO2 QUESTION ===\n");
console.log(`Question: "${testQuestion}"`);
console.log(`Length: ${testQuestion.length} characters`);
console.log("\n--- STEP 1: CONTEXT DETECTION ---");

const context = detectPrimaryContext(testQuestion);
console.log(`Primary Context: "${context}"`);

const lower = testQuestion.toLowerCase();
console.log("\nPattern Matches:");
console.log(`  ✓ Contains "spo2": ${/spo2/.test(lower)}`);
console.log(`  ✓ Contains "bronchiolitis": ${/bronchiolitis/.test(lower)}`);
console.log(`  ✓ Contains "range": ${/range/.test(lower)}`);
console.log(`  → Matches symptoms pattern: ${/pain|ache|fever|cough|nausea|vomit|dizzy|fatigue|swelling|spo2|oxygen|saturation|bronchiolitis|respiratory|breathing|wheez|vital|range|level|measurement/.test(lower)}`);

console.log("\n--- STEP 2: PROMPT TIER ---");
const tier = getPromptTier(testQuestion, context);
console.log(`Selected Tier: "${tier}"`);
console.log(`Will get full response: ${tier !== 'minimal' ? '✅ YES' : '❌ NO'}`);

console.log("\n--- STEP 3: BACKEND TOKEN LIMITS ---");
const maxTokens = getBackendTokens(testQuestion);
console.log(`Max Tokens: ${maxTokens}`);
console.log(`Estimated max words: ~${Math.floor(maxTokens * 0.75)}`);

console.log("\n--- STEP 4: PROMPT INSTRUCTIONS ---");
if (context === 'symptoms') {
  console.log("✅ Will receive SYMPTOMS context instructions:");
  console.log("  • Structure with clear visual breaks");
  console.log("  • Possible causes section");
  console.log("  • Self-care options");
  console.log("  • Red flags/warning signs");
  console.log("  • When to book appointment");
} else if (context === 'quick') {
  console.log("⚠️ Might receive QUICK context instructions:");
  console.log("  • Direct answer first");
  console.log("  • Brief explanation");
  console.log("  • For non-medical topics only, keep brief");
}

console.log("\n=== ANALYSIS ===");
if (context === 'symptoms' && tier === 'standard') {
  console.log("✅ SHOULD WORK: Question categorized as symptoms, gets standard tier");
  console.log("If still truncated, the issue is NOT in prompt management");
  console.log("\nPOSSIBLE REMAINING ISSUES:");
  console.log("1. AI model is ignoring the instructions");
  console.log("2. Response streaming is cutting off early");
  console.log("3. Frontend is truncating the display");
  console.log("4. The 'quick' context instruction is still being included somehow");
} else {
  console.log(`❌ PROBLEM: Context="${context}", Tier="${tier}"`);
  console.log("The categorization or tier selection is wrong!");
}

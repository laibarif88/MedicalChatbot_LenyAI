// Test what the SpO2 question is recognized as after the fix

const testQuestion = "What is the target SpO2 range in bronchiolitis?";

function detectPrimaryContext(message, userType = 'patient') {
  const lower = message.toLowerCase();

  // Priority 1: Emergency
  if (/emergency|urgent|severe|chest pain|difficulty breathing|stroke|heart attack|911/.test(lower)) {
    return 'emergency';
  }

  // Priority 2: Documentation
  if ((/write|create|draft|help me with|prepare|compose|need a|make a|generate/.test(lower) &&
      /note|letter|document|appeal|denial|insurance|authorization|disability|fmla|accommodation/.test(lower)) ||
      /denial appeal|prior auth|sick note|work note|doctor.s note|medical letter/.test(lower)) {
    return 'documentation';
  }

  // Priority 3: Medication
  if (/medication|drug|dose|pill|tablet|prescription|side effect|tylenol|acetaminophen|ibuprofen/.test(lower)) {
    return 'medication';
  }

  // Priority 4: Mental health
  if (/anxiety|depression|stress|mental|emotional|panic|suicid/.test(lower)) {
    return 'mental';
  }

  // Priority 5: Chronic conditions
  if (/diabetes|hypertension|arthritis|copd|asthma|heart disease|kidney|liver/.test(lower)) {
    return 'chronic';
  }

  // Priority 6: Symptoms and medical parameters (UPDATED WITH FIX)
  if (/pain|ache|fever|cough|nausea|vomit|dizzy|fatigue|swelling|spo2|oxygen|saturation|bronchiolitis|respiratory|breathing|wheez|vital|range|level|measurement/.test(lower)) {
    return 'symptoms';
  }

  // Priority 7: Quick questions
  const isMedicalTopic = /spo2|oxygen|saturation|bronchiolitis|disease|condition|treatment|diagnosis|symptom|medical|clinical|guideline|protocol/i.test(lower);
  if (!isMedicalTopic && (message.length < 50 || /what is|how much|can i|should i|is it safe/.test(lower))) {
    return 'quick';
  }

  return 'quick';
}

console.log("=== SpO2 Question Recognition Analysis ===");
console.log("");
console.log(`Question: "${testQuestion}"`);
console.log("");

// Check what it matches
const lower = testQuestion.toLowerCase();
console.log("Pattern Matching Results:");
console.log("-------------------------");
console.log(`✓ Matches 'spo2': ${/spo2/.test(lower)}`);
console.log(`✓ Matches 'oxygen': ${/oxygen/.test(lower)}`);
console.log(`✓ Matches 'saturation': ${/saturation/.test(lower)}`);
console.log(`✓ Matches 'bronchiolitis': ${/bronchiolitis/.test(lower)}`);
console.log(`✓ Matches 'range': ${/range/.test(lower)}`);
console.log("");

// Show the categorization
const context = detectPrimaryContext(testQuestion);
console.log(`RECOGNITION RESULT: "${context}"`);
console.log("");

if (context === 'symptoms') {
  console.log("✅ SUCCESS: SpO2 question is now recognized as 'symptoms' context");
  console.log("This means it will get:");
  console.log("  • Full comprehensive response");
  console.log("  • Detailed explanations");
  console.log("  • Proper medical formatting");
  console.log("  • No truncation");
} else {
  console.log(`❌ PROBLEM: Still being recognized as '${context}'`);
  console.log("This needs further investigation");
}

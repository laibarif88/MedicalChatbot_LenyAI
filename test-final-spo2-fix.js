// Test to verify SpO2 question categorization after all fixes

function testQuestionCategorization(message) {
  const lower = message.toLowerCase();
  
  // Fixed regex - only matches math problems, not medical "what is" questions
  const isNonMedical = /^what is \d+[\+\-\*\/]\d+|^calculate|^math|^weather$|^hello$|^hi$|^yes$|^no$|^thanks?$|^thank you$/i.test(lower.trim());
  
  const isMedicationQuery = /tylenol|acetaminophen|ibuprofen|aspirin|advil|motrin|medication|drug|dose|dosage|pill/i.test(lower);
  
  // Comprehensive medical term detection
  const hasMedicalTerms = /(emergency|urgent|severe|chest|pain|blood|breathing|spo2|oxygen|saturation|bronchiolitis|respiratory|wheez|vital|range|level|measurement|symptom|diagnosis|treatment|therapy|disease|condition|infection|fever|cough|asthma|pneumonia|copd|heart|cardiac|pulse|pressure|diabetes|glucose|insulin|cancer|tumor|surgery|procedure|test|lab|result|normal|abnormal)/i.test(lower);
  
  const isSimpleQuery = message.length < 40 && !hasMedicalTerms && !isMedicationQuery;
  
  // Determine max tokens
  const maxTokens = isNonMedical ? 100 :
                   isSimpleQuery ? 5000 :
                   6000;
  
  return {
    message,
    length: message.length,
    isNonMedical,
    isMedicationQuery,
    hasMedicalTerms,
    isSimpleQuery,
    maxTokens
  };
}

// Test cases
const testCases = [
  // Short SpO2 questions that were problematic
  "target SpO2 range in bronchiolitis?",
  "What is the target SpO2 range in bronchiolitis?",
  
  // Other medical questions
  "What is diabetes?",
  "What is insulin resistance?",
  "fever treatment",
  "oxygen levels",
  
  // Non-medical questions that should be limited
  "What is 5+5?",
  "hello",
  "thank you",
  "weather",
  
  // Edge cases
  "What is normal blood pressure?",
  "What is a heart attack?",
  "SpO2?",
  "oxygen?"
];

console.log("Testing Question Categorization After Fix:\n");
console.log("=" * 80);

testCases.forEach(question => {
  const result = testQuestionCategorization(question);
  console.log(`\nQuestion: "${result.message}"`);
  console.log(`Length: ${result.length} chars`);
  console.log(`Has Medical Terms: ${result.hasMedicalTerms}`);
  console.log(`Is Simple Query: ${result.isSimpleQuery}`);
  console.log(`Is Non-Medical: ${result.isNonMedical}`);
  console.log(`Max Tokens: ${result.maxTokens}`);
  
  // Highlight issues
  if (result.hasMedicalTerms && result.maxTokens < 6000) {
    console.log("⚠️  WARNING: Medical question not getting full tokens!");
  }
  if (result.message.toLowerCase().includes("spo2") && result.maxTokens < 6000) {
    console.log("🔴 ERROR: SpO2 question still limited!");
  }
});

console.log("\n" + "=" * 80);
console.log("\nSummary:");
console.log("- Medical questions with < 40 chars should now get 6000 tokens");
console.log("- SpO2/bronchiolitis questions should be detected as medical");
console.log("- Non-medical questions should still be limited to 100 tokens");

// Test the universal fix for ALL medical questions

// The new improved getPromptTier function with universal fix
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
  // Only use minimal for explicitly non-medical quick questions
  if (context === 'quick') {
    const lower = message.toLowerCase();
    
    // List of clearly non-medical patterns
    const nonMedicalPatterns = /^(hello|hi|thanks|thank you|yes|no|okay|bye|goodbye|what time|weather|calculate|math|\d+\s*[\+\-\*\/]\s*\d+)$/i;
    
    if (nonMedicalPatterns.test(lower.trim())) {
      return 'minimal';
    }
    
    // If it contains ANY medical-related terms, upgrade to standard
    const hasMedicalContent = /health|medical|doctor|nurse|hospital|clinic|patient|symptom|disease|condition|treatment|medication|drug|pain|sick|ill|injury|diagnosis|test|lab|exam|therapy|surgery|procedure|care|wellness|vitamin|supplement|dose|side effect|allergic|infection|virus|bacteria|cancer|diabetes|heart|lung|kidney|liver|brain|blood|pressure|temperature|fever|cough|headache|nausea|fatigue|breathing|oxygen|spo2|pulse|vital|range|normal|abnormal|chronic|acute/i.test(lower);
    
    if (hasMedicalContent) {
      return 'standard';
    }
    
    // For any other "quick" question, use standard to be safe
    return 'standard';
  }
  
  // Default to standard tier for everything else
  return 'standard';
}

// Test various medical questions
const testQuestions = [
  // Original problem question
  "What is the target SpO2 range in bronchiolitis?",
  
  // Other short medical questions that should NOT be truncated
  "What is normal blood pressure?",
  "Is 101F a fever?",
  "How much Tylenol?",
  "What causes headaches?",
  "Chest pain help",
  "Diabetes symptoms?",
  "COVID test accuracy?",
  "Normal heart rate?",
  "BMI calculation?",
  "Vaccine schedule?",
  
  // Non-medical questions that CAN be minimal
  "hello",
  "thanks",
  "5+5",
  "weather",
  "goodbye",
  
  // Edge cases - short but medical
  "flu",
  "rash",
  "dizzy",
  "tired"
];

console.log("=== UNIVERSAL FIX TEST RESULTS ===\n");
console.log("Testing various questions to ensure NO medical truncation:\n");

testQuestions.forEach(question => {
  // For testing, assume "quick" context to test the fix
  const tier = getPromptTier(question, 'quick');
  const length = question.length;
  const isMedical = /health|medical|doctor|nurse|hospital|clinic|patient|symptom|disease|condition|treatment|medication|drug|pain|sick|ill|injury|diagnosis|test|lab|exam|therapy|surgery|procedure|care|wellness|vitamin|supplement|dose|side effect|allergic|infection|virus|bacteria|cancer|diabetes|heart|lung|kidney|liver|brain|blood|pressure|temperature|fever|cough|headache|nausea|fatigue|breathing|oxygen|spo2|pulse|vital|range|normal|abnormal|chronic|acute|tylenol|flu|rash|dizzy|tired|chest|covid|bmi|vaccine/i.test(question.toLowerCase());
  
  console.log(`Question: "${question}"`);
  console.log(`  Length: ${length} chars | Medical: ${isMedical ? 'YES' : 'NO'} | Tier: ${tier}`);
  console.log(`  Will truncate: ${tier === 'minimal' ? '❌ YES (BAD!)' : '✅ NO (GOOD!)'}`);
  console.log("");
});

console.log("\n=== SUMMARY ===");
console.log("✅ The universal fix ensures:");
console.log("1. ALL medical questions get 'standard' tier minimum");
console.log("2. Only truly non-medical greetings get 'minimal' tier");
console.log("3. When in doubt, default to 'standard' tier");
console.log("4. No more truncation based on length alone");
console.log("\nThis fixes the issue for ALL medical questions, not just SpO2!");

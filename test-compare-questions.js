// Compare how different medical questions are categorized

const questions = [
  "What is the target SpO2 range in bronchiolitis?",  // 47 chars
  "headache",                                          // 8 chars
  "pain",                                              // 4 chars
];

function detectPrimaryContext(message, userType = 'patient') {
  const lower = message.toLowerCase();

  // Check symptoms (including pain and headache)
  if (/pain|ache|fever|cough|nausea|vomit|dizzy|fatigue|swelling/.test(lower)) {
    return 'symptoms';
  }

  // Check medical topics
  const isMedicalTopic = /spo2|oxygen|saturation|bronchiolitis|disease|condition|treatment|diagnosis|symptom|medical|clinical|guideline|protocol/i.test(lower);
  
  if (!isMedicalTopic && (message.length < 50 || /what is|how much|can i|should i|is it safe/.test(lower))) {
    return 'quick';
  }

  return 'quick';  // default
}

console.log("Question Analysis:");
console.log("==================");

questions.forEach(q => {
  const context = detectPrimaryContext(q);
  console.log(`\nQuestion: "${q}"`);
  console.log(`Length: ${q.length} chars`);
  console.log(`Detected context: ${context}`);
  
  // Check what it matches
  const matchesSymptoms = /pain|ache|fever|cough|nausea|vomit|dizzy|fatigue|swelling/.test(q.toLowerCase());
  const matchesMedical = /spo2|oxygen|saturation|bronchiolitis|disease|condition|treatment|diagnosis|symptom|medical|clinical|guideline|protocol/i.test(q.toLowerCase());
  
  console.log(`Matches symptoms pattern: ${matchesSymptoms}`);
  console.log(`Matches medical pattern: ${matchesMedical}`);
  console.log(`Context gives full response: ${context === 'symptoms' ? 'YES' : 'NO'}`);
});

console.log("\n\nKEY FINDING:");
console.log("============");
console.log("'headache' and 'pain' match the SYMPTOMS context and get full responses");
console.log("'What is the target SpO2 range in bronchiolitis?' matches medical terms but:");
console.log("  1. It doesn't match the symptoms pattern");
console.log("  2. The symptoms context gets FULL treatment");
console.log("  3. Medical detection only prevents 'quick' categorization");
console.log("\nSOLUTION: We need to add SpO2/bronchiolitis questions to get symptoms context");

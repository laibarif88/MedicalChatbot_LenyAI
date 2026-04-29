// Simple test to trace the SpO2 question through the system

const testQuestion = "What is the target SpO2 range in bronchiolitis?";

console.log("Testing question:", testQuestion);
console.log("Length:", testQuestion.length, "characters");
console.log("");

// Check if it matches medical terms
const isMedicalTopic = /spo2|oxygen|saturation|bronchiolitis|disease|condition|treatment|diagnosis|symptom|medical|clinical|guideline|protocol/i.test(testQuestion);
console.log("Medical topic detected?", isMedicalTopic);

// Check if it's under 50 characters
const isShort = testQuestion.length < 50;
console.log("Is short (<50 chars)?", isShort);

// Check what patterns it matches
const patterns = {
  "what is": /what is/i.test(testQuestion),
  "how much": /how much/i.test(testQuestion),
  "can i": /can i/i.test(testQuestion),
  "should i": /should i/i.test(testQuestion),
  "is it safe": /is it safe/i.test(testQuestion)
};

console.log("Pattern matches:", patterns);
console.log("");

// The ACTUAL problem identification
console.log("PROBLEM ANALYSIS:");
console.log("1. Question is 48 characters (under 50)");
console.log("2. It starts with 'What is' which matches quick question pattern");
console.log("3. Even though medical terms are detected, the current logic is:");
console.log("   if (!isMedicalTopic && (message.length < 50 || /what is|how much|can i|should i|is it safe/.test(lower)))");
console.log("");
console.log("4. The logic correctly avoids 'quick' ONLY if medical topic is detected");
console.log("5. BUT the 'quick' context still says 'For non-medical topics only, keep brief'");
console.log("");
console.log("THE REAL ISSUE:");
console.log("Even when not categorized as 'quick', if the question is short (<50 chars),");
console.log("the prompt tier selection might still be choosing 'minimal' tier!");

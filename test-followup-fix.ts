/**
 * Test to verify follow-up questions are no longer forced
 */

// Import the updated prompt manager
import { buildAdaptivePrompt } from './functions/src/prompts/promptManager';

// Test cases
const testCases = [
  {
    message: "What is the normal SpO2 range?",
    userType: 'patient' as const,
    description: "Simple SpO2 question"
  },
  {
    message: "I have a headache",
    userType: 'patient' as const,
    description: "Symptom inquiry"
  },
  {
    message: "Can you help me write an insurance appeal?",
    userType: 'patient' as const,
    description: "Documentation request"
  }
];

console.log("Testing prompt generation WITHOUT forced follow-up questions:\n");
console.log("=".repeat(80));

testCases.forEach(test => {
  console.log(`\nTest: ${test.description}`);
  console.log(`Message: "${test.message}"`);
  console.log("-".repeat(40));
  
  const prompt = buildAdaptivePrompt(test.message, test.userType);
  
  // Check if the prompt contains the forced follow-up instruction
  const hasForcedFollowups = prompt.includes("ALWAYS end with follow-up questions");
  const hasFollowupFormat = prompt.includes("<follow_ups>");
  
  console.log(`✓ Forced follow-ups removed: ${!hasForcedFollowups}`);
  console.log(`✓ Follow-up format removed: ${!hasFollowupFormat}`);
  
  // Show the ending section
  const endingMatch = prompt.match(/## ENDING:(.*?)(?=##|$)/s);
  if (endingMatch) {
    console.log("\nEnding instruction:");
    console.log(endingMatch[1].trim());
  }
});

console.log("\n" + "=".repeat(80));
console.log("Test complete! The prompt should now only include supportive endings without forced follow-up questions.");

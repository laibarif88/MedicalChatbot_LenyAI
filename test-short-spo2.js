// Test the SHORT version of the SpO2 question

const shortQuestion = "target SpO2 range in bronchiolitis?";
const longQuestion = "What is the target SpO2 range in bronchiolitis?";

function getBackendTokens(message) {
  const lower = message.toLowerCase();
  // With the FIX applied
  const isNonMedical = /^what is \d+[\+\-\*\/]\d+|^calculate|^math|^weather$|^hello$|^hi$|^yes$|^no$|^thanks?$|^thank you$/i.test(lower.trim());
  const isMedicationQuery = /tylenol|acetaminophen|ibuprofen|aspirin|advil|motrin|medication|drug|dose|dosage|pill/i.test(lower);
  const isSimpleQuery = message.length < 40 && !/(emergency|urgent|severe|chest|pain|blood|breathing)/i.test(lower) && !isMedicationQuery;
  
  console.log(`Testing: "${message}"`);
  console.log(`  Length: ${message.length} chars`);
  console.log(`  isNonMedical: ${isNonMedical}`);
  console.log(`  isMedicationQuery: ${isMedicationQuery}`);
  console.log(`  isSimpleQuery: ${isSimpleQuery}`);
  
  const maxTokens = isNonMedical ? 100 :
                    isSimpleQuery ? 5000 :
                    6000;
                    
  console.log(`  → Max Tokens: ${maxTokens}`);
  console.log(`  → Estimated max words: ~${Math.floor(maxTokens * 0.75)}`);
  return maxTokens;
}

console.log("=== TESTING SHORT VS LONG VERSIONS ===\n");

console.log("SHORT VERSION:");
getBackendTokens(shortQuestion);

console.log("\nLONG VERSION:");
getBackendTokens(longQuestion);

console.log("\n=== PROBLEM IDENTIFIED ===");
console.log("The SHORT version (35 chars) is categorized as 'simple query'");
console.log("Even though it gets 5000 tokens, this may not be enough for a full medical response");
console.log("\nSOLUTION: We need to fix the isSimpleQuery check to exclude medical terms!");

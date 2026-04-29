# Word Limits Review - Leny AI Studio

## Overview
This document summarizes the word/token limits configured in the codebase for different types of AI responses.

## Token Limits for AI Responses

### By Query Type (functions/src/index.ts)

| Query Type | Max Tokens | Use Case | Example |
|------------|------------|----------|---------|
| **Non-Medical** | 50 tokens | Math problems, weather, greetings | "What is 2+2?", "Hello" |
| **Simple Medical** | 400 tokens | Short medical questions (<40 chars) without complex terms | "What is a fever?" |
| **Complex Medical** | 800 tokens | Detailed medical questions, symptoms, treatments | "I have chest pain and shortness of breath" |

### Dynamic Detection Logic
- **Non-medical**: Matches patterns like math calculations, weather, basic greetings
- **Simple queries**: Messages under 40 characters without medical terms
- **Complex queries**: Everything else, including symptoms, medications, procedures

## Input Limits

### Message Length (src/services/aiService.ts & functions/src/index.ts)
- **Maximum input length**: 2000 characters
- Applied at both frontend (aiService.ts) and backend (index.ts)
- Prevents excessively long queries from being processed

## Prompt System Token Budgets

### Prompt Tiers (functions/src/prompts/promptManager.ts)

| Tier | Token Budget | Context | When Used |
|------|--------------|---------|-----------|
| **Minimal** | ~800 tokens | Quick questions only | Explicitly non-medical quick questions |
| **Standard** | ~1500 tokens | Most queries | Symptoms, medications, mental health |
| **Full** | ~2000 tokens | Complex cases | Emergency, differential diagnosis, documentation, chronic conditions |

### Context-Specific Formatting
- **Emergency contexts**: Always use full tier
- **Documentation requests**: Always use full tier  
- **Chronic conditions**: Always use full tier
- **Symptoms/Medications**: Use standard tier
- **Quick questions**: Use minimal tier (only for non-medical)

## Conversation History Limits

### Dynamic History Inclusion (functions/src/index.ts)
| Query Type | History Messages Included |
|------------|--------------------------|
| Non-medical | 0 (no history) |
| Simple queries | 0 (no history) |
| Complex queries | Up to 6 messages |

## Token Estimation

### Character to Token Ratio (functions/src/prompts/promptManager.ts)
- Rough estimate: **4 characters = 1 token**
- Used for monitoring prompt sizes

## Key Observations

### Strengths
1. **Dynamic adaptation**: System intelligently adjusts limits based on query complexity
2. **Efficient token usage**: Non-medical queries get minimal tokens (50)
3. **Context-aware prompting**: Different prompt tiers for different needs
4. **Safety limits**: 2000 character input limit prevents abuse

### Critical Issues
1. **Flawed complexity detection logic**: 
   - **Using 40-character length as complexity indicator is fundamentally wrong**
   - Short questions can be complex: "What is CHF?" (12 chars) needs detailed explanation
   - Long questions can be simple: "Can you tell me what the weather is like today?" (48 chars)
   - **Complexity should be based on content, not length**

2. **Token limits might be conservative**: 
   - Complex medical queries limited to 800 tokens might truncate detailed responses
   - Consider increasing to 1000-1200 for comprehensive medical answers

3. **History management**:
   - 6 message history limit is reasonable but could be made configurable
   - Consider different limits for patients vs providers

### Examples of the Length-Complexity Problem
| Question | Length | Current Classification | Actual Complexity |
|----------|--------|----------------------|-------------------|
| "What is SpO2?" | 14 chars | Simple (400 tokens) | Complex - needs detailed medical explanation |
| "What causes MS?" | 16 chars | Simple (400 tokens) | Complex - multiple sclerosis requires thorough answer |
| "BP normal range?" | 17 chars | Simple (400 tokens) | Medical - needs age/context-specific ranges |
| "Tell me everything about my general health and wellness tips" | 61 chars | Complex (800 tokens) | Actually simple/general |

## Recommendations

1. **Replace length-based complexity detection with content-based analysis**:
   - Remove the 40-character threshold entirely
   - Instead, analyze for medical acronyms (CHF, MS, COPD, SpO2, BP, etc.)
   - Check for medical keywords that indicate complexity
   - Default to higher token limits for ANY medical content

2. **Improved complexity detection algorithm**:
   ```javascript
   // Better approach:
   const hasComplexMedicalConcepts = /\b(pathophysiology|differential|mechanism|etiology|prognosis|comorbid)/i.test(message);
   const hasMedicalAcronyms = /\b(CHF|COPD|MS|ALS|DVT|PE|MI|CVA|TIA|SpO2|BP|HR|RR)\b/i.test(message);
   const needsDetailedExplanation = hasComplexMedicalConcepts || hasMedicalAcronyms;
   
   // Allocate tokens based on content complexity, not length
   const maxTokens = needsDetailedExplanation ? 1200 : 
                    hasMedicalTerms ? 800 : 
                    isNonMedical ? 50 : 600;
   ```

3. **Monitor truncation issues**: Track if users complain about incomplete answers
4. **Make token limits configurable**: Use environment variables for easy adjustment
5. **Track actual token usage**: Add analytics to optimize limits based on real usage

## Code Locations

- **Token limits configuration**: `functions/src/index.ts` (lines 96-98, 266-268)
- **Input sanitization**: `functions/src/index.ts` (line 68), `src/services/aiService.ts`
- **Prompt tier logic**: `functions/src/prompts/promptManager.ts` (getPromptTier function)
- **History limits**: `functions/src/index.ts` (lines 91-93, 261-263)

## Summary

The system uses a sophisticated multi-tier approach to manage response lengths:
- **50-800 tokens** for actual AI responses
- **800-2000 tokens** for system prompts
- **2000 characters** maximum input
- Dynamic adaptation based on query complexity

This approach balances response quality with cost efficiency, though there's room for fine-tuning based on user feedback.

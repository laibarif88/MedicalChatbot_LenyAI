# Word Limits Implementation for Patient Responses

## Overview
Implemented dynamic word limits for patient responses to maintain quality while keeping conversations digestible and conversational.

## Changes Made

### 1. Prompt Manager Updates (`functions/src/prompts/promptManager.ts`)

#### Response Length Guidelines for Patients:
- **Simple questions**: 50-100 words (1-2 short paragraphs)
- **Standard medical questions**: 150-250 words (2-3 paragraphs)  
- **Complex conditions/medications**: Maximum 350 words (3-4 paragraphs)
- **Emergency situations**: Brief urgent guidance first (50 words), then explanation

#### Key Instructions Added:
- "Keep responses conversational and digestible. Quality over quantity."
- "Focus on the most important information first"
- Empathy acknowledgment limited to 1-2 sentences
- Support/guidance limited to 1-2 sentences

### 2. Firebase Functions Updates (`functions/src/index.ts`)

#### Dynamic Token Limits Based on User Type and Query Complexity:

**For Patients:**
- Non-medical queries: 50 tokens (~25 words - rejection message)
- Simple questions: 300 tokens (~150 words)
- Standard medical queries: 500 tokens (~250 words)
- Medication queries: 700 tokens (~300 words)
- Complex medical concepts: 800 tokens (~350 words)

**For Providers (unchanged):**
- Default: 600 tokens
- Standard medical: 800 tokens
- Medication queries: 1000 tokens (detailed dosing info)
- Complex medical: 1200 tokens (comprehensive analysis)

### 3. Content-Based Complexity Detection

The system analyzes message content (not length) to determine appropriate response length:

**Complex Medical (needs detailed explanation):**
- Medical acronyms (CHF, COPD, SpO2, etc.)
- Complex concepts (pathophysiology, differential, pharmacokinetics, etc.)

**Medication Queries:**
- Drug names (tylenol, ibuprofen, etc.)
- Dosing terms (mg, dose, prescription, etc.)

**Standard Medical:**
- General medical terms (symptom, treatment, diagnosis, etc.)
- Body systems and conditions

**Simple/Non-Medical:**
- Greetings, thanks
- Non-medical questions

## Benefits

1. **Improved Readability**: Shorter responses are easier to read and understand
2. **Better Engagement**: Conversational tone maintains user interest
3. **Focused Information**: Forces prioritization of most important medical information
4. **Reduced Cognitive Load**: Patients aren't overwhelmed with excessive detail
5. **Consistent Quality**: Maintains medical accuracy within concise format

## Testing Recommendations

Test with various query types to ensure appropriate response lengths:

1. **Simple greeting**: "Hi, how are you?"
   - Expected: ~50 words polite redirection to health topics

2. **Basic symptom**: "I have a headache"
   - Expected: ~150-250 words covering causes, self-care, when to seek help

3. **Medication query**: "How do I take Tylenol safely?"
   - Expected: ~250-300 words with dosing, safety, interactions

4. **Complex condition**: "Explain diabetes management"
   - Expected: ~300-350 words covering key aspects comprehensively

5. **Emergency**: "Chest pain and can't breathe"
   - Expected: Immediate urgent care instruction (~50 words), then brief context

## Implementation Notes

- Token limits are approximate (1 token ≈ 0.75 words)
- System prioritizes safety - emergency responses bypass normal limits
- Provider responses maintain full detail for clinical decision support
- Streaming endpoints use same limits as non-streaming for consistency

## Future Enhancements

Consider adding:
- User preference settings for response length
- Dynamic adjustment based on user feedback
- A/B testing different length configurations
- Analytics on user engagement with different response lengths

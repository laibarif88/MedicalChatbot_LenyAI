# Implementation Plan for AI Assistant Improvements

## Task Overview
1. Review provider prompts for professional tone with evidence/data
2. Implement preference-based tone matching
3. Fix auto-scroll feature for long messages
4. Update provider pro mode UI layout

## Task 1: Enhanced Provider Prompts
### Current State
- Provider prompts are fairly professional but lack specific evidence-based references
- Missing statistical data and guideline citations
- Could be more concise while maintaining detail

### Improvements Needed
- Add more evidence-based language
- Include specific guideline references (ACC/AHA, USPSTF, etc.)
- Add NNT/NNH data where applicable
- Include confidence intervals and statistical significance
- Make responses more data-driven

## Task 2: Preference-Based Tone Matching
### Current State
- Preferences collected: `communicationStyle` (supportive/professional/conversational/direct)
- Preferences collected: `infoPreference` (data-driven/detailed/summaries/visual)
- These preferences are stored but NOT used in prompt generation

### Implementation Plan
1. Pass user preferences from Firestore to AI service
2. Modify `buildAdaptivePrompt` to accept preferences
3. Create tone modifiers based on communication style
4. Adjust response length based on info preference
5. Add preference-specific instructions to prompts

## Task 3: Auto-Scroll Feature Enhancement
### Current State
- Auto-scroll exists but continues scrolling even for very long messages
- Missing the "stop and show arrow" feature for long responses

### Requirements
- When message is long, push user message to top
- Stream the answer
- Stop auto-scrolling when content exceeds viewport
- Show downward arrow to indicate more content

## Task 4: Provider Pro Mode UI Update
### Current Layout
- Column 1: Sidebar
- Column 2: Chat
- Column 3: Notes/Proactive Analysis

### New Requirements
- Column 2: Instructions/guidance chat (less verbose)
- Column 3: Actual work/implementation space
- Keep responses in column 2 concise and action-oriented

## Implementation Steps

### Step 1: Enhanced Provider Prompts
- Update PROVIDER_BASE prompt with evidence requirements
- Add statistical guidance to each context
- Include citation format requirements

### Step 2: Preference Integration
- Modify aiService to fetch and pass preferences
- Update prompt builder to use preferences
- Create tone mapping system

### Step 3: Auto-Scroll Fix
- Implement content height detection
- Add scroll threshold logic
- Create arrow indicator component
- Stop auto-scroll when threshold exceeded

### Step 4: Pro Mode UI
- Create new "Instructions" view for column 2
- Modify chat behavior in pro mode
- Add concise response mode for instructions
- Keep work area in column 3

## Files to Modify
1. `functions/src/prompts/promptManager.ts` - Enhanced prompts & preference integration
2. `src/services/aiService.ts` - Pass preferences to API
3. `functions/src/index.ts` - Accept preferences in API
4. `src/components/chat/ChatView.tsx` - Fix auto-scroll
5. `src/screens/ChatScreen.tsx` - Update pro mode layout
6. `src/components/workspace/InstructionsView.tsx` - New component for instructions

# DeepSeek AI Integration - System Documentation

## Overview
This system is **entirely powered by DeepSeek AI**, not Gemini. There are only leftover mock references to Gemini that need removal.

---

## 🚀 DeepSeek Integration Details

### API Configuration
- **Endpoint**: `https://api.deepseek.com/chat/completions`
- **Model**: `deepseek-chat`
- **API Key**: Stored as `DEEPSEEK_API_KEY` environment variable
- **Location**: `functions/src/index.ts`

### Dynamic Parameters
The system uses intelligent parameter adjustment based on query type:

```javascript
// Token allocation
- Non-medical queries: 100 tokens (rejection response)
- Simple medical queries: 1500 tokens (rich answers)
- Complex medical queries: 3000 tokens (detailed responses)

// Temperature settings
- Non-medical: 0 (deterministic)
- Simple queries: 0.1 (low creativity)
- Complex queries: 0.3 (balanced)
```

---

## 📝 Prompt System Architecture

### Location
`functions/src/prompts/promptManager.ts`

### Adaptive Prompt Building
The system uses **context-aware prompt construction** that detects:
- Emergency situations
- Chronic conditions
- Symptoms inquiries
- Medication questions
- Mental health topics
- Documentation requests
- Pediatric cases

### Base Prompts Evolution

The prompts have evolved significantly over time:

#### Current Patient Base (Latest)
```
You are Leny, a compassionate medical AI assistant helping patients understand their health concerns.

IMPORTANT: Your primary focus is medical and health-related questions.
You CAN and SHOULD help with:
- Understanding medical conditions and treatments
- Writing insurance denial appeals and authorization letters
- Creating documentation for medical needs (FMLA, disability, work accommodations)
- Preparing questions for doctor visits
- Understanding medical bills and insurance coverage
- Summarizing our conversation
- Clarifying previous responses
- Explaining medical information differently
- Answering follow-up questions about topics we've discussed

For truly non-medical topics (weather, math, general knowledge), politely respond: 
"I can only help with health-related questions."
```

#### Current Provider Base (Latest)
```
You are Leny, an expert medical AI assistant providing evidence-based clinical decision support for healthcare providers.

IMPORTANT: Your primary focus is medical and clinical questions.
You CAN and SHOULD help with:
- Clinical decision support and differential diagnoses
- Medical documentation (sick leave notes, referral letters, patient instructions)
- Prescription guidance and medication management
- Procedure documentation and clinical notes
- Patient education materials and handouts
- Insurance documentation and medical necessity letters
- Summarizing clinical discussions
- Clarifying previous recommendations
- Reorganizing differential diagnoses
- Answering follow-up questions about topics we've discussed

## CLINICAL APPROACH:
- Provide comprehensive differential diagnoses with risk stratification
- Include evidence-based recommendations with level of evidence when possible
- Consider epidemiological factors and patient demographics
- Address both common and can't-miss diagnoses
- Include relevant clinical pearls and recent guideline updates
```

#### Historical Evolution
- **Early versions**: Strict medical-only ("CRITICAL: You MUST ONLY answer medical questions")
- **Mid versions**: Plain text formatting only, no HTML
- **Current**: Rich HTML formatting, expanded scope including documentation

---

## ❓ Follow-up Question System

### Format Requirements
Follow-up questions are **MANDATORY** for all responses and follow strict formatting:

#### JSON Format in Tags
```html
<follow_ups>
[
  "Question 1 here",
  "Question 2 here",
  "Question 3 here"
]
</follow_ups>
```

### Question Guidelines

#### For Patients
- **Focus**: Practical, patient-friendly questions
- **Length**: 8-12 words per question
- **Examples**:
  - "What are the most common side effects to watch for?"
  - "How long before I should expect to see improvement?"
  - "When should I schedule my next follow-up appointment?"

#### For Providers
- **Focus**: Clinically sophisticated questions
- **Length**: 8-12 words per question
- **Examples**:
  - "What additional testing would narrow the differential diagnosis?"
  - "Which clinical decision rules apply to this presentation?"
  - "What are the key monitoring parameters for this treatment?"

### Extraction System
The system has **multiple fallback patterns** for extracting follow-ups:
1. Primary: `<follow_ups>` tags
2. Secondary: Section headers ("Follow-up Questions:")
3. Tertiary: "End with X follow-up questions" patterns

---

## 🎨 Response Formatting

### Core Formatting Rules
```
- Use <b></b> tags for section headers ONLY
- Use bullet points (•) for lists
- Use emojis sparingly (⚠️ warnings, 💡 tips, 🚨 emergency)
- Add line breaks between sections
```

### Minimal Highlighting
```
- <span class="clinical-keyword"> for CRITICAL medical terms (max 2-3 per response)
- <div class="warning-box"> for "When to See Your Doctor" sections (patients)
- Standard bold for critical decision points (providers)
- Everything else: plain text for speed
```

### Special Formatting

#### Medication Dosing
```html
<span class="medication-dose">500-1000 mg every 6 hours</span>
<span class="medication-dose">Maximum: 4000 mg per day</span>
```

#### Warning Boxes (Patients)
```html
<div class="warning-box">
  <b>When to See Your Doctor</b>
  • Symptom 1
  • Symptom 2
</div>
```

---

## 🔄 Streaming Implementation

### SSE Endpoint
- **URL**: `/streamAIResponse`
- **Method**: Server-Sent Events (SSE)
- **Fallback**: Progressive character simulation if SSE fails

### Streaming Features
- Real-time character-by-character display
- 100ms minimum update interval for smooth UI
- Word boundary detection
- Heartbeat every 15 seconds to keep connection alive

---

## 🏥 Medical Context Detection

The system automatically detects and categorizes medical contexts:

### Detection Patterns
```javascript
- Emergency: /emergency|urgent|severe|chest pain|difficulty breathing/
- Chronic: /diabetes|hypertension|arthritis|copd|asthma/
- Symptoms: /pain|ache|fever|cough|nausea|vomit|dizzy/
- Medication: /medication|drug|dose|pill|tylenol|ibuprofen/
- Mental Health: /anxiety|depression|stress|mental|emotional/
- Pediatric: /child|baby|infant|toddler|kid/
- Documentation: /write|create|draft|appeal|insurance|fmla/
```

### Query Type Classification
- `symptoms`: Pain, discomfort inquiries
- `medications`: Drug-related questions
- `procedures`: How-to medical procedures
- `labs`: Test results interpretation
- `general`: Other medical queries

---

## 🧹 Gemini References to Remove

Found only **mock/commented references** to Gemini:

1. **src/services/geminiService.ts**
   - Contains only mock responses
   - Has commented-out Gemini code
   - Should be deleted or renamed to `mockService.ts`

2. **src/screens/BlogPostPage.tsx**
   - Imports `getAiSummary` from geminiService
   - Only uses mock summaries from blog data
   - Should update import or inline the mock function

---

## ✅ Summary

**Your system is 100% DeepSeek-powered** with:
- Sophisticated adaptive prompting
- Context-aware medical responses
- Mandatory follow-up questions
- Rich HTML formatting
- Real-time streaming
- Smart token management
- Multiple fallback systems

The only "Gemini" references are mock placeholders that aren't actually connected to any Gemini API.

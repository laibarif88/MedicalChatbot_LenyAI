# Leny AI Medical Chat - Complete System Flow Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [User Flow & Application States](#user-flow--application-states)
4. [Authentication & User Management](#authentication--user-management)
5. [AI Service Integration](#ai-service-integration)
6. [Firebase Functions & Backend](#firebase-functions--backend)
7. [Component Architecture](#component-architecture)
8. [Data Flow & State Management](#data-flow--state-management)
9. [Deployment & Configuration](#deployment--configuration)
10. [Recent Improvements & Tasks](#recent-improvements--tasks)
11. [Development Workflow](#development-workflow)

## System Overview

**Leny AI Medical Chat** is a sophisticated React-based medical AI assistant platform that provides intelligent healthcare guidance to two distinct user types:

- **Patients**: Receive accessible, empathetic medical information and guidance
- **Healthcare Providers**: Access evidence-based clinical decision support with detailed references

### Key Features
- ✅ Dual-user experience (Patient vs Provider modes)
- ✅ Real-time AI streaming responses via Server-Sent Events (SSE)
- ✅ Guest and authenticated user support
- ✅ Proactive workspace for healthcare providers
- ✅ Context-aware prompt management
- ✅ Professional medical formatting
- ✅ Mobile-responsive design
- ✅ Admin panel with user management
- ✅ Blog and marketing pages
- ✅ Firebase integration with Firestore persistence

## Architecture & Technology Stack

### Frontend Stack
```
React 19.1.1
├── TypeScript 5.8.2
├── Vite 6.2.0 (Build tool)
├── Tailwind CSS 4.1.12
├── React Hot Toast (Notifications)
└── Firebase SDK 12.2.0
```

### Backend Stack
```
Firebase Platform
├── Firebase Functions (Node.js)
├── Firestore Database
├── Firebase Authentication
└── Firebase Hosting
```

### AI Integration
```
DeepSeek API
├── Chat Completions Endpoint
├── Streaming Support
├── Context-aware prompts
└── Medical query optimization
```

### Deployment Platforms
```
Primary: Firebase Hosting
Secondary: Vercel
├── Environment variables management
├── CI/CD via GitHub
└── Custom domain support
```

## User Flow & Application States

### Application State Machine
```typescript
type AppState =
  | { screen: 'landing'; isTransitioning?: boolean; transitionQuery?: string; transitionType?: UserType }
  | { screen: 'chat'; query?: string; type: UserType; isTransitioning?: boolean }
  | { screen: 'profile'; type: UserType }
  | { screen: 'settings'; type: UserType }
  | { screen: 'admin' }
  | { screen: 'blog' }
  | { screen: 'blog-post'; slug: string }
  | { screen: 'waiting-list' }
  | { screen: 'contact' };
```

### User Journey Flow

#### 1. Landing Page (`/`)
```
Landing Screen
├── Hero Section with Video Background
├── User Type Selection (Patient/Provider)
├── Guest Access (Try without signing up)
├── Sign Up / Login Modals
├── Navigation to Blog, Waiting List, Contact
└── Admin Access (hidden)
```

#### 2. Authentication Flow
```
Authentication Options
├── Guest Access (Limited features)
├── Email/Password Registration
├── Google OAuth Sign-in
├── Profile Completion (for OAuth users)
└── User Type Selection (Patient/Provider)
```

#### 3. Chat Experience
```
Chat Screen
├── User Type: Patient
│   ├── Simple, empathetic interface
│   ├── Medical information in accessible language
│   ├── Quick reply suggestions
│   └── Proactive safety warnings
│
├── User Type: Provider
│   ├── Professional clinical interface
│   ├── Evidence-based responses with citations
│   ├── Three-column layout:
│   │   ├── Column 1: Sidebar (Conversations/Notes)
│   │   ├── Column 2: Chat Interface
│   │   └── Column 3: Proactive Analysis Workspace
│   ├── Clinical decision support
│   └── Medical formatting with statistics
│
├── Real-time Streaming
│   ├── Server-Sent Events (Primary)
│   ├── Progressive Fallback (Backup)
│   └── Cancellation support
│
└── Message Features
    ├── Auto-scroll with smart stopping
    ├── Message persistence in Firestore
    ├── Quick action buttons
    └── Medical formatting
```

#### 4. Additional Screens
```
Profile Screen
├── User information management
├── Preferences configuration
├── Communication style settings
└── Information preference settings

Settings Screen
├── Account settings
├── Notification preferences
├── Privacy controls
└── Data management

Admin Screen
├── User management dashboard
├── Usage analytics
├── Content moderation tools
└── System health monitoring
```

## Authentication & User Management

### Firebase Authentication Integration
```typescript
// Auth Context Provider
AuthProvider
├── User state management
├── Authentication persistence
├── Google OAuth integration
├── Guest user support
└── Profile completion flow
```

### User Types & Permissions
```typescript
interface User {
  uid: string;
  email?: string;
  displayName?: string;
  userType: 'patient' | 'provider';
  isGuest: boolean;
  preferences?: {
    communicationStyle: 'supportive' | 'professional' | 'conversational' | 'direct';
    infoPreference: 'data-driven' | 'detailed' | 'summaries' | 'visual';
  };
}
```

### Session Management
```typescript
// Local Storage Persistence
userSession: UserType
chatHistory: ConversationMessage[]
preferences: UserPreferences
```

## AI Service Integration

### Request Flow Architecture
```
Frontend Request
    ↓
aiService.ts (Client)
    ↓
Firebase Functions
    ↓
DeepSeek API
    ↓
Response Processing
    ↓
Client Rendering
```

### AI Service Features

#### 1. Streaming Response System
```typescript
// Real-time streaming with fallback
async *streamResponse(
  message: string,
  userType: 'patient' | 'provider',
  isProactiveMode?: boolean,
  conversationHistory?: Array<{role: string; content: string}>,
  abortController?: AbortController
): AsyncGenerator<string, void, unknown>
```

#### 2. Context-Aware Processing
```typescript
// Query optimization based on content
const optimization = {
  nonMedical: /^what is \d+[\+\-\*\/]\d+|^calculate|^math/,
  medicalAcronyms: /\b(CHF|COPD|MS|ALS|DVT|PE|MI|CVA|TIA|SpO2)\b/,
  complexMedical: /\b(pathophysiology|differential|mechanism)/,
  medication: /tylenol|acetaminophen|ibuprofen|aspirin/
}
```

#### 3. Dynamic Token Management
```typescript
// Adaptive token limits based on query complexity
const maxTokens = {
  nonMedical: 50,
  patientSimple: 400,
  patientComplex: 800,
  providerStandard: 1000,
  providerComplex: 1400
}
```

## Firebase Functions & Backend

### Function Endpoints

#### 1. Unified AI Response (`getAIResponse`)
```typescript
interface AIRequestData {
  message: string;
  userType: 'patient' | 'provider';
  isProactiveMode?: boolean;
  conversationHistory?: Array<{role: string; content: string}>;
  isGuest?: boolean;
  requiresAuth?: boolean;
}
```

#### 2. Streaming AI Response (`streamAIResponse`)
```typescript
// Server-Sent Events endpoint
POST /streamAIResponse
├── CORS handling for multiple origins
├── Authentication verification
├── Real-time streaming via SSE
├── Connection management
├── Error handling & fallbacks
└── Heartbeat maintenance
```

#### 3. Legacy Endpoints (Deprecated)
```typescript
getAIResponseGuest    // → Redirects to getAIResponse
getMedicalResponse    // → Redirects to getAIResponse
```

### Prompt Management System

#### Smart Prompt Builder
```typescript
// functions/src/prompts/promptManager.ts
buildAdaptivePrompt(
  message: string,
  userType: 'patient' | 'provider',
  isProactiveMode: boolean,
  preferences?: UserPreferences
): string
```

#### Context-Aware Prompts
```
Base Prompts
├── PATIENT_BASE (Empathetic, accessible)
├── PROVIDER_BASE (Evidence-based, clinical)
├── PROACTIVE_ANALYSIS (Analytical insights)
└── SAFETY_WARNINGS (Risk assessment)

Modular Components
├── Medical formatting rules
├── Citation requirements
├── Statistical guidance
├── Safety protocols
└── Tone adjustments
```

#### Evidence-Based Provider Prompts
```
Enhanced Requirements
├── Risk stratification with pre-test probabilities
├── Evidence levels (Level A/B/C, Class I/II/III)
├── Specific guideline citations (ACC/AHA, USPSTF, NICE)
├── NNT/NNH data with confidence intervals
├── Epidemiological factors
├── Likelihood ratios for diagnoses
├── Sensitivity/specificity for tests
└── Recent guideline updates
```

## Component Architecture

### Screen Components
```
src/screens/
├── LandingScreen.tsx      (Marketing & user type selection)
├── ChatScreen.tsx         (Main chat interface)
├── OnboardingFlow.tsx     (Registration process)
├── LoginScreen.tsx        (Authentication)
├── ProfileScreen.tsx      (User profile management)
├── SettingsScreen.tsx     (App settings)
├── AdminScreen.tsx        (Admin dashboard)
├── BlogPage.tsx           (Marketing blog)
├── BlogPostPage.tsx       (Individual blog posts)
├── WaitingListPage.tsx    (Pre-launch signups)
└── ContactUsScreen.tsx    (Support contact)
```

### Chat Components
```
src/components/chat/
├── ChatView.tsx           (Main chat interface)
├── MessageBubble.tsx      (Formatted message display)
├── MessageBubbleSimple.tsx (Simplified message display)
├── ChatInput.tsx          (Message input with streaming)
├── Sidebar.tsx            (Conversation history)
├── TypingIndicator.tsx    (AI response indicator)
├── QuickReplyBar.tsx      (Suggested actions)
├── MessageActions.tsx     (Copy, regenerate, etc.)
└── Icons.tsx              (Chat interface icons)
```

### Workspace Components (Provider Mode)
```
src/components/workspace/
├── ProactiveWorkspace.tsx     (Column 3: Analysis panel)
├── InstructionsView.tsx       (Column 2: Guidance chat)
├── ExpertPanelSelector.tsx    (Specialty selection)
└── notes/
    └── NotesView.tsx          (Clinical notes)
```

### Admin Components
```
src/components/admin/
├── AdminSidebar.tsx       (Navigation)
├── UsersTable.tsx         (User management)
├── AnalyticsChart.tsx     (Usage analytics)
├── AlertsPanel.tsx        (System alerts)
└── charts/                (Data visualization)
```

## Data Flow & State Management

### State Architecture
```
App State
├── Global App State (useState)
│   ├── Current screen
│   ├── User type
│   ├── Transition states
│   └── Modal states
│
├── Auth Context
│   ├── Current user
│   ├── Authentication status
│   ├── User preferences
│   └── Session management
│
├── Local State Management
│   ├── Chat history (localStorage)
│   ├── User session (localStorage)
│   ├── Conversation state
│   └── UI preferences
│
└── Firestore Integration
    ├── User profiles
    ├── Conversation persistence
    ├── Analytics data
    └── System configuration
```

### Message Flow
```
User Input → ChatInput Component
    ↓
aiService.streamResponse()
    ↓
Firebase Function (getAIResponse/streamAIResponse)
    ↓
DeepSeek API Processing
    ↓
Real-time Streaming (SSE)
    ↓
MessageBubble Rendering
    ↓
Auto-scroll Management
    ↓
Conversation Persistence
```

## Deployment & Configuration

### Environment Configuration
```
Development (.env)
├── DEEPSEEK_API_KEY
├── FIREBASE_CONFIG
├── VITE_* (Client-side variables)
└── Local development settings

Production (Firebase Functions Config)
├── deepseek.api_key
├── Environment-specific settings
└── CORS configuration
```

### Build & Deployment Pipeline
```
GitHub Repository
    ↓
Development (npm run dev)
├── Vite dev server
├── Firebase emulators
└── Local testing

Production Build (npm run build)
├── Vite production build
├── TypeScript compilation
├── Asset optimization
└── Firebase deployment

Deployment Targets
├── Firebase Hosting (Primary)
├── Vercel (Secondary)
└── Custom domain routing
```

### Firebase Configuration
```
firebase.json
├── Functions configuration
├── Hosting rules
├── Firestore rules
└── Security configuration

firestore.rules
├── User data access control
├── Conversation privacy
├── Admin permissions
└── Guest user limitations
```

## Recent Improvements & Tasks

### ✅ Completed Tasks

#### 1. Enhanced Provider Prompts
- Evidence-based requirements with citations
- Statistical data integration (NNT/NNH, CI)
- Guideline references (ACC/AHA, USPSTF, NICE)
- Risk stratification parameters

#### 2. Preference-Based Tone Matching (Partial)
- `buildAdaptivePrompt` function supports preferences
- `getPreferenceModifiers` for communication styles
- Backend infrastructure ready for preference integration

#### 3. System Optimization
- Content-based query optimization (not length-based)
- Dynamic token allocation
- Improved streaming performance
- Medical complexity detection

### ⏳ Pending Tasks

#### 1. Auto-Scroll Feature Enhancement
**Current Issue**: Auto-scroll continues for very long messages
**Requirements**:
- Implement content height detection threshold
- Stop auto-scrolling when content exceeds viewport by ~100px
- Show downward arrow indicator when stopped
- Maintain arrow visibility during streaming

**Files to modify**:
- `src/components/chat/ChatView.tsx`

#### 2. Provider Pro Mode UI Update
**Current Layout**: Sidebar | Chat | Notes/Analysis
**New Requirements**: Sidebar | Instructions | Work Area
- Column 2: Concise instructions/guidance chat
- Column 3: Actual work/implementation space
- Brief, action-oriented responses in column 2

**Files to modify**:
- `src/screens/ChatScreen.tsx`
- `src/components/workspace/InstructionsView.tsx`

#### 3. Preference Integration Completion
**Missing Components**:
- Fetch user preferences from Firestore in frontend
- Pass preferences to AI service
- Update API endpoints to accept preferences

**Files to modify**:
- `src/services/aiService.ts`
- `functions/src/index.ts`
- Frontend preference fetching logic

### 🔧 Technical Improvements Made

#### 1. Streaming Optimization
```typescript
// Improved SSE with fallback
streamFromSSE() → Progressive simulation fallback
├── Real-time Server-Sent Events
├── Graceful fallback to progressive simulation
├── AbortController support for cancellation
├── Connection heartbeat management
└── Error handling and recovery
```

#### 2. Query Optimization System
```typescript
// Content-based analysis (not length-based)
Query Classification
├── Non-medical detection
├── Medical acronym recognition
├── Complex medical concept identification
├── Medication query detection
└── Dynamic token allocation
```

#### 3. Response Quality Improvements
```typescript
// Enhanced medical formatting
Medical Response Features
├── Evidence-based citations
├── Statistical data integration
├── Risk stratification
├── Safety warning protocols
└── Professional formatting
```

## Development Workflow

### Local Development Setup
```bash
# Prerequisites
Node.js >= 18.0.0
npm >= 8.0.0
Firebase CLI

# Installation
git clone https://github.com/michelzappy/leny-AI-studio-2.git
cd leny-AI-studio-2
npm install

# Environment Setup
cp .env.example .env
# Add your API keys to .env

# Development Server
npm run dev                    # Start Vite dev server
firebase emulators:start      # Start Firebase emulators (optional)

# Build & Deploy
npm run build                 # Production build
firebase deploy               # Deploy to Firebase
```

### Project Structure
```
leny-AI-studio-2/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── chat/            # Chat-specific components
│   │   ├── admin/           # Admin dashboard components
│   │   ├── workspace/       # Provider workspace components
│   │   └── icons/           # Icon components
│   ├── screens/             # Full-screen pages
│   ├── services/            # API and business logic
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React context providers
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── styles/              # Global styles
│   └── constants/           # Application constants
├── functions/
│   └── src/
│       ├── index.ts         # Firebase Functions entry
│       └── prompts/         # AI prompt management
├── public/                  # Static assets
├── tests/                   # Test files and scripts
└── docs/                    # Documentation files
```

### Key Configuration Files
```
Root Configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── firebase.json           # Firebase project configuration
├── firestore.rules         # Database security rules
├── .env                    # Environment variables
└── vercel.json            # Vercel deployment config
```

### Testing & Quality Assurance

#### Manual Testing Scripts
```
tests/scripts/
├── test-spo2-question.ts    # SpO2 query testing
├── test-followup-fix.ts     # Follow-up question testing
├── test-universal-fix.js    # Universal response testing
└── test-preferences.html    # Preference testing
```

#### Quality Checklist
- [ ] Medical accuracy verification
- [ ] Response formatting validation  
- [ ] Cross-browser compatibility testing
- [ ] Mobile responsiveness testing
- [ ] Performance optimization verification
- [ ] Security audit completion
- [ ] Accessibility compliance check

### Monitoring & Analytics

#### System Health Monitoring
```
Production Monitoring
├── Firebase Functions logs
├── Firestore usage metrics
├── DeepSeek API rate limits
├── User session analytics
└── Error tracking and alerts
```

#### Performance Metrics
```
Key Performance Indicators
├── Response time (TTFB)
├── Streaming latency
├── User engagement rates
├── Query success rates
├── Error rates by component
└── User satisfaction scores
```

### Security & Privacy

#### Data Protection
```
Privacy Implementation
├── User data encryption
├── Firestore security rules
├── Authentication verification
├── Guest user limitations
├── PII data handling
└── Medical information protection
```

#### Security Measures
```
Security Features
├── Input sanitization
├── XSS prevention
├── CORS configuration
├── Rate limiting
├── Authentication validation
└── API key protection
```

## Troubleshooting Guide

### Common Issues

#### 1. Streaming Connection Problems
```
Symptoms: Messages not streaming in real-time
Solutions:
├── Check CORS configuration
├── Verify Firebase Function logs
├── Test with fallback mode
├── Check network connectivity
└── Validate API key configuration
```

#### 2. Authentication Issues
```
Symptoms: User login failures, session persistence problems
Solutions:
├── Verify Firebase config
├── Check localStorage permissions
├── Validate auth token expiration
├── Test with guest mode
└── Clear browser cache/storage
```

#### 3. AI Response Quality Issues
```
Symptoms: Inappropriate or inaccurate medical responses
Solutions:
├── Review prompt engineering
├── Check query classification logic
├── Validate medical formatting
├── Test with different user types
└── Monitor API usage patterns
```

### Debug Mode
```typescript
// Enable detailed logging
localStorage.setItem('debug', 'true');

// Monitor AI service calls
console.log('AI Request:', requestData);
console.log('AI Response:', responseData);

// Track state changes
console.log('App State:', currentAppState);
```

## Future Roadmap

### Planned Features
- [ ] Multi-language support
- [ ] Voice input/output integration
- [ ] Advanced medical image analysis
- [ ] Clinical decision trees
- [ ] Integration with EHR systems
- [ ] Telemedicine video chat
- [ ] AI-powered medical coding
- [ ] Patient outcome tracking

### Technical Improvements
- [ ] GraphQL API implementation
- [ ] Advanced caching strategies
- [ ] Offline mode support
- [ ] Progressive Web App (PWA)
- [ ] Enhanced mobile experience
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Machine learning model fine-tuning

---

## Summary

The Leny AI Medical Chat system represents a sophisticated, production-ready medical AI assistant platform with:

✅ **Robust Architecture**: React + TypeScript + Firebase + DeepSeek AI  
✅ **Dual User Experience**: Optimized for both patients and healthcare providers  
✅ **Real-time Streaming**: Server-Sent Events with intelligent fallbacks  
✅ **Medical Accuracy**: Evidence-based prompts with clinical citations  
✅ **Scalable Infrastructure**: Firebase platform with Vercel deployment options  
✅ **Security & Privacy**: Comprehensive data protection and user authentication  
✅ **Performance Optimized**: Content-aware processing with dynamic resource allocation  

The system is actively maintained with ongoing improvements in user experience, medical accuracy, and technical performance. The comprehensive documentation and modular architecture support easy maintenance, feature additions, and team collaboration.

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team

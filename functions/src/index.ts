import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import { buildAdaptivePrompt } from './prompts/promptManager';

admin.initializeApp();

// Configure CORS to allow both production and localhost
const allowedOrigins = [
  'https://lenydatabase.web.app',
  'https://lenydatabase.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

interface AIRequestData {
  message: string;
  userType: 'patient' | 'provider';
  isProactiveMode?: boolean;
  conversationHistory?: Array<{
    role: string;
    content: string;
  }>;
  isGuest?: boolean;
  requiresAuth?: boolean;
}

interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
  metadata?: {
    queryType?: 'symptoms' | 'medications' | 'procedures' | 'labs' | 'general';
    hasValidFormat?: boolean;
    responseTime?: number;
  };
}

/**
 * Unified AI endpoint that handles all AI requests
 * Supports both authenticated and guest users
 * Can handle both regular and medical-specific queries
 */
export const getAIResponse = functions
  .runWith({
    timeoutSeconds: 120, // Increase timeout to 2 minutes
    memory: '512MB'      // Increase memory for better performance
  })
  .https.onCall(async (data: AIRequestData, context: functions.https.CallableContext): Promise<AIResponse> => {
  const { 
    message, 
    userType, 
    isProactiveMode, 
    conversationHistory,
    isGuest = false,
    requiresAuth = false
  } = (data || {}) as AIRequestData;

  // Validate input
  if (!message || typeof message !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Message must be a non-empty string'
    );
  }

  if (!userType || !['patient', 'provider'].includes(userType)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid user type'
    );
  }

  // Check authentication only if required and not a guest
  if (requiresAuth && !isGuest && !context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to use this feature'
    );
  }

  // Sanitize input - only limit length, don't remove < > as they may be part of medical content
  const sanitizedMessage = message.substring(0, 2000); // Limit length only

  try {
    // Get API key from environment variables or Firebase Functions config
    const apiKey = process.env.DEEPSEEK_API_KEY || functions.config().deepseek?.api_key;
    
    if (!apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // Detect query type for optimization - CONTENT-BASED, NOT LENGTH-BASED
    const lower = sanitizedMessage.toLowerCase();
    
    // Non-medical detection (these get minimal tokens)
    const isNonMedical = /^what is \d+[\+\-\*\/]\d+|^calculate|^math|^weather$|^hello$|^hi$|^yes$|^no$|^thanks?$|^thank you$/i.test(lower.trim());
    
    // Medical complexity detection based on CONTENT, not length
    const hasMedicalAcronyms = /\b(CHF|COPD|MS|ALS|DVT|PE|MI|CVA|TIA|SpO2|BP|HR|RR|ICU|ER|OR|NICU|PICU|EKG|ECG|MRI|CT|PET|SARS|AIDS|HIV|UTI|GERD|IBS|IBD|ADHD|PTSD|OCD)\b/i.test(sanitizedMessage);
    const hasComplexMedicalConcepts = /\b(pathophysiology|differential|mechanism|etiology|prognosis|comorbid|contraindication|indication|pharmacokinetics|pharmacodynamics|mortality|morbidity|epidemiology|prophylaxis|idiopathic|iatrogenic|nosocomial|metastasis|anaphylaxis|sepsis|stenosis|ischemia|infarction|embolism|thrombosis)\b/i.test(lower);
    const isMedicationQuery = /tylenol|acetaminophen|ibuprofen|aspirin|advil|motrin|medication|drug|dose|dosage|pill|prescription|antibiotic|antiviral|steroid|insulin|warfarin|heparin|statin|beta.?blocker|ace.?inhibitor|nsaid/i.test(lower);
    const hasMedicalTerms = /(emergency|urgent|severe|chest|pain|blood|breathing|oxygen|saturation|respiratory|wheez|vital|symptom|diagnosis|treatment|therapy|disease|condition|infection|fever|cough|asthma|pneumonia|heart|cardiac|pulse|pressure|diabetes|glucose|cancer|tumor|surgery|procedure|test|lab|result|normal|abnormal)/i.test(lower);
    
    // Determine complexity based on CONTENT, not length
    const needsDetailedExplanation = hasMedicalAcronyms || hasComplexMedicalConcepts;
    const isMedicalQuery = hasMedicalTerms || isMedicationQuery;
    
    // Reduced history for faster processing
    const historyLimit = isNonMedical ? 0 :                      // No history for non-medical
                        needsDetailedExplanation ? 4 :           // Limited history even for complex
                        isMedicalQuery ? 2 :                     // Minimal history for medical
                        0;                                        // No history for simple

    // Prepare messages for the API with context-aware prompt
    const messages = [
      {
        role: 'system',
        content: getSystemPrompt(userType, isProactiveMode || false, sanitizedMessage)
      }
    ];

    // Add conversation history ONLY for complex queries
    if (historyLimit > 0 && conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory.slice(-historyLimit));
    }

    // Add the current message
    messages.push({
      role: 'user',
      content: sanitizedMessage
    });

    // Dynamic parameters balanced for speed and completeness
    // Provider responses need more detail for clinical decision-making
    const maxTokens = isNonMedical ? 50 :                      // Very short for non-medical rejection
                     userType === 'patient' ? (
                       needsDetailedExplanation ? 800 :        // Complex conditions (max ~350 words)
                       isMedicationQuery ? 600 :               // Medication info (max ~250 words)
                       isMedicalQuery ? 500 :                  // Standard medical (max ~200 words)
                       400                                      // Simple questions (max ~150 words)
                     ) : (
                       needsDetailedExplanation ? 1400 :       // Provider: comprehensive clinical detail
                       isMedicationQuery ? 1200 :              // Provider: full dosing and monitoring
                       isMedicalQuery ? 1000 :                 // Provider: complete clinical info
                       800                                      // Provider: standard response
                     );

    const temperature = isNonMedical ? 0 :                     // Deterministic for non-medical
                       needsDetailedExplanation ? 0.2 :        // Low variability for complex medical
                       userType === 'patient' ? 0.5 :          // More human/warm for patients
                       0.3;                                     // Balanced for standard medical queries

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json() as any;
    const aiResponse = result.choices?.[0]?.message?.content || 'No response generated';
    
    return {
      success: true,
      response: aiResponse,
      metadata: {
        queryType: detectMedicalQueryType(sanitizedMessage),
        hasValidFormat: hasValidMedicalFormat(aiResponse),
        responseTime: Date.now()
      }
    };
  } catch (error) {
    
    
    // Provide more specific error messages
    let errorMessage = 'Failed to get AI response. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('API request failed')) {
        errorMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error. Please contact support.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again with a shorter message.';
      }
    }
    
    throw new functions.https.HttpsError(
      'internal',
      errorMessage
    );
  }
});

/**
 * Server-Sent Events endpoint for real-time AI streaming
 * Unified streaming endpoint for both authenticated and guest users
 */
export const streamAIResponse = functions
  .runWith({
    timeoutSeconds: 120, // Increase timeout to 2 minutes
    memory: '512MB'      // Increase memory for better performance
  })
  .https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  // Set CORS headers based on allowed origins
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    // Allow any origin in development/testing
    res.set('Access-Control-Allow-Origin', '*');
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Max-Age', '3600');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Parse request data
    const { message, userType, isProactiveMode, conversationHistory, isGuest, requiresAuth } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message must be a non-empty string' });
      return;
    }

    if (!userType || !['patient', 'provider'].includes(userType)) {
      res.status(400).json({ error: 'Invalid user type' });
      return;
    }

    // Check authentication if required
    if (requiresAuth && !isGuest) {
      const authHeader = req.headers.authorization;
      let isAuthenticated = false;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          await admin.auth().verifyIdToken(token);
          isAuthenticated = true;
        } catch (authError) {
        }
      }

      if (!isAuthenticated) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
    }

    // Set SSE headers with better compatibility
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
      'X-Content-Type-Options': 'nosniff'
    });

    // Sanitize input - only limit length, don't remove < > as they may be part of medical content
    const maxLength = 2000;
    const sanitizedMessage = message.substring(0, maxLength);

    // Get API key
    const apiKey = process.env.DEEPSEEK_API_KEY || functions.config().deepseek?.api_key;
    if (!apiKey) {
      res.write(`data: ${JSON.stringify({ error: 'API configuration error' })}\n\n`);
      res.end();
      return;
    }

    // Detect query type for optimization - CONTENT-BASED, NOT LENGTH-BASED (same as non-streaming)
    const lower = sanitizedMessage.toLowerCase();
    
    // Non-medical detection (these get minimal tokens)
    const isNonMedical = /^what is \d+[\+\-\*\/]\d+|^calculate|^math|^weather$|^hello$|^hi$|^yes$|^no$|^thanks?$|^thank you$/i.test(lower.trim());
    
    // Medical complexity detection based on CONTENT, not length
    const hasMedicalAcronyms = /\b(CHF|COPD|MS|ALS|DVT|PE|MI|CVA|TIA|SpO2|BP|HR|RR|ICU|ER|OR|NICU|PICU|EKG|ECG|MRI|CT|PET|SARS|AIDS|HIV|UTI|GERD|IBS|IBD|ADHD|PTSD|OCD)\b/i.test(sanitizedMessage);
    const hasComplexMedicalConcepts = /\b(pathophysiology|differential|mechanism|etiology|prognosis|comorbid|contraindication|indication|pharmacokinetics|pharmacodynamics|mortality|morbidity|epidemiology|prophylaxis|idiopathic|iatrogenic|nosocomial|metastasis|anaphylaxis|sepsis|stenosis|ischemia|infarction|embolism|thrombosis)\b/i.test(lower);
    const isMedicationQuery = /tylenol|acetaminophen|ibuprofen|aspirin|advil|motrin|medication|drug|dose|dosage|pill|prescription|antibiotic|antiviral|steroid|insulin|warfarin|heparin|statin|beta.?blocker|ace.?inhibitor|nsaid/i.test(lower);
    const hasMedicalTerms = /(emergency|urgent|severe|chest|pain|blood|breathing|oxygen|saturation|respiratory|wheez|vital|symptom|diagnosis|treatment|therapy|disease|condition|infection|fever|cough|asthma|pneumonia|heart|cardiac|pulse|pressure|diabetes|glucose|cancer|tumor|surgery|procedure|test|lab|result|normal|abnormal)/i.test(lower);
    
    // Determine complexity based on CONTENT, not length
    const needsDetailedExplanation = hasMedicalAcronyms || hasComplexMedicalConcepts;
    const isMedicalQuery = hasMedicalTerms || isMedicationQuery;
    
    // Reduced history for faster processing
    const historyLimit = isNonMedical ? 0 :                      // No history for non-medical
                        needsDetailedExplanation ? 4 :           // Limited history even for complex
                        isMedicalQuery ? 2 :                     // Minimal history for medical
                        0;                                        // No history for simple

    // Prepare messages with context-aware prompt
    const messages = [
      {
        role: 'system',
        content: getSystemPrompt(userType, isProactiveMode || false, sanitizedMessage)
      }
    ];

    // Add conversation history ONLY for complex queries
    if (historyLimit > 0 && conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory.slice(-historyLimit));
    }

    messages.push({
      role: 'user',
      content: sanitizedMessage
    });

    // Dynamic parameters balanced for speed and completeness (matching non-streaming)
    // Provider responses need more detail for clinical decision-making
    const maxTokens = isNonMedical ? 50 :                      // Very short for non-medical rejection
                     userType === 'patient' ? (
                       needsDetailedExplanation ? 800 :        // Complex conditions (max ~350 words)
                       isMedicationQuery ? 600 :               // Medication info (max ~250 words)
                       isMedicalQuery ? 500 :                  // Standard medical (max ~200 words)
                       400                                      // Simple questions (max ~150 words)
                     ) : (
                       needsDetailedExplanation ? 1400 :       // Provider: comprehensive clinical detail
                       isMedicationQuery ? 1200 :              // Provider: full dosing and monitoring
                       isMedicalQuery ? 1000 :                 // Provider: complete clinical info
                       800                                      // Provider: standard response
                     );

    const temperature = isNonMedical ? 0 :                     // Deterministic for non-medical
                       needsDetailedExplanation ? 0.2 :        // Low variability for complex medical
                       userType === 'patient' ? 0.5 :          // More human/warm for patients
                       0.3;                                     // Balanced for standard medical queries

    // Stream from DeepSeek API with timeout and error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout (within function's 120s limit)
    
    const startTime = Date.now();
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const ttfb = Date.now() - startTime;
    
    if (ttfb > 10000) { // Log slow responses
    }

    if (!response.ok) {
      res.write(`data: ${JSON.stringify({ error: 'AI service unavailable' })}\n\n`);
      res.end();
      return;
    }

    // Handle connection cleanup
    const cleanup = () => {
      if (!res.destroyed) {
        res.end();
      }
    };

    req.on('close', cleanup);
    req.on('aborted', cleanup);

    // Stream response chunks using node-fetch body
    if (!response.body) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to read response' })}\n\n`);
      res.end();
      return;
    }

    // Send initial connection confirmation
    res.write(':connected\n\n');
    res.write(`data: ${JSON.stringify({ status: 'connected', timestamp: Date.now() })}\n\n`);
    
    // Send request status update
    res.write(`data: ${JSON.stringify({ status: 'requesting', message: 'Contacting AI service...' })}\n\n`);

    // Set up heartbeat to keep connection alive (optimized interval)
    const heartbeat = setInterval(() => {
      if (!res.destroyed && !res.writableEnded) {
        res.write(':heartbeat\n\n');
      }
    }, 15000); // Reduced frequency - 15 seconds is sufficient

    try {
      // Handle streaming response from node-fetch
      let responseBuffer = '';
      
      let isFirstChunk = true;
      let chunkCount = 0;
      
      response.body.on('data', (chunk: Buffer) => {
        try {
          if (isFirstChunk) {
            const firstChunkTime = Date.now() - startTime;
            res.write(`data: ${JSON.stringify({ status: 'streaming_started', ttfb: firstChunkTime })}\n\n`);
            isFirstChunk = false;
          }
          
          chunkCount++;
          const chunkStr = chunk.toString();
          responseBuffer += chunkStr;
          const lines = responseBuffer.split('\n');
          
          // Keep the last incomplete line in buffer
          responseBuffer = lines[lines.length - 1];
          
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                clearInterval(heartbeat);
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                res.end();
                return;
              }

              if (data && data !== '') {
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    // Send content immediately for real-time streaming
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                    
                    // Flush the response to ensure it's sent immediately
                    if (typeof (res as any).flush === 'function') {
                      (res as any).flush();
                    }
                  }
                } catch (parseError) {
                  // Skip malformed chunks but log frequency
                  continue;
                }
              }
            }
          }
        } catch (chunkError) {
          
        }
      });

      response.body.on('end', () => {
        clearInterval(heartbeat);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      });

      response.body.on('error', (streamError: Error) => {
        clearInterval(heartbeat);

        res.write(`data: ${JSON.stringify({ error: 'Streaming interrupted' })}\n\n`);
        res.end();
      });

    } catch (streamError) {
      clearInterval(heartbeat);
      
      res.write(`data: ${JSON.stringify({ error: 'Streaming setup failed' })}\n\n`);
      res.end();
    }

  } catch (error) {
    
    res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
    res.end();
  }
});

/**
 * Get system prompt using the smart prompt manager
 * Always uses the modular, context-aware prompt system
 */
function getSystemPrompt(userType: string, isProactiveMode: boolean, message?: string): string {
  // Always use the smart prompt builder for consistency
  // If no message provided, use a default context
  const contextMessage = message || 'general medical inquiry';
  
  const prompt = buildAdaptivePrompt(
    contextMessage,
    userType as 'patient' | 'provider',
    isProactiveMode
  );
  
  // Return the prompt directly - optimization is now built into buildAdaptivePrompt
  return prompt;
}

/**
 * Detect medical query type for analytics
 */
function detectMedicalQueryType(query: string): 'symptoms' | 'medications' | 'procedures' | 'labs' | 'general' {
  const lowerQuery = query.toLowerCase();
  
  if (/symptom|pain|ache|fever|nausea|vomit|dizz|short|breath|chest|headache/i.test(lowerQuery)) {
    return 'symptoms';
  }
  if (/drug|medication|dose|mg|mcg|pill|tablet|aspirin|antibiotic/i.test(lowerQuery)) {
    return 'medications';
  }
  if (/procedure|technique|how to|step|insert|remove|surgery|biopsy/i.test(lowerQuery)) {
    return 'procedures';
  }
  if (/lab|test|result|normal|high|low|value|blood|urine|culture/i.test(lowerQuery)) {
    return 'labs';
  }
  
  return 'general';
}

/**
 * Check if response has valid medical format
 */
function hasValidMedicalFormat(response: string): boolean {
  const formatMarkers = ['🚨', '💊', '📋', '🔬', '**'];
  return formatMarkers.some(marker => response.includes(marker));
}

/**
 * Health check endpoint
 */
export const healthCheck = functions.https.onRequest((req: functions.https.Request, res: functions.Response) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Legacy endpoint redirects for backward compatibility
// These will be deprecated in future versions

/**
 * @deprecated Use getAIResponse with isGuest: true instead
 */
export const getAIResponseGuest = functions
  .runWith({
    timeoutSeconds: 120,
    memory: '512MB'
  })
  .https.onCall(async (data: AIRequestData, context: functions.https.CallableContext): Promise<AIResponse> => {
  
  // Redirect to unified endpoint with guest flag
  const handler = getAIResponse as any;
  return handler({ ...data, isGuest: true }, context);
});

/**
 * @deprecated Use getAIResponse instead - medical filtering is automatic
 */
export const getMedicalResponse = functions
  .runWith({
    timeoutSeconds: 120,
    memory: '512MB'
  })
  .https.onCall(async (data: any, context: functions.https.CallableContext): Promise<AIResponse> => {
  
  // Map old parameter names to new format
  const handler = getAIResponse as any;
  return handler({
    message: data.query || data.message,
    userType: data.userType,
    conversationHistory: data.conversationHistory,
    isProactiveMode: false,
    requiresAuth: false
  }, context);
});

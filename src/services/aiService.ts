import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../../firebase.config';
import logger from './logger';
import { UserType } from '../types';

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
}

class AIService {
  private getAIResponse = httpsCallable<AIRequestData, AIResponse>(functions, 'getAIResponse');

  /**
   * Get AI response - uses Firebase Functions for authenticated users, fallback for guests
   */
  async getResponse(
    message: string,
    userType: 'patient' | 'provider',
    isProactiveMode: boolean = false,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      const isGuest = !auth.currentUser;
      
      logger.debug('Sending AI request', { 
        userType, 
        isProactiveMode,
        messageLength: message.length,
        isGuest
      });

      // Use unified endpoint with isGuest flag
      const result = await this.getAIResponse({
        message,
        userType,
        isProactiveMode,
        conversationHistory,
        isGuest,
        requiresAuth: false // Set to true only for premium features
      });

      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to get AI response');
      }

      logger.info(`AI response received successfully (${isGuest ? 'guest' : 'authenticated'})`);
      return result.data.response || 'No response generated';

    } catch (error: any) {
      logger.error('AI Service Error', error);
      
      // Handle specific Firebase Function errors
      if (error.code === 'functions/invalid-argument') {
        throw new Error('Invalid request. Please check your input and try again.');
      } else if (error.code === 'functions/resource-exhausted') {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (error.code === 'functions/unavailable') {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else if (error.code === 'functions/unauthenticated') {
        throw new Error('Authentication required for this feature. Please sign in.');
      }
      
      // For guest users, return a safe fallback message if service fails
      if (!auth.currentUser) {
        return 'The AI service is temporarily unavailable. Please try again in a moment.';
      }
      
      throw new Error(error.message || 'Failed to get AI response. Please try again.');
    }
  }








  /**
   * Stream AI response with true server-side streaming via SSE
   * Falls back to progressive simulation if streaming endpoint is unavailable
   * Supports cancellation via AbortController
   */
  async *streamResponse(
    message: string,
    userType: 'patient' | 'provider',
    isProactiveMode: boolean = false,
    conversationHistory?: Array<{ role: string; content: string }>,
    abortController?: AbortController
  ): AsyncGenerator<string, void, unknown> {
    let useSSE = true;
    const streamStartTime = Date.now();
    
    try {
      // Log streaming attempt with details
      logger.info('Attempting SSE streaming for message');
      
      const streamGenerator = this.streamFromSSE(message, userType, isProactiveMode, conversationHistory, abortController);
      
      for await (const chunk of streamGenerator) {
        // Check for cancellation
        if (abortController?.signal.aborted) {
          logger.info('Streaming cancelled by user');
          return;
        }
        yield chunk;
      }
      
      const streamDuration = Date.now() - streamStartTime;
      logger.info(`SSE streaming completed successfully in ${streamDuration}ms`);
      
    } catch (sseError: any) {
      // Check if error is due to cancellation
      if (abortController?.signal.aborted) {
        logger.info('Streaming cancelled during SSE attempt');
        return;
      }
      
      useSSE = false;

      logger.warn('SSE streaming failed, falling back to progressive simulation', sseError);
      
      // Improved progressive fallback simulation
      try {
        const fullResponse = await this.getResponse(
          message,
          userType,
          isProactiveMode,
          conversationHistory
        );

        // Progressive character-based reveal for smooth streaming effect
        const chunkSize = 2; // Reveal 2 characters at a time (reduced from 3)
        const baseDelay = 35; // Base delay in ms (increased from 15)
        
        for (let i = 0; i <= fullResponse.length; i += chunkSize) {
          // Check for cancellation during simulation
          if (abortController?.signal.aborted) {
            logger.info('Streaming simulation cancelled by user');
            return;
          }
          
          const currentText = fullResponse.substring(0, i);
          yield currentText;
          
          // Variable delay for more natural feel
          let delay = baseDelay;
          
          // Pause longer at punctuation for better readability
          const lastChar = fullResponse[i - 1];
          if (lastChar === '.' || lastChar === '!' || lastChar === '?') {
            delay = 250; // Longer pause at sentence end (increased from 100)
          } else if (lastChar === ',' || lastChar === ';' || lastChar === ':') {
            delay = 120; // Medium pause at clause boundaries (increased from 50)
          } else if (lastChar === ' ') {
            delay = 50; // Small pause at word boundaries (increased from 20)
          } else if (lastChar === '\n') {
            delay = 180; // Pause at line breaks for better readability
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Ensure the complete response is yielded
        if (fullResponse.length > 0) {
          yield fullResponse;
        }
        
        
      } catch (fallbackError) {
        logger.error('Both streaming and fallback failed', fallbackError);
        
        throw fallbackError;
      }
    }
  }

  /**
   * Stream from Server-Sent Events endpoint for true real-time streaming
   */
  private async *streamFromSSE(
    message: string,
    userType: 'patient' | 'provider',
    isProactiveMode: boolean = false,
    conversationHistory?: Array<{ role: string; content: string }>,
    abortController?: AbortController
  ): AsyncGenerator<string, void, unknown> {
    const isGuest = !auth.currentUser;
    
    // Prepare request data
    const requestData = {
      message,
      userType,
      isProactiveMode,
      conversationHistory,
      isGuest,
      requiresAuth: false // Set to true only for premium features
    };

    // Get auth token for authenticated users
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (!isGuest && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (authError) {
        logger.warn('Failed to get auth token', authError);
      }
    }

    // Make request to streaming endpoint with cancellation support
    // Use production URL for all environments
    const baseUrl = 'https://us-central1-lenydatabase.cloudfunctions.net';
    const streamUrl = `${baseUrl}/streamAIResponse`;
    
    
    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestData),
      signal: abortController?.signal
    });


    if (!response.ok) {
      throw new Error(`Streaming request failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data) {
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.done) {
                  return;
                }
                
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                
                if (parsed.content) {
                  fullResponse += parsed.content;
                  yield fullResponse;
                }
              } catch (parseError) {
                logger.warn('Failed to parse SSE data', parseError);
                continue;
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }


  /**
   * Analyze conversation for proactive insights
   */
  async analyzeConversation(
    messages: Array<{ role: string; content: string }>,
    userType: 'patient' | 'provider'
  ): Promise<{
    insights: string[];
    recommendations: string[];
    risks: string[];
    followUpQuestions: string[];
  }> {
    try {
      const analysisPrompt = `Analyze this medical conversation and provide:
1. Key insights
2. Recommendations
3. Potential risks

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;

      const response = await this.getResponse(
        analysisPrompt,
        userType,
        true,
        messages
      );

      // Parse the response into structured data
      // In production, you'd want more robust parsing
      return {
        insights: this.extractSection(response, 'insights'),
        recommendations: this.extractSection(response, 'recommendations'),
        risks: this.extractSection(response, 'risks'),
        followUpQuestions: [] // Disabled follow-up questions
      };
    } catch (error) {
      logger.error('Conversation analysis error', error);
      return {
        insights: [],
        recommendations: [],
        risks: [],
        followUpQuestions: []
      };
    }
  }

  /**
   * Helper to extract sections from AI response
   */
  private extractSection(text: string, section: string): string[] {
    const regex = new RegExp(`${section}[:\s]*([^]*?)(?=\n\n|$)`, 'i');
    const match = text.match(regex);
    
    if (match && match[1]) {
      return match[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line !== '-')
        .map(line => line.replace(/^[-•*]\s*/, ''));
    }
    
    return [];
  }

  /**
   * Get quick action suggestions based on context
   */
  async getQuickActions(
    context: string,
    userType: 'patient' | 'provider'
  ): Promise<string[]> {
    try {
      const questions: string[] = [];
      
      // First, try to extract questions from the AI response itself
      const followUpPatterns = [
        /(?:Follow-?up questions?|Questions? you might have|You might also ask|Consider asking):?\s*\n((?:[-•*]\s*.+\n?)+)/gi,
        /(?:Would you like to know more about|You can also ask about):?\s*\n((?:[-•*]\s*.+\n?)+)/gi
      ];
      
      for (const pattern of followUpPatterns) {
        const match = context.match(pattern);
        if (match && match[1]) {
          const extractedQuestions = match[1]
            .split('\n')
            .map(line => line.replace(/^[-•*]\s*/, '').trim())
            .filter(line => line.length > 0 && line.endsWith('?'));
          
          questions.push(...extractedQuestions);
          if (questions.length >= 3) break;
        }
      }
      
      // Generate contextual questions to fill up to 3 total
      const keyTopics = this.extractKeyTopics(context);
      
      if (userType === 'patient') {
        // Patient-focused follow-ups pool
        const patientQuestions = [
          'What are the potential side effects I should watch for?',
          'When should I seek immediate medical attention?',
          'How long will recovery typically take?',
          'Are there any lifestyle changes I should make?',
          'What follow-up appointments will I need?',
          'Can you explain this in simpler terms?',
          'What are my treatment options?',
          'Are there any alternative treatments available?',
          'How will this affect my daily activities?',
          'What tests or examinations might be needed?'
        ];
        
        // Add topic-specific questions first
        if (context.toLowerCase().includes('medication') && questions.length < 3) {
          questions.push('How should I take this medication properly?');
        }
        if (context.toLowerCase().includes('surgery') && questions.length < 3) {
          questions.push('What are the risks and benefits of this procedure?');
        }
        if (context.toLowerCase().includes('diagnosis') && questions.length < 3) {
          questions.push('What does this diagnosis mean for my future health?');
        }
        
        // Fill remaining slots with general questions
        while (questions.length < 3) {
          const randomQ = patientQuestions[Math.floor(Math.random() * patientQuestions.length)];
          if (randomQ && !questions.includes(randomQ)) {
            questions.push(randomQ);
          }
        }
      } else {
        // Provider-focused follow-ups pool
        const providerQuestions = [
          'What are the differential diagnoses to consider?',
          'What evidence-based guidelines apply here?',
          'What are the contraindications to be aware of?',
          'What patient education materials are recommended?',
          'What are the latest research findings on this?',
          'What monitoring parameters should be tracked?',
          'What are the red flags to watch for?',
          'What specialty referrals might be appropriate?',
          'What is the recommended follow-up protocol?',
          'What are the billing and coding considerations?'
        ];
        
        // Add topic-specific questions first
        if (context.toLowerCase().includes('treatment') && questions.length < 3) {
          questions.push('What is the first-line treatment approach?');
        }
        if (context.toLowerCase().includes('lab') && questions.length < 3) {
          questions.push('What additional laboratory tests would be helpful?');
        }
        if (context.toLowerCase().includes('imaging') && questions.length < 3) {
          questions.push('What imaging modality would be most appropriate?');
        }
        
        // Fill remaining slots with general questions
        while (questions.length < 3) {
          const randomQ = providerQuestions[Math.floor(Math.random() * providerQuestions.length)];
          if (randomQ && !questions.includes(randomQ)) {
            questions.push(randomQ);
          }
        }
      }
      
      // Ensure we return exactly 3 unique questions
      return [...new Set(questions)].slice(0, 3);
      
    } catch (error) {
      logger.error('Error generating quick actions', error);
      // Return default questions on error
      if (userType === 'patient') {
        return [
          'Can you explain this in more detail?',
          'What should I do next?',
          'Are there any risks I should know about?'
        ];
      } else {
        return [
          'What are the clinical guidelines for this?',
          'What additional information would be helpful?',
          'What are the key considerations here?'
        ];
      }
    }
  }

  /**
   * Extract key topics from text for generating follow-up questions
   */
  private extractKeyTopics(text: string): string[] {
    const medicalTerms = [
      'diagnosis', 'treatment', 'medication', 'symptom', 'condition',
      'therapy', 'procedure', 'test', 'examination', 'prescription'
    ];
    
    const foundTopics = medicalTerms.filter(term => 
      text.toLowerCase().includes(term)
    );
    
    return foundTopics;
  }

  /**
   * Clean response text by removing follow-up questions section if present
   */
  cleanResponseText(text: string | any): string {
    // Ensure we have a string to work with
    if (typeof text !== 'string') {
      console.warn('cleanResponseText received non-string value:', text);
      return '';
    }
    
    // Common patterns for follow-up questions sections
    const patterns = [
      /\n*(?:Follow[- ]?up questions?|Questions? you might have|You might also ask|Consider asking|Related questions?):?[\s\S]*/i,
      /\n*(?:Would you like to know more about[\s\S]*)/i,
      /\n*(?:Some questions? to consider|Here are some questions?):?[\s\S]*/i,
      /\n*(?:Additional questions?|Further questions?):?[\s\S]*/i
    ];
    
    let cleanedText = text;
    for (const pattern of patterns) {
      cleanedText = cleanedText.replace(pattern, '');
    }
    
    return cleanedText.trim();
  }
  
  /**
   * Escape HTML characters to prevent rendering issues
   */
  escapeHtml(text: string): string {
    const htmlEntities: { [key: string]: string } = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return text.replace(/[<>&"']/g, char => htmlEntities[char] || char);
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export for backward compatibility
export default aiService;

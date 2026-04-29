import { aiService } from './aiService';
import logger from './logger';
import { UserType } from '../types';

/**
 * Simplified Medical Integration Service
 * Relies on AI's natural language understanding for medical filtering
 */
class MedicalIntegrationService {
  /**
   * Get AI response - simplified to just pass through to AI service
   * The AI handles medical filtering through its system prompt
   */
  async getEnhancedResponse(
    message: string,
    userType: UserType,
    isProactiveMode: boolean = false,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      // Simply pass through to AI service - let the AI handle medical filtering
      logger.info('Processing message through AI service');
      return await aiService.getResponse(
        message,
        userType,
        isProactiveMode,
        conversationHistory
      );
    } catch (error) {
      logger.error('AI response error:', error);
      throw new Error('Unable to generate response. Please try again.');
    }
  }

  /**
   * Stream response - simplified to just pass through to AI service
   */
  async *streamEnhancedResponse(
    message: string,
    userType: UserType,
    isProactiveMode: boolean = false,
    conversationHistory?: Array<{ role: string; content: string }>,
    abortController?: AbortController
  ): AsyncGenerator<string, void, unknown> {
    try {
      logger.info('Streaming message through AI service');
      
      // Simply use the standard AI service streaming
      const streamGenerator = aiService.streamResponse(
        message,
        userType,
        isProactiveMode,
        conversationHistory,
        abortController
      );
      
      for await (const chunk of streamGenerator) {
        if (abortController?.signal.aborted) {
          return;
        }
        yield chunk;
      }
    } catch (error) {
      logger.error('Streaming error:', error);
      yield 'Unable to generate response. Please try again.';
    }
  }

  /**
   * Check if medical assistant is available
   */
  isMedicalAssistantAvailable(): boolean {
    // Always available since we're using the AI service
    return true;
  }

  /**
   * Get medical query suggestions based on context
   */
  getMedicalSuggestions(context: string): string[] {
    const lowerContext = context.toLowerCase();
    
    if (lowerContext.includes('chest pain')) {
      return [
        'What are the red flags for chest pain?',
        'ACS protocol and management',
        'Chest pain differential diagnosis',
        'ECG interpretation for chest pain'
      ];
    }
    
    if (lowerContext.includes('fever')) {
      return [
        'Fever workup in adults',
        'Sepsis screening criteria',
        'Antipyretic dosing guidelines',
        'Fever red flags and disposition'
      ];
    }
    
    if (lowerContext.includes('medication') || lowerContext.includes('drug')) {
      return [
        'Drug interaction checker',
        'Dosing guidelines by indication',
        'Contraindications and warnings',
        'Side effect management'
      ];
    }
    
    // General medical suggestions
    return [
      'Clinical decision support',
      'Diagnostic workup guidance',
      'Treatment protocols',
      'Emergency management'
    ];
  }
}

// Export singleton instance
export const medicalIntegration = new MedicalIntegrationService();

// Export class for testing
export default MedicalIntegrationService;

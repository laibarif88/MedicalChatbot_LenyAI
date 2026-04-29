/**
 * Utility functions for generating conversation titles and preview text
 */

/**
 * Generates a meaningful conversation title based on the first user message
 * @param firstMessage - The first user message in the conversation
 * @returns A generated title or default fallback
 */
export const generateConversationTitle = (firstMessage: string): string => {
  if (!firstMessage || firstMessage.trim().length === 0) {
    return 'New Conversation';
  }

  const message = firstMessage.trim();
  
  // Medical-related keywords for health conversations
  const medicalKeywords = {
    symptoms: ['pain', 'headache', 'fever', 'cough', 'nausea', 'dizzy', 'tired', 'sick', 'hurt', 'ache'],
    conditions: ['diabetes', 'hypertension', 'asthma', 'allergies', 'depression', 'anxiety'],
    body_parts: ['head', 'chest', 'stomach', 'back', 'leg', 'arm', 'throat', 'eye', 'ear'],
    general: ['doctor', 'medication', 'prescription', 'treatment', 'diagnosis', 'health', 'medical']
  };

  // Check for medical keywords and generate appropriate titles
  const lowerMessage = message.toLowerCase();
  
  for (const [category, keywords] of Object.entries(medicalKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        switch (category) {
          case 'symptoms':
            return `Health Concern: ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
          case 'conditions':
            return `Medical Consultation: ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
          case 'body_parts':
            return `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Issue`;
          case 'general':
            return 'Medical Consultation';
        }
      }
    }
  }

  // Check for question patterns
  if (lowerMessage.startsWith('how') || lowerMessage.startsWith('what') || 
      lowerMessage.startsWith('why') || lowerMessage.startsWith('when') ||
      lowerMessage.startsWith('where') || lowerMessage.includes('?')) {
    return 'Health Question';
  }

  // Check for greeting patterns
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || 
      lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon')) {
    return 'Health Consultation';
  }

  // Generate title from first few words (max 4 words, 30 characters)
  const words = message.split(' ').slice(0, 4);
  let title = words.join(' ');
  
  if (title.length > 30) {
    title = title.substring(0, 27) + '...';
  }
  
  return title || 'New Conversation';
};

/**
 * Generates preview text from a message
 * @param message - The message to generate preview from
 * @param maxLength - Maximum length of preview (default: 50)
 * @returns Preview text
 */
export const generatePreviewText = (message: string, maxLength: number = 50): string => {
  if (!message || message.trim().length === 0) {
    return 'New conversation';
  }

  const cleanMessage = message.trim();
  
  if (cleanMessage.length <= maxLength) {
    return cleanMessage;
  }
  
  // Find the last complete word within the limit
  const truncated = cleanMessage.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.7) { // Only use word boundary if it's not too short
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};

/**
 * Updates conversation with generated title and preview
 * @param conversation - The conversation object to update
 * @param firstUserMessage - The first user message
 * @returns Updated conversation object
 */
export const updateConversationWithGeneratedTitle = (
  conversation: any, 
  firstUserMessage: string
): any => {
  return {
    ...conversation,
    title: generateConversationTitle(firstUserMessage),
    preview: generatePreviewText(firstUserMessage)
  };
};

/**
 * Checks if a message is from a user (not system or AI)
 * @param message - The message object
 * @returns True if message is from user
 */
export const isUserMessage = (message: any): boolean => {
  return message.role === 'user' || message.sender === 'user';
};

/**
 * Gets the first user message from a conversation
 * @param messages - Array of messages
 * @returns First user message or null
 */
export const getFirstUserMessage = (messages: any[]): string | null => {
  const firstUserMsg = messages.find(isUserMessage);
  return firstUserMsg ? firstUserMsg.content || firstUserMsg.text : null;
};
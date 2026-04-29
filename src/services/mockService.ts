import { Message } from '../types';
import { blogPosts } from '../data/blogData';

export const getBotResponse = async (userMessage: string): Promise<Message> => {
  // In a real application, you would initialize the Gemini client here and make an API call.
  // Example:
  // import { GoogleGenAI } from "@google/genai";
  // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: userMessage });
  // const botText = response.text;
  

  // Mock responses for UI demonstration
  const responses = [
    "Hello! I'm Leny. How can I help you today?",
    "I understand. To help me better understand, could you please provide more details about the symptoms?",
    "Thank you for sharing that information. I'm ready when you are to continue.",
    "Based on what you've described, I can provide some general information. However, please remember this is not a substitute for professional medical advice.",
    "I'm processing your request. One moment please."
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `bot-${Date.now()}`,
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }, 1200); // Simulate network delay
  });
};

export const getAiSummary = async (slug: string): Promise<string> => {
  const post = blogPosts.find(p => p.slug === slug);
  const summary = post?.aiSummary ?? "This article provides valuable insights for healthcare professionals.";

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(summary);
    }, 1500); // Simulate AI generation delay
  });
};

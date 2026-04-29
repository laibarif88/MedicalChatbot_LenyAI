// src/constants.ts

import { Participant } from '../types';

// Current user (will be dynamic in real app)
export const CURRENT_USER: Participant = {
  id: 'current-user',
  name: 'You',
  avatarUrl: '/avatars/default-user.png',
  role: 'patient', // This will be overridden by userType
};

export const CURRENT_USER_ID = 'current-user';

// System participant for system messages
export const SYSTEM_PARTICIPANT: Participant = {
  id: 'system',
  name: 'System',
  avatarUrl: '',
  role: 'ai_assistant',
};

// Medical specialties for expert panel
export const SPECIALTIES = [
  { name: 'Cardiology', color: '#E74C3C' },
  { name: 'Neurology', color: '#3498DB' },
  { name: 'Endocrinology', color: '#9B59B6' },
  { name: 'Infectious Disease', color: '#F39C12' },
  { name: 'Pulmonology', color: '#1ABC9C' },
  { name: 'Gastroenterology', color: '#E67E22' },
  { name: 'Rheumatology', color: '#16A085' },
  { name: 'Oncology', color: '#8E44AD' },
  { name: 'Nephrology', color: '#2980B9' },
  { name: 'Psychiatry', color: '#D35400' },
];

// Note templates
export const NOTE_TEMPLATES = {
  SOAP: {
    name: 'SOAP',
    content: `
      <h3>SOAP Note</h3>
      <h4>Subjective:</h4>
      <p>[Patient's chief complaint and history]</p>
      <h4>Objective:</h4>
      <p>[Physical exam findings and vital signs]</p>
      <h4>Assessment:</h4>
      <p>[Clinical impression and diagnosis]</p>
      <h4>Plan:</h4>
      <p>[Treatment plan and follow-up]</p>
    `
  },
  HnP: {
    name: 'H&P',
    content: `
      <h3>History & Physical</h3>
      <h4>Chief Complaint:</h4>
      <p>[Primary reason for visit]</p>
      <h4>History of Present Illness:</h4>
      <p>[Detailed history]</p>
      <h4>Past Medical History:</h4>
      <p>[Previous conditions]</p>
      <h4>Physical Examination:</h4>
      <p>[Exam findings]</p>
      <h4>Assessment & Plan:</h4>
      <p>[Clinical assessment and treatment plan]</p>
    `
  },
  Progress: {
    name: 'Progress',
    content: `
      <h3>Progress Note</h3>
      <h4>Date/Time:</h4>
      <p>[Current date and time]</p>
      <h4>Interval History:</h4>
      <p>[Changes since last visit]</p>
      <h4>Current Status:</h4>
      <p>[Current condition]</p>
      <h4>Plan:</h4>
      <p>[Ongoing treatment plan]</p>
    `
  }
};

// Default note content for new notes
export const DEFAULT_NOTE_CONTENT = '<h3>New Clinical Note</h3><p>Start typing here...</p>';

// API endpoints
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  NOTES: '/api/notes',
  ANALYSIS: '/api/analysis',
};

// Local storage keys
export const STORAGE_KEYS = {
  USER_SESSION: 'userSession',
  CHAT_HISTORY: 'chatHistory',
  NOTES: 'savedNotes',
  PREFERENCES: 'userPreferences',
};

// Empty conversations list (kept for backward compatibility)
export const CONVERSATIONS: any[] = [];

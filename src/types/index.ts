import { SymptomForm } from "./contextType";

export type UserType = 'patient' | 'provider';

export type ParticipantRole = 'patient' | 'provider' | 'family_member' | 'ai_assistant';

export interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
  role: ParticipantRole;
  specialty?: string; // For providers or AI
}

export type QuickActionType = 'copy' | 'share' | 'signin';

export interface QuickAction {
  label: string;
  type: QuickActionType;
}

export interface Message {
  id: string;
  senderId: string; // Replaces 'type'
  text: string;
  followUps?: string[];
  quickActions?: QuickAction[];
  timestamp: string;
  isSystemMessage?: boolean; // To identify system messages
  isFollowUpQuestion?: boolean;
  formData?: SymptomForm;
}

export interface Conversation {
  id:string;
  title: string;
  preview: string;
  timestamp: string;
  participants: Participant[]; // Replaces 'agent'
  messages: Message[];
  isNote?: boolean; // To distinguish notes from conversations
  notesTitle?: string; // Title specifically for notes
  notesContent?: string; // HTML content for notes
}

export interface DifferentialDiagnosis {
  condition: string;
  confidence: number;
  rationale?: string;
}

export interface RecommendedStep {
  title: string;
  details: string;
}

export interface ProactiveAnalysis {
  differentialDiagnosis: DifferentialDiagnosis[];
  recommendedLabsAndImaging: RecommendedStep[];
  clinicalPearls: RecommendedStep[];
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  userType: UserType;
  country?: string;
  institution?: string;
  specialty?: string;
  signupDate: string;
  status: 'Active' | 'Suspended';
}

// Medical Assistant Types
export type MedicalQueryType = 'symptoms' | 'medications' | 'procedures' | 'labs' | 'general';

export type OutputFormat = 'html' | 'markdown' | 'text' | 'whatsapp' | 'json';

export interface MedicalQuery {
  query: string;
  userType: UserType;
  conversationHistory?: Array<{
    role: string;
    content: string;
  }>;
}

export interface MedicalResponse {
  success: boolean;
  response?: string;
  error?: string;
  metadata?: {
    queryType: MedicalQueryType;
    hasValidFormat: boolean;
    responseTime: number;
  };
}

export interface FormattedMedicalResponse {
  content: string;
  format: OutputFormat;
  metadata: {
    originalLength: number;
    formattedLength: number;
    hasStructure: boolean;
    timestamp: number;
  };
}

export interface MedicalAnalytics {
  query: string;
  responseTime: number;
  hasFormat: boolean;
  length: number;
  queryType: string;
  timestamp: number;
  userType: UserType;
  cacheHit: boolean;
}

export interface MedicalPerformanceMetrics {
  averageResponseTime: number;
  cacheHitRate: number;
  formatSuccessRate: number;
  queryTypeDistribution: Record<string, number>;
}

export interface MedicalSection {
  type: string;
  title?: string;
  name?: string;
  content?: string;
  items?: Array<{
    condition?: string;
    details?: string;
    severity?: string;
    treatment?: string;
    criteria?: string;
    action?: string;
  }>;
}

export interface StructuredMedicalResponse {
  type: 'medical_response';
  queryType: MedicalQueryType;
  timestamp: number;
  sections: MedicalSection[];
}

// types/contextType.ts
export interface MedicalDetectionResult {
  isMedical: boolean;
  confidence: number;
  symptoms: string[];
  symptomDetails: SymptomDetail[];
  missingInformation: string[];
  contextType: 'symptom' | 'medication' | 'condition' | 'procedure' | 'general' | 'non-medical';
}

export interface SymptomDetail {
  name: string; 
  duration?: string;
  severity?: string;
  location?: string;
  character?: string;
  timing?: string;
  confidence?: number;
  completeness?: number;
  attributes?: {
    duration?: string;
    severity?: string;
    location?: string;
    character?: string;
    timing?: string;
  };
}

export interface SymptomData {
  symptoms: SymptomDetail[];
  duration?: string;
  severity?: string;
  locations: string[];
  timing?: string;
  triggers?: string[];
  alleviatingFactors?: string[];
  associatedSymptoms: string[];
  character?: string;
  onset?: string;
  course?: string;
  context?: string;
}

export interface ContextProcessingResult {
  shouldProceedToAI: boolean;
  enhancedMessage?: string;
  followUpQuestions?: string[];
  currentContext?: any;
  isMedical?: boolean;
}


// form - new interfaces
export interface FormField {
  type: 'text' | 'select' | 'scale' | 'multi_select' | 'duration' | 'location_specific';
  label: string;
  field: string;
  options?: string[];
  required: boolean;
  placeholder?: string;
  symptomSpecific?: boolean;
}

export interface SymptomForm {
  id: string;
  title: string;
  description: string;
  descriptionImages?: {
    url: string;
    alt?: string;
    caption?: string;
  }[];
  fields: FormField[];
  submitted: boolean;
  submittedData?: Record<string, any>;
  symptomContext?: string[];
}

export interface FormProcessingResult {
  shouldProceedToAI: boolean;
  enhancedMessage?: string;
  formData?: SymptomForm;
  isMedical?: boolean;
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, getUserProfile } from '../services/firestoreService';
import BasicSettingsStep from '../components/preferences/BasicSettingsStep';
import CommunicationStep from '../components/preferences/CommunicationStep';
import PersonalizationStep from '../components/preferences/PersonalizationStep';

interface PreferencesFlowProps {
  onClose: () => void;
}

type CommunicationStyle = 'supportive' | 'professional' | 'conversational' | 'direct';
type InfoPreference = 'data-driven' | 'detailed' | 'summaries' | 'visual';
type Theme = 'light' | 'dark' | 'auto';

interface UserPreferences {
  theme?: Theme;
  language?: string;
  communicationStyle?: CommunicationStyle;
  infoPreference?: InfoPreference;
  healthInterests?: string[];
  patientGoals?: string[];
  providerFocus?: string[];
  notifications?: {
    email: boolean;
    push: boolean;
    reminders: boolean;
  };
}

type PreferenceStep = 'basic' | 'communication' | 'personalization';

const PreferencesFlow: React.FC<PreferencesFlowProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<PreferenceStep>('basic');
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    communicationStyle: 'conversational',
    infoPreference: 'detailed',
    healthInterests: [],
    patientGoals: [],
    providerFocus: [],
    notifications: {
      email: true,
      push: true,
      reminders: true
    }
  });
  
  const [userType, setUserType] = useState<'patient' | 'provider'>('patient');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const steps: { key: PreferenceStep; title: string; description: string }[] = [
    { key: 'basic', title: 'Basic Settings', description: 'Theme and appearance preferences' },
    { key: 'communication', title: 'Communication & Content', description: 'How you prefer to receive information' },
    { key: 'personalization', title: 'Personalization', description: 'Your interests, goals, and notifications' }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) return;
      
      try {
        const userProfile = await getUserProfile(user.uid);
      setUserType((userProfile?.userType as 'patient' | 'provider') || 'patient');
        
        const currentPrefs = (userProfile?.preferences as any) || {};
        setPreferences({
          theme: currentPrefs.theme || 'light',
          language: currentPrefs.language || 'en',
          communicationStyle: currentPrefs.communicationStyle || 'conversational',
          infoPreference: currentPrefs.infoPreference || 'detailed',
          healthInterests: currentPrefs.healthInterests || [],
          patientGoals: currentPrefs.patientGoals || [],
          providerFocus: currentPrefs.providerFocus || [],
          notifications: {
            email: currentPrefs.notifications?.email ?? true,
            push: currentPrefs.notifications?.push ?? true,
            reminders: currentPrefs.notifications?.reminders ?? true
          }
        });
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setError('Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid || isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await updateUserProfile(user.uid, {
          preferences: preferences as any
        });

      setSuccessMessage('Preferences updated successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      const nextIndex = currentStepIndex + 1;
      if (steps[nextIndex]) {
        setCurrentStep(steps[nextIndex].key);
      }
    } else {
      handleSave();
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevIndex = currentStepIndex - 1;
      if (steps[prevIndex]) {
        setCurrentStep(steps[prevIndex].key);
      }
    }
  };

  const handleStepClick = (stepKey: PreferenceStep) => {
    setCurrentStep(stepKey);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D97941]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Steps */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#2D241F]">Preferences</h1>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Step Navigation */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center flex-1">
                <button
                  onClick={() => handleStepClick(step.key)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    currentStep === step.key
                      ? 'bg-[#D97941] text-white'
                      : index < currentStepIndex
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === step.key
                      ? 'bg-white text-[#D97941]'
                      : index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs opacity-75">{step.description}</p>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStepIndex ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0">
          <div className="h-full overflow-y-auto">
            <div className="p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                  <p className="text-sm">{successMessage}</p>
                </div>
              )}

              {/* Step Content */}
              <div>
                {currentStep === 'basic' && (
                  <BasicSettingsStep
                    preferences={preferences}
                    onPreferencesChange={(newPrefs) => setPreferences(prev => ({ ...prev, ...newPrefs }))}
                  />
                )}
                {currentStep === 'communication' && (
                  <CommunicationStep
                    preferences={preferences}
                    onPreferencesChange={(newPrefs) => setPreferences(prev => ({ ...prev, ...newPrefs }))}
                  />
                )}
                {currentStep === 'personalization' && (
                  <PersonalizationStep
                    preferences={preferences}
                    userType={userType}
                    onPreferencesChange={(newPrefs) => setPreferences(prev => ({ ...prev, ...newPrefs }))}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Navigation */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                isFirstStep
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>

            <div className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {steps.length}
            </div>

            <button
              onClick={handleNext}
              disabled={isSaving}
              className={`px-6 py-2 bg-[#D97941] text-white rounded-xl font-semibold transition-all ${
                isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#C97A20] hover:scale-[1.02]'
              }`}
            >
              {isSaving ? 'Saving...' : isLastStep ? 'Save Preferences' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesFlow;

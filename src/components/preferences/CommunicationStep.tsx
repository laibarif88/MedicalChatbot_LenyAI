import React from 'react';

type CommunicationStyle = 'supportive' | 'professional' | 'conversational' | 'direct';
type InfoPreference = 'data-driven' | 'detailed' | 'summaries' | 'visual';

interface UserPreferences {
  communicationStyle?: CommunicationStyle;
  infoPreference?: InfoPreference;
}

interface CommunicationStepProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: Partial<UserPreferences>) => void;
}

const communicationStyles: { value: CommunicationStyle; label: string; description: string; icon: string }[] = [
  { 
    value: 'supportive', 
    label: 'Supportive & Empathetic', 
    description: 'Warm, encouraging responses that acknowledge emotions and provide reassurance',
    icon: '🤗'
  },
  { 
    value: 'professional', 
    label: 'Professional & Clinical', 
    description: 'Medical terminology and formal language similar to healthcare settings',
    icon: '👩‍⚕️'
  },
  { 
    value: 'conversational', 
    label: 'Conversational & Friendly', 
    description: 'Easy-to-understand language with a casual, approachable tone',
    icon: '💬'
  },
  { 
    value: 'direct', 
    label: 'Direct & Concise', 
    description: 'Straight-to-the-point answers without extra explanations',
    icon: '🎯'
  }
];

const infoPreferences: { value: InfoPreference; label: string; description: string; icon: string }[] = [
  { 
    value: 'data-driven', 
    label: 'Data-Driven', 
    description: 'Include statistics, research findings, and numerical data',
    icon: '📊'
  },
  { 
    value: 'detailed', 
    label: 'Detailed Explanations', 
    description: 'Comprehensive information covering all aspects and background',
    icon: '📚'
  },
  { 
    value: 'summaries', 
    label: 'Quick Summaries', 
    description: 'Key points and essential information in concise format',
    icon: '⚡'
  },
  { 
    value: 'visual', 
    label: 'Visual Aids', 
    description: 'Prefer diagrams, charts, and visual explanations when possible',
    icon: '🎨'
  }
];

const CommunicationStep: React.FC<CommunicationStepProps> = ({ 
  preferences, 
  onPreferencesChange 
}) => {
  const handleCommunicationStyleChange = (communicationStyle: CommunicationStyle) => {
    onPreferencesChange({ communicationStyle });
  };

  const handleInfoPreferenceChange = (infoPreference: InfoPreference) => {
    onPreferencesChange({ infoPreference });
  };

  return (
    <div className="space-y-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Communication & Content</h2>
        <p className="text-gray-600">Tell us how you prefer to receive and interact with information</p>
      </div>

      {/* Communication Style */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Communication Style</h3>
        <p className="text-gray-600 mb-6 text-sm">How would you like Leny to communicate with you?</p>
        <div className="space-y-4">
          {communicationStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => handleCommunicationStyleChange(style.value)}
              className={`w-full p-5 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                preferences.communicationStyle === style.value
                  ? 'border-[#D97941] bg-orange-50 ring-2 ring-[#D97941] ring-opacity-20 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{style.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 mb-1">{style.label}</p>
                  <p className="text-sm text-gray-600">{style.description}</p>
                </div>
                {preferences.communicationStyle === style.value && (
                  <div className="text-[#D97941]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Information Preference */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Information Preference</h3>
        <p className="text-gray-600 mb-6 text-sm">How do you prefer to receive medical information?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoPreferences.map((pref) => (
            <button
              key={pref.value}
              onClick={() => handleInfoPreferenceChange(pref.value)}
              className={`p-5 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                preferences.infoPreference === pref.value
                  ? 'border-[#D97941] bg-orange-50 ring-2 ring-[#D97941] ring-opacity-20 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{pref.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 mb-1">{pref.label}</p>
                  <p className="text-sm text-gray-600">{pref.description}</p>
                </div>
                {preferences.infoPreference === pref.value && (
                  <div className="text-[#D97941]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Preview</h3>
        <p className="text-gray-600 text-sm mb-4">
          Based on your selections, here's how Leny might respond to a question about managing diabetes:
        </p>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#D97941] rounded-full flex items-center justify-center text-white text-sm font-semibold">
              L
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                {preferences.communicationStyle === 'supportive' && 
                  "I understand managing diabetes can feel overwhelming. Let me help you with some gentle, encouraging guidance..."}
                {preferences.communicationStyle === 'professional' && 
                  "Diabetes mellitus management requires adherence to evidence-based protocols including glycemic monitoring..."}
                {preferences.communicationStyle === 'conversational' && 
                  "Great question! Managing diabetes is definitely doable with the right approach. Let me break this down for you..."}
                {preferences.communicationStyle === 'direct' && 
                  "Key diabetes management steps: 1) Monitor blood sugar 2) Take medications as prescribed 3) Follow diet plan..."}
                {!preferences.communicationStyle && 
                  "Select a communication style above to see a preview of how Leny will respond to your questions."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationStep;
import React from 'react';

interface UserPreferences {
  healthInterests?: string[];
  patientGoals?: string[];
  providerFocus?: string[];
  notifications?: {
    email: boolean;
    push: boolean;
    reminders: boolean;
  };
}

interface PersonalizationStepProps {
  preferences: UserPreferences;
  userType: 'patient' | 'provider';
  onPreferencesChange: (preferences: Partial<UserPreferences>) => void;
}

const healthInterestOptions = [
  { value: 'Preventive Care', icon: '🛡️' },
  { value: 'Chronic Disease Management', icon: '📋' },
  { value: 'Mental Health', icon: '🧠' },
  { value: 'Nutrition & Diet', icon: '🥗' },
  { value: 'Exercise & Fitness', icon: '💪' },
  { value: 'Women\'s Health', icon: '👩' },
  { value: 'Men\'s Health', icon: '👨' },
  { value: 'Pediatric Health', icon: '👶' },
  { value: 'Senior Health', icon: '👴' },
  { value: 'Alternative Medicine', icon: '🌿' },
  { value: 'Medication Management', icon: '💊' },
  { value: 'Surgery & Recovery', icon: '🏥' },
  { value: 'Emergency Care', icon: '🚨' },
  { value: 'Specialist Care', icon: '👨‍⚕️' },
  { value: 'Telemedicine', icon: '💻' },
  { value: 'Healthcare Technology', icon: '🔬' }
];

const patientGoalOptions = [
  { value: 'Understand my condition better', icon: '🎓' },
  { value: 'Find treatment options', icon: '🔍' },
  { value: 'Manage symptoms', icon: '⚖️' },
  { value: 'Improve overall health', icon: '📈' },
  { value: 'Prepare for appointments', icon: '📅' },
  { value: 'Get second opinions', icon: '👥' },
  { value: 'Learn about medications', icon: '💊' },
  { value: 'Find specialists', icon: '🎯' },
  { value: 'Understand test results', icon: '📊' },
  { value: 'Manage chronic conditions', icon: '🔄' },
  { value: 'Preventive care guidance', icon: '🛡️' },
  { value: 'Lifestyle modifications', icon: '🌱' }
];

const providerFocusOptions = [
  { value: 'Patient education resources', icon: '📚' },
  { value: 'Clinical decision support', icon: '🎯' },
  { value: 'Treatment guidelines', icon: '📋' },
  { value: 'Diagnostic assistance', icon: '🔍' },
  { value: 'Drug interactions', icon: '⚠️' },
  { value: 'Continuing education', icon: '🎓' },
  { value: 'Research updates', icon: '🔬' },
  { value: 'Billing & coding', icon: '💰' },
  { value: 'Patient communication', icon: '💬' },
  { value: 'Quality improvement', icon: '📈' },
  { value: 'Care coordination', icon: '🤝' },
  { value: 'Risk assessment', icon: '⚖️' }
];

const PersonalizationStep: React.FC<PersonalizationStepProps> = ({ 
  preferences, 
  userType,
  onPreferencesChange 
}) => {
  const handleArrayToggle = (field: 'healthInterests' | 'patientGoals' | 'providerFocus', value: string) => {
    const current = preferences[field] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    onPreferencesChange({ [field]: updated });
  };

  const handleNotificationChange = (type: 'email' | 'push' | 'reminders', value: boolean) => {
    onPreferencesChange({
      notifications: {
        ...preferences.notifications!,
        [type]: value
      }
    });
  };

  return (
    <div className="space-y-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Personalization</h2>
        <p className="text-gray-600">Help us tailor your experience to your specific needs and interests</p>
      </div>

      {/* Health Interests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Topics of Interest</h3>
        <p className="text-gray-600 mb-6 text-sm">Select topics you'd like to learn more about (optional):</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {healthInterestOptions.map((interest) => (
            <button
              key={interest.value}
              onClick={() => handleArrayToggle('healthInterests', interest.value)}
              className={`p-4 rounded-lg border text-sm transition-all hover:scale-[1.02] ${
                preferences.healthInterests?.includes(interest.value)
                  ? 'border-[#D97941] bg-orange-50 text-[#D97941] shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-2">{interest.icon}</div>
              <div className="font-medium text-xs leading-tight">{interest.value}</div>
            </button>
          ))}
        </div>
      </div>

      {/* User-specific goals/focus */}
      {userType === 'patient' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Goals</h3>
          <p className="text-gray-600 mb-6 text-sm">What are you hoping to achieve with Leny?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {patientGoalOptions.map((goal) => (
              <button
                key={goal.value}
                onClick={() => handleArrayToggle('patientGoals', goal.value)}
                className={`p-4 rounded-lg border text-sm text-left transition-all hover:scale-[1.01] flex items-center gap-3 ${
                  preferences.patientGoals?.includes(goal.value)
                    ? 'border-[#D97941] bg-orange-50 text-[#D97941] shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{goal.icon}</span>
                <span className="font-medium">{goal.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {userType === 'provider' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Professional Focus</h3>
          <p className="text-gray-600 mb-6 text-sm">What areas of healthcare support are most relevant to your practice?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {providerFocusOptions.map((focus) => (
              <button
                key={focus.value}
                onClick={() => handleArrayToggle('providerFocus', focus.value)}
                className={`p-4 rounded-lg border text-sm text-left transition-all hover:scale-[1.01] flex items-center gap-3 ${
                  preferences.providerFocus?.includes(focus.value)
                    ? 'border-[#D97941] bg-orange-50 text-[#D97941] shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{focus.icon}</span>
                <span className="font-medium">{focus.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
        <p className="text-gray-600 mb-6 text-sm">Choose how you'd like to stay informed</p>
        <div className="space-y-4">
          <label className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={preferences.notifications?.email || false}
              onChange={(e) => handleNotificationChange('email', e.target.checked)}
              className="w-5 h-5 text-[#D97941] border-gray-300 rounded focus:ring-[#D97941] focus:ring-2"
            />
            <div className="text-2xl">📧</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates and health tips via email</p>
            </div>
          </label>

          <label className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={preferences.notifications?.push || false}
              onChange={(e) => handleNotificationChange('push', e.target.checked)}
              className="w-5 h-5 text-[#D97941] border-gray-300 rounded focus:ring-[#D97941] focus:ring-2"
            />
            <div className="text-2xl">🔔</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Push Notifications</p>
              <p className="text-sm text-gray-600">Get notified about important updates</p>
            </div>
          </label>

          <label className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={preferences.notifications?.reminders || false}
              onChange={(e) => handleNotificationChange('reminders', e.target.checked)}
              className="w-5 h-5 text-[#D97941] border-gray-300 rounded focus:ring-[#D97941] focus:ring-2"
            />
            <div className="text-2xl">⏰</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Health Reminders</p>
              <p className="text-sm text-gray-600">Reminders for appointments and medications</p>
            </div>
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Personalization Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-1">Health Interests</p>
            <p className="text-gray-600">
              {preferences.healthInterests?.length || 0} topics selected
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">
              {userType === 'patient' ? 'Goals' : 'Focus Areas'}
            </p>
            <p className="text-gray-600">
              {(userType === 'patient' ? preferences.patientGoals?.length : preferences.providerFocus?.length) || 0} selected
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Notifications</p>
            <p className="text-gray-600">
              {Object.values(preferences.notifications || {}).filter(Boolean).length} enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizationStep;
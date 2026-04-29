import React from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface UserPreferences {
  theme?: Theme;
  language?: string;
}

interface BasicSettingsStepProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: Partial<UserPreferences>) => void;
}

const BasicSettingsStep: React.FC<BasicSettingsStepProps> = ({ 
  preferences, 
  onPreferencesChange 
}) => {
  const handleThemeChange = (theme: Theme) => {
    onPreferencesChange({ theme });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Basic Settings</h2>
        <p className="text-gray-600">Customize your app appearance and basic preferences</p>
      </div>

      {/* Theme Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Appearance Theme</h3>
        <p className="text-gray-600 mb-6 text-sm">Choose how you'd like the app to look</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['light', 'dark', 'auto'] as Theme[]).map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={`p-6 rounded-xl border text-center transition-all hover:scale-[1.02] ${
                preferences.theme === theme
                  ? 'border-[#D97941] bg-orange-50 ring-2 ring-[#D97941] ring-opacity-20 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <div className="text-4xl mb-3">
                {theme === 'light' && '☀️'}
                {theme === 'dark' && '🌙'}
                {theme === 'auto' && '🔄'}
              </div>
              <p className="font-semibold text-base capitalize mb-1">{theme}</p>
              <p className="text-sm text-gray-500">
                {theme === 'light' && 'Bright and clean interface'}
                {theme === 'dark' && 'Easy on the eyes in low light'}
                {theme === 'auto' && 'Matches your system preference'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Language Preference */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Language</h3>
        <p className="text-gray-600 mb-6 text-sm">Select your preferred language for the interface</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
          ].map((language) => (
            <button
              key={language.code}
              onClick={() => onPreferencesChange({ language: language.code })}
              className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                preferences.language === language.code
                  ? 'border-[#D97941] bg-orange-50 ring-2 ring-[#D97941] ring-opacity-20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{language.flag}</span>
              <div>
                <p className="font-medium text-gray-800">{language.name}</p>
                <p className="text-sm text-gray-500">{language.code.toUpperCase()}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Settings Placeholder */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">More Settings</h3>
        <p className="text-gray-600 text-sm mb-4">
          Additional customization options will be available in future updates.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Font size, accessibility options, and more coming soon</span>
        </div>
      </div>
    </div>
  );
};

export default BasicSettingsStep;
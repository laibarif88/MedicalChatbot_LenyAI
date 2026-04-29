import React, { useState, useMemo } from 'react';
import { UserType } from '../types';
import { updateUserProfile } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

interface ProfileCompletionScreenProps {
  onProfileComplete: (type: UserType) => void;
  onClose: () => void;
}

// Modern Apple/Google style icons
const GlobeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3s-4.5 4.03-4.5 9 2.015 9 4.5 9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.485 0 4.5 4.03 4.5 9S14.485 21 12 21s-4.5-4.03-4.5-9S9.515 3 12 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
  </svg>
);

const BuildingIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const AcademicCapIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

// Tag component for selected items
const Tag: React.FC<{ 
  text: string; 
  onRemove: () => void; 
}> = ({ text, onRemove }) => (
  <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
    <span>{text}</span>
    <button
      type="button"
      onClick={onRemove}
      className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
    >
      <XIcon className="w-3 h-3" />
    </button>
  </div>
);

// Multi-select input component
const MultiSelectInput: React.FC<{
  icon: React.ReactNode;
  placeholder: string;
  selectedItems: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  maxItems: number;
  suggestions?: string[];
}> = ({ icon, placeholder, selectedItems, onAdd, onRemove, maxItems, suggestions = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedItems.includes(suggestion)
  );

  const handleAdd = (item: string) => {
    if (item.trim() && selectedItems.length < maxItems && !selectedItems.includes(item.trim())) {
      onAdd(item.trim());
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        {icon}
      </div>
      
      <div className="w-full min-h-[42px] pl-10 pr-3 py-2 border border-gray-300 rounded-2xl focus-within:ring-2 focus-within:ring-[#D97941] transition bg-white">
        <div className="flex flex-wrap gap-2 items-center">
          {selectedItems.map((item, index) => (
            <Tag key={index} text={item} onRemove={() => onRemove(item)} />
          ))}
          
          {selectedItems.length < maxItems && (
            <input
              type="text"
              placeholder={selectedItems.length === 0 ? placeholder : ''}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
            />
          )}
        </div>
      </div>

      {showSuggestions && inputValue && filteredSuggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleAdd(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {selectedItems.length >= maxItems && (
        <div className="text-xs text-gray-500 mt-1">
          Maximum {maxItems} items selected
        </div>
      )}
    </div>
  );
};

const SelectField: React.FC<{ 
  icon: React.ReactNode; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; 
  children: React.ReactNode;
}> = ({ icon, value, onChange, children }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
      {icon}
    </div>
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
    </div>
    <select
      value={value}
      onChange={onChange}
      required
      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97941] transition appearance-none bg-white"
    >
      {children}
    </select>
  </div>
);

const InputField: React.FC<{ 
  icon: React.ReactNode; 
  type: string; 
  placeholder: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ icon, type, placeholder, value, onChange }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97941] transition"
    />
  </div>
);

const ProfileCompletionScreen: React.FC<ProfileCompletionScreenProps> = ({ 
  onProfileComplete, 
  onClose 
}) => {
  const { user } = useAuth();
  const [userType, setUserType] = useState<UserType>('patient');
  const [country, setCountry] = useState('');
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [npi, setNpi] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Complete list of all countries with US first
  const countries = [
    'United States',
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen',
    'Zambia', 'Zimbabwe'
  ];

  // Common medical institutions
  const institutionSuggestions = [
    'Mayo Clinic', 'Cleveland Clinic', 'Johns Hopkins Hospital', 'Massachusetts General Hospital',
    'UCLA Medical Center', 'Stanford Health Care', 'Mount Sinai Health System', 'NYU Langone Health',
    'Kaiser Permanente', 'Cedars-Sinai Medical Center', 'Houston Methodist', 'UCSF Medical Center',
    'University of Michigan Health', 'Duke University Hospital', 'Vanderbilt University Medical Center',
    'Northwestern Medicine', 'University of Pennsylvania Health System', 'Yale New Haven Health',
    'Emory Healthcare', 'University of Washington Medical Center'
  ];

  // Common medical specialties
  const specialtySuggestions = [
    'Internal Medicine', 'Family Medicine', 'Pediatrics', 'Cardiology', 'Dermatology',
    'Emergency Medicine', 'Anesthesiology', 'Radiology', 'Pathology', 'Surgery',
    'Orthopedic Surgery', 'Neurology', 'Psychiatry', 'Obstetrics and Gynecology',
    'Ophthalmology', 'Otolaryngology', 'Urology', 'Gastroenterology', 'Pulmonology',
    'Endocrinology', 'Rheumatology', 'Hematology', 'Oncology', 'Infectious Disease',
    'Nephrology', 'Allergy and Immunology', 'Physical Medicine and Rehabilitation',
    'Plastic Surgery', 'Neurosurgery', 'Thoracic Surgery'
  ];

  const addInstitution = (institution: string) => {
    if (institutions.length < 3 && !institutions.includes(institution)) {
      setInstitutions([...institutions, institution]);
    }
  };

  const removeInstitution = (institution: string) => {
    setInstitutions(institutions.filter(i => i !== institution));
  };

  const addSpecialty = (specialty: string) => {
    if (specialties.length < 3 && !specialties.includes(specialty)) {
      setSpecialties([...specialties, specialty]);
    }
  };

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty));
  };

  const isFormValid = useMemo(() => {
    const hasCountry = country.trim() !== '';
    
    if (userType === 'patient') {
      return hasCountry;
    } else {
      return hasCountry && institutions.length > 0 && specialties.length > 0 && npi.trim() !== '';
    }
  }, [country, institutions, specialties, npi, userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Update user profile with additional information
      const profileUpdates: any = {
        country: country,
        userType: userType,
        profileComplete: true,
        preferences: {
          theme: 'light',
          language: 'en'
        }
      };

      // Add provider-specific information
      if (userType === 'provider') {
        profileUpdates.institutions = institutions;
        profileUpdates.specialties = specialties;
        profileUpdates.npi = npi;
      }

      await updateUserProfile(user.uid, profileUpdates);

      // Success - close modal and notify parent
      onProfileComplete(userType);
    } catch (error: any) {
      setError(error.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" 
      style={{ animationDuration: '200ms' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-slide-in-right max-h-[90vh] overflow-y-auto"
        style={{ animationDuration: '300ms' }}
        onClick={e => e.stopPropagation()}
      >
        <h1 className="text-2xl font-bold text-center text-[#2D241F] mb-2">Complete Your Profile</h1>
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">Tell us a bit more about yourself to personalize your experience.</p>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Almost done! Just a few more details
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setUserType('patient')}
            className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-all ${userType === 'patient' ? 'bg-white shadow text-[#C97A20]' : 'text-gray-500'}`}
          >
            I'm a Patient
          </button>
          <button
            onClick={() => setUserType('provider')}
            className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-all ${userType === 'provider' ? 'bg-white shadow text-[#C97A20]' : 'text-gray-500'}`}
          >
            I'm a Provider
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField 
            icon={<GlobeIcon className="w-5 h-5 text-gray-400" />}
            value={country} 
            onChange={e => setCountry(e.target.value)}
          >
            <option value="">Select Country</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </SelectField>
          
          {userType === 'provider' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institutions (up to 3)
                </label>
                <MultiSelectInput
                  icon={<BuildingIcon className="w-5 h-5 text-gray-400" />}
                  placeholder="Add institution or hospital"
                  selectedItems={institutions}
                  onAdd={addInstitution}
                  onRemove={removeInstitution}
                  maxItems={3}
                  suggestions={institutionSuggestions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Specialties (up to 3)
                </label>
                <MultiSelectInput
                  icon={<AcademicCapIcon className="w-5 h-5 text-gray-400" />}
                  placeholder="Add medical specialty"
                  selectedItems={specialties}
                  onAdd={addSpecialty}
                  onRemove={removeSpecialty}
                  maxItems={3}
                  suggestions={specialtySuggestions}
                />
              </div>

              <InputField 
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                }
                type="text" 
                placeholder="NPI Number" 
                value={npi} 
                onChange={e => setNpi(e.target.value)} 
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full bg-[#D97941] text-white py-3 px-6 rounded-full font-semibold border-none cursor-pointer transition-all duration-300 ease-in-out shadow-md text-base ${isFormValid && !isLoading ? 'hover:shadow-lg hover:scale-105 active:scale-95' : 'opacity-50 cursor-not-allowed'}`}
          >
            {isLoading ? 'Completing Profile...' : 'Complete Profile'}
          </button>
        </form>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          This information helps us provide you with personalized medical insights and features.
        </p>
      </div>
    </div>
  );
};

export default ProfileCompletionScreen;

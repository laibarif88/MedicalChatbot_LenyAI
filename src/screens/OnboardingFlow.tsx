import React, { useState, useEffect, useMemo } from 'react';
import { UserType } from '../types';
import { UserIcon, MailIcon, LockClosedIcon, IdentificationIcon, BriefcaseIcon } from '../components/chat/Icons';
import { signUpWithEmail, signInWithGoogle, sendVerificationEmail, checkEmailVerification } from '../services/authService';
import { updateUserProfile } from '../services/firestoreService';
import { migrateGuestToUser, hasGuestDataToMigrate, getMigrationPreview } from '../services/migrationService';
import { useAuth } from '../contexts/AuthContext';
import AutocompleteField from '../components/forms/AutocompleteField';
import { medicalInstitutions, medicalSpecialties } from '../data/medicalData';
import { medicalInstitutionService, MedicalInstitution } from '../services/medicalInstitutionService';

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
      
      <div className="w-full min-h-[42px] pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-[#D97941] transition bg-white">
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

interface OnboardingFlowProps {
  onComplete: (type: UserType) => void;
  onClose: () => void;
  onNavigateToLogin: () => void;
  onNavigateToAdmin?: () => void;
  onGoogleSignUpSuccess?: (type: UserType, needsProfileCompletion: boolean) => void;
}

type OnboardingStep = 'signup' | 'email-verification' | 'profile-completion' | 'personalization' | 'complete';

type CommunicationStyle = 'supportive' | 'professional' | 'conversational' | 'direct';
type InfoPreference = 'data-driven' | 'detailed' | 'summaries' | 'visual';

interface PersonalizationData {
  communicationStyle: CommunicationStyle | undefined;
  healthInterests: string[];
  infoPreference: InfoPreference | undefined;
  patientGoals?: string[];
  providerFocus?: string[];
}

const InputField: React.FC<{ 
  icon: React.ReactNode; 
  type: string; 
  placeholder: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helperText?: string;
}> = ({ icon, type, placeholder, value, onChange, helperText }) => (
  <div>
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
        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97941] transition text-base"
      />
    </div>
    {helperText && (
      <p className="text-xs text-gray-500 mt-1 px-1">{helperText}</p>
    )}
  </div>
);

const SelectField: React.FC<{ 
  icon: React.ReactNode; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; 
  children: React.ReactNode;
  placeholder?: string;
}> = ({ icon, value, onChange, children, placeholder }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <select
      value={value}
      onChange={onChange}
      required
      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97941] transition appearance-none bg-white text-base"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  </div>
);

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ 
  onComplete, 
  onClose, 
  onNavigateToLogin, 
  onNavigateToAdmin 
}) => {
  const { user, login } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('signup');
  const [userType, setUserType] = useState<UserType>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [npi, setNpi] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  
  // Profile completion state
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [institution, setInstitution] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  
  // Email verification state
  const [verificationCheckInterval, setVerificationCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Personalization state
  const [personalization, setPersonalization] = useState<PersonalizationData>({
    communicationStyle: undefined,
    healthInterests: [],
    infoPreference: undefined,
    patientGoals: [],
    providerFocus: []
  });

  // Countries list with US first
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Sweden'
  ];

  // Handler functions for multi-select inputs
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

  // Check for guest data to migrate
  const guestUid = user?.uid;
  const hasGuestData = guestUid && user?.isGuest && hasGuestDataToMigrate(guestUid);
  const migrationPreview = hasGuestData && guestUid ? getMigrationPreview(guestUid) : null;

  // Email verification check
  useEffect(() => {
    if (currentStep === 'email-verification' && authUser) {
      const interval = setInterval(async () => {
        const isVerified = await checkEmailVerification(authUser);
        if (isVerified) {
          clearInterval(interval);
          
          // Update user profile with email verification status
          if (authUser?.uid) {
            try {
              await updateUserProfile(authUser.uid, {
                emailVerified: true
              });
            } catch (error) {
              console.error('Failed to update email verification status:', error);
            }
          }
          
          setCurrentStep('profile-completion');
        }
      }, 3000);
      
      setVerificationCheckInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [currentStep, authUser]);

  // Profile completion form validation
  const isProfileComplete = useMemo(() => {
    if (userType === 'patient') {
      return fullName.trim() !== '' && country !== '';
    } else {
      return fullName.trim() !== '' && country !== '' && 
             institutions.length > 0 && specialties.length > 0 && 
             npi.trim().length >= 10;
    }
  }, [fullName, country, institutions, specialties, npi, userType]);

  const isSignupFormValid = useMemo(() => {
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = password.length >= 8;
    
    if (userType === 'patient') {
      return isEmailValid && isPasswordValid;
    } else {
      return isEmailValid && isPasswordValid && npi.trim().length >= 10;
    }
  }, [email, password, npi, userType]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignupFormValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const newAuthUser = await signUpWithEmail(email, password, email.split('@')[0]);
      setAuthUser(newAuthUser);
      
      // Send verification email
      await sendVerificationEmail(newAuthUser);
      
      // Save basic info to profile
      if (newAuthUser?.uid) {
        await updateUserProfile(newAuthUser.uid, {
          email: email,
          userType: userType,
          profileComplete: false,
          preferences: {
            theme: 'light',
            language: 'en'
          }
        });
      }

      // Update AuthContext immediately
      login(newAuthUser);
      
      setCurrentStep('email-verification');
    } catch (error: any) {
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { user: googleAuthUser, isNewUser } = await signInWithGoogle();
      
      if (isNewUser) {
        // New user - set up for profile completion
        setAuthUser(googleAuthUser);
        setFullName(googleAuthUser.displayName || '');
        setEmail(googleAuthUser.email || '');
        
        // Update AuthContext immediately
        login(googleAuthUser);
        
        setCurrentStep('profile-completion');
      } else {
        // Existing user - complete immediately
        login(googleAuthUser);
        onComplete(userType);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignupStep = () => (
    <>
      <h1 className="text-2xl font-bold text-center text-[#2D241F] mb-2">
        Join Our Healthcare Community
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Free • Secure • Trusted by thousands
      </p>

      {/* User Type Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setUserType('patient')}
          className={`w-1/2 py-2.5 rounded-md text-sm font-semibold transition-all ${
            userType === 'patient' ? 'bg-white shadow text-[#C97A20]' : 'text-gray-500'
          }`}
        >
          I'm a Patient
        </button>
        <button
          onClick={() => setUserType('provider')}
          className={`w-1/2 py-2.5 rounded-md text-sm font-semibold transition-all ${
            userType === 'provider' ? 'bg-white shadow text-[#C97A20]' : 'text-gray-500'
          }`}
        >
          I'm a Provider
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}


      {/* Google Sign-In Button */}
      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-sm text-base ${
          !isLoading 
            ? 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] hover:border-gray-400' 
            : 'opacity-50 cursor-not-allowed'
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isLoading ? 'Signing up...' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <InputField 
          icon={<MailIcon />} 
          type="email" 
          placeholder="Email Address" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
        
        <InputField 
          icon={<LockClosedIcon />} 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          helperText="Minimum 8 characters"
        />

        {userType === 'provider' && (
          <InputField 
            icon={<IdentificationIcon />} 
            type="text" 
            placeholder="NPI Number (10 digits)" 
            value={npi} 
            onChange={e => setNpi(e.target.value)}
            helperText="Required for provider verification"
          />
        )}

        <button
          type="submit"
          disabled={!isSignupFormValid || isLoading}
          className={`w-full bg-[#D97941] text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md ${
            isSignupFormValid && !isLoading ? 'hover:shadow-lg hover:scale-[1.02]' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Creating Account...' : 'Create Free Account'}
        </button>
      </form>
    </>
  );

  const renderEmailVerificationStep = () => (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-[#2D241F] mb-2">
        Check Your Email
      </h1>
      <p className="text-gray-600 mb-6">
        We've sent a verification link to {email}
      </p>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D97941]"></div>
      </div>
    </div>
  );

  const handleProfileCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileComplete || isLoading || !authUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const profileUpdates: any = {
        displayName: fullName,
        country: country,
        userType: userType,
        profileComplete: true
      };

      if (userType === 'provider') {
        profileUpdates.institutions = institutions;
        profileUpdates.specialties = specialties;
        if (npi) profileUpdates.npi = npi;
      }

      await updateUserProfile(authUser.uid, profileUpdates);
      
      // Migrate guest data if available
      if (hasGuestData && guestUid && authUser?.uid) {
        try {
          await migrateGuestToUser(guestUid, authUser.uid, authUser.email || email || '', fullName);
        } catch (migrationError) {
          console.error('Migration error:', migrationError);
        }
      }
      
      setCurrentStep('personalization');
    } catch (error: any) {
      setError(error.message || 'Failed to complete profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfileCompletionStep = () => (
    <>
      <h1 className="text-2xl font-bold text-center text-[#2D241F] mb-2">
        Complete Your Profile
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Help us personalize your healthcare experience
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleProfileCompletion} className="space-y-4">
        <InputField 
          icon={<UserIcon />} 
          type="text" 
          placeholder="Full Name" 
          value={fullName} 
          onChange={e => setFullName(e.target.value)} 
        />

        <SelectField 
          icon={<GlobeIcon className="w-5 h-5 text-gray-400" />}
          value={country} 
          onChange={e => setCountry(e.target.value)}
          placeholder="Select Country"
        >
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </SelectField>

        {userType === 'provider' && (
          <>
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
                suggestions={medicalInstitutions}
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
                suggestions={medicalSpecialties}
              />
            </div>

            <InputField 
              icon={<IdentificationIcon />} 
              type="text" 
              placeholder="NPI Number" 
              value={npi} 
              onChange={e => setNpi(e.target.value)}
              helperText="Required for provider verification"
            />
          </>
        )}

        <button
          type="submit"
          disabled={!isProfileComplete || isLoading}
          className={`w-full bg-[#D97941] text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md ${
            isProfileComplete && !isLoading ? 'hover:shadow-lg hover:scale-[1.02]' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Completing Profile...' : 'Complete Profile'}
        </button>
      </form>
    </>
  );

  const renderPersonalizationStep = () => {
    // Simplified health interests - most common and broad categories
    const healthInterests = [
      'Heart Health', 'Mental Wellness', 'Nutrition', 'Exercise & Fitness', 
      'Preventive Care', 'Chronic Conditions'
    ];

    // Simplified validation - only require communication style
    const isPersonalizationComplete = personalization.communicationStyle;

    const handlePersonalizationSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isPersonalizationComplete || isLoading || !authUser) return;

      setIsLoading(true);
      setError(null);

      try {
        if (!authUser?.uid) {
          throw new Error('User authentication required');
        }
        
        await updateUserProfile(authUser.uid, {
          personalization: {
            communicationStyle: personalization.communicationStyle || undefined,
            healthInterests: personalization.healthInterests,
            infoPreference: personalization.infoPreference || 'summaries', // Default to summaries
            patientGoals: personalization.patientGoals,
            providerFocus: personalization.providerFocus
          }
        });
        
        setCurrentStep('complete');
        setTimeout(() => onComplete(userType), 2000);
      } catch (error: any) {
        setError(error.message || 'Failed to save preferences.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <>
        <h1 className="text-2xl font-bold text-center text-[#2D241F] mb-2">
          Almost Done!
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Just one quick question to personalize your experience
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handlePersonalizationSubmit} className="space-y-6">
          {/* Communication Style - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you like Leny to communicate with you? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['supportive', 'professional', 'conversational', 'direct'] as CommunicationStyle[]).map(style => {
                const descriptions = {
                  supportive: 'Encouraging & empathetic',
                  professional: 'Clinical & precise',
                  conversational: 'Friendly & casual',
                  direct: 'Concise & to-the-point'
                };
                
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setPersonalization(prev => ({ ...prev, communicationStyle: style }))}
                    className={`p-4 text-left rounded-lg border transition-all ${
                      personalization.communicationStyle === style
                        ? 'bg-[#D97941] text-white border-[#D97941]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#D97941]'
                    }`}
                  >
                    <div className="font-medium text-sm">
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </div>
                    <div className="text-xs opacity-80 mt-1">
                      {descriptions[style]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Health Interests - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Health topics you're interested in (optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {healthInterests.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => {
                    setPersonalization(prev => ({
                      ...prev,
                      healthInterests: prev.healthInterests.includes(interest)
                        ? prev.healthInterests.filter(i => i !== interest)
                        : [...prev.healthInterests, interest]
                    }));
                  }}
                  className={`p-3 text-sm rounded-lg border transition-all ${
                    personalization.healthInterests.includes(interest)
                      ? 'bg-[#D97941] text-white border-[#D97941]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#D97941]'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isPersonalizationComplete || isLoading}
            className={`w-full bg-[#D97941] text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md ${
              isPersonalizationComplete && !isLoading ? 'hover:shadow-lg hover:scale-[1.02]' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Saving Preferences...' : 'Complete Setup'}
          </button>

          {/* Skip option */}
          <button
            type="button"
            onClick={() => {
              setPersonalization(prev => ({ 
                ...prev, 
                communicationStyle: 'professional',
                infoPreference: 'summaries'
              }));
              setTimeout(() => {
                const form = document.querySelector('form');
                if (form) {
                  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
              }, 100);
            }}
            className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            Skip personalization
          </button>
        </form>
      </>
    );
  };

  const renderCompleteStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-[#2D241F] mb-2">
        Welcome to Leny!
      </h1>
      <p className="text-gray-600 mb-6">
        Your account has been created successfully. Redirecting to your dashboard...
      </p>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" 
      style={{ animationDuration: '200ms' }}
      onClick={currentStep === 'complete' ? undefined : onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-slide-in-right max-h-[90vh] overflow-y-auto"
        style={{ animationDuration: '300ms' }}
        onClick={e => e.stopPropagation()}
      >
        {currentStep === 'signup' && renderSignupStep()}
        {currentStep === 'email-verification' && renderEmailVerificationStep()}
        {currentStep === 'profile-completion' && renderProfileCompletionStep()}
        {currentStep === 'personalization' && renderPersonalizationStep()}
        {currentStep === 'complete' && renderCompleteStep()}
        
        {currentStep === 'signup' && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button 
                onClick={onNavigateToLogin}
                className="font-semibold text-[#C97A20] hover:underline"
              >
                Log in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;

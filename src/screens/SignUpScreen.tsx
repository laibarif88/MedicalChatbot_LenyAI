import React, { useState, useMemo } from 'react';
import { UserType } from '../types';
import { UserIcon, MailIcon, LockClosedIcon, IdentificationIcon, BriefcaseIcon } from '../components/chat/Icons';
import { signUpWithEmail, signInWithGoogle } from '../services/authService';
import { updateUserProfile } from '../services/firestoreService';
import { migrateGuestToUser, hasGuestDataToMigrate, getMigrationPreview } from '../services/migrationService';
import { useAuth } from '../contexts/AuthContext';

interface SignUpScreenProps {
  onSignUpSuccess: (type: UserType) => void;
  onClose: () => void;
  onNavigateToLogin: () => void;
  onNavigateToAdmin: () => void;
  onGoogleSignUpSuccess: (type: UserType, needsProfileCompletion: boolean) => void;
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

const SignUpScreen: React.FC<SignUpScreenProps> = ({ 
  onSignUpSuccess, 
  onClose, 
  onNavigateToLogin, 
  onNavigateToAdmin, 
  onGoogleSignUpSuccess 
}) => {
  const { user } = useAuth();
  const [userType, setUserType] = useState<UserType>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [npi, setNpi] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile completion state
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [googleAuthUser, setGoogleAuthUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [institution, setInstitution] = useState('');
  const [specialty, setSpecialty] = useState('');

  // Countries list with US first
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

  // Check if there's guest data to migrate
  const guestUid = user?.uid;
  const hasGuestData = guestUid && user?.isGuest && hasGuestDataToMigrate(guestUid);
  const migrationPreview = hasGuestData ? getMigrationPreview(guestUid) : null;

  const isFormValid = useMemo(() => {
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = password.length >= 8;
    
    if (userType === 'patient') {
      return isEmailValid && isPasswordValid;
    } else {
      return isEmailValid && isPasswordValid && npi.trim().length >= 10;
    }
  }, [email, password, npi, userType]);

  const isProfileComplete = useMemo(() => {
    if (userType === 'patient') {
      return fullName.trim() !== '' && country !== '';
    } else {
      return fullName.trim() !== '' && country !== '' && 
             institution.trim() !== '' && specialty.trim() !== '' && npi.trim().length >= 10;
    }
  }, [fullName, country, institution, specialty, npi, userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Sign up with Firebase Auth - use email as temporary display name
      const authUser = await signUpWithEmail(email, password, email.split('@')[0]);

      // Prepare profile updates
      const profileUpdates: any = {
        email: email,
        userType: userType,
        preferences: {
          theme: 'light',
          language: 'en'
        },
        profileComplete: false // Mark profile as incomplete - will complete after email verification
      };

      // Add NPI for providers
      if (userType === 'provider') {
        profileUpdates.npi = npi;
        profileUpdates.npiVerified = false; // Will be verified after email confirmation
      }

      await updateUserProfile(authUser.uid, profileUpdates);

      // Migrate guest data if available
      if (hasGuestData && guestUid) {
        try {
          await migrateGuestToUser(guestUid, authUser.uid, email, email.split('@')[0]);
        } catch (migrationError) {
          console.error('Migration error:', migrationError);
          // Don't fail signup if migration fails
        }
      }

      onSignUpSuccess(userType);
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { user: authUser, isNewUser } = await signInWithGoogle();
      
      if (isNewUser) {
        // New user - show profile completion form
        setGoogleAuthUser(authUser);
        setFullName(authUser.displayName || '');
        setShowProfileCompletion(true);
      } else {
        // Existing user - check if profile is complete
        // This should be handled by checking the user's profile in Firestore
        // For now, we'll just pass them through
        onGoogleSignUpSuccess(userType, false);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileComplete || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Update user profile with additional information
      const profileUpdates: any = {
        displayName: fullName,
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
        profileUpdates.institution = institution;
        profileUpdates.specialty = specialty;
        profileUpdates.npi = npi;
        profileUpdates.npiVerified = false; // Will be verified separately
      }

      await updateUserProfile(googleAuthUser.uid, profileUpdates);

      // Migrate guest data if available
      if (hasGuestData && guestUid) {
        try {
          await migrateGuestToUser(guestUid, googleAuthUser.uid, googleAuthUser.email, fullName);
        } catch (migrationError) {
          console.error('Migration error:', migrationError);
        }
      }

      // Success - close modal and notify parent
      onSignUpSuccess(userType);
    } catch (error: any) {
      console.error('Profile completion error:', error);
      setError(error.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If showing profile completion form after Google sign-up
  if (showProfileCompletion) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" 
        style={{ animationDuration: '200ms' }}
        onClick={onClose}
      >
        <div 
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-slide-in-right"
          style={{ animationDuration: '300ms' }}
          onClick={e => e.stopPropagation()}
        >
          <h1 className="text-2xl font-bold text-center text-[#2D241F] mb-2">
            Complete Your Profile
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Just a few more details to get started
          </p>

          {/* User Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setUserType('patient')}
              className={`w-1/2 py-2.5 rounded-md text-sm font-semibold transition-all ${
                userType === 'patient' 
                  ? 'bg-white shadow text-[#C97A20]' 
                  : 'text-gray-500'
              }`}
            >
              I'm a Patient
            </button>
            <button
              onClick={() => setUserType('provider')}
              className={`w-1/2 py-2.5 rounded-md text-sm font-semibold transition-all ${
                userType === 'provider' 
                  ? 'bg-white shadow text-[#C97A20]' 
                  : 'text-gray-500'
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

          <form onSubmit={handleProfileCompletion} className="space-y-4">
            <InputField 
              icon={<UserIcon />} 
              type="text" 
              placeholder="Full Name" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
            />

            <SelectField 
              icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
              value={country} 
              onChange={e => setCountry(e.target.value)}
              placeholder="Select Country"
            >
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectField>

            {/* Provider-specific fields */}
            {userType === 'provider' && (
              <div className="space-y-4 animate-fade-in">
                <InputField 
                  icon={<BriefcaseIcon />} 
                  type="text" 
                  placeholder="Institution/Hospital" 
                  value={institution} 
                  onChange={e => setInstitution(e.target.value)} 
                />
                
                <InputField 
                  icon={<BriefcaseIcon />} 
                  type="text" 
                  placeholder="Medical Specialty" 
                  value={specialty} 
                  onChange={e => setSpecialty(e.target.value)} 
                />
                
                <InputField 
                  icon={<IdentificationIcon />} 
                  type="text" 
                  placeholder="NPI Number (10 digits)" 
                  value={npi} 
                  onChange={e => setNpi(e.target.value)}
                  helperText="Required for provider verification"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!isProfileComplete || isLoading}
              className={`w-full bg-[#D97941] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-md text-base ${
                isProfileComplete && !isLoading 
                  ? 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Completing Profile...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main sign-up form
  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" 
      style={{ animationDuration: '200ms' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-slide-in-right"
        style={{ animationDuration: '300ms' }}
        onClick={e => e.stopPropagation()}
      >
        <h1 className="text-2xl font-bold text-center text-[#2D241F] mb-2">
          Create Your Free Account
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Join our healthcare community • 100% Free
        </p>

        {/* User Type Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setUserType('patient')}
            className={`w-1/2 py-2.5 rounded-md text-sm font-semibold transition-all ${
              userType === 'patient' 
                ? 'bg-white shadow text-[#C97A20]' 
                : 'text-gray-500'
            }`}
          >
            I'm a Patient
          </button>
          <button
            onClick={() => setUserType('provider')}
            className={`w-1/2 py-2.5 rounded-md text-sm font-semibold transition-all ${
              userType === 'provider' 
                ? 'bg-white shadow text-[#C97A20]' 
                : 'text-gray-500'
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

        {hasGuestData && migrationPreview && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm font-medium mb-1">🔄 Your chat history will be saved!</p>
            <p className="text-xs">
              We'll transfer your {migrationPreview.conversations} conversation{migrationPreview.conversations !== 1 ? 's' : ''} to your new account.
            </p>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
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

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Only show NPI field for providers */}
          {userType === 'provider' && (
            <div className="animate-fade-in">
              <InputField 
                icon={<IdentificationIcon />} 
                type="text" 
                placeholder="NPI Number (10 digits)" 
                value={npi} 
                onChange={e => setNpi(e.target.value)}
                helperText="Required for provider verification. Don't have it? Look it up at npiregistry.cms.hhs.gov"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full bg-[#D97941] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-md text-base ${
              isFormValid && !isLoading 
                ? 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Creating Account...' : 'Create Free Account'}
          </button>
        </form>

        {/* Additional info for providers */}
        {userType === 'provider' && (
          <p className="text-xs text-gray-500 text-center mt-3">
            Additional information (name, specialty, institution) will be collected after email verification
          </p>
        )}
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={onNavigateToLogin}
              className="font-semibold text-[#C97A20] hover:underline focus:outline-none"
            >
              Log in
            </button>
          </p>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-[#C97A20] hover:underline">Terms of Service</a> and{' '}
          <a href="#" className="text-[#C97A20] hover:underline">Privacy Policy</a>.
        </p>

        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={onNavigateToAdmin}
            className="text-xs text-gray-400 hover:text-[#C97A20] transition-colors focus:outline-none"
          >
            Admin Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpScreen;
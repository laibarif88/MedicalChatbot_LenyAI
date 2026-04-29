import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, getUserProfile } from '../services/firestoreService';
import { UserIcon, MailIcon, BriefcaseIcon, IdentificationIcon } from '../components/chat/Icons';
import AutocompleteField from '../components/forms/AutocompleteField';
import { medicalInstitutions, medicalSpecialties } from '../data/medicalData';

interface UserProfile {
  displayName?: string;
  email?: string;
  country?: string;
  institution?: string;
  specialty?: string;
  npi?: string;
  userType?: 'patient' | 'provider';
  profileComplete?: boolean;
}

interface SettingsScreenProps {
  onClose: () => void;
}

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
  'France', 'Spain', 'Italy', 'Netherlands', 'Sweden'
];

const InputField: React.FC<{ 
  icon: React.ReactNode; 
  type: string; 
  placeholder: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helperText?: string;
  disabled?: boolean;
}> = ({ icon, type, placeholder, value, onChange, helperText, disabled = false }) => (
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
        disabled={disabled}
        className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97941] transition text-base ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
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
      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97941] transition appearance-none bg-white text-base"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  </div>
);

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile({
          displayName: userProfile?.displayName || user.displayName || '',
          email: userProfile?.email || user.email || '',
          country: userProfile?.country || '',
          institution: userProfile?.institution || '',
          specialty: userProfile?.specialty || '',
          npi: userProfile?.npi || '',
          userType: userProfile?.userType || 'patient'
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await updateUserProfile(user.uid, {
        displayName: profile.displayName,
        country: profile.country,
        institution: profile.institution,
        specialty: profile.specialty,
        npi: profile.npi
      });

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleAutocompleteChange = (field: keyof UserProfile) => (value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
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
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#2D241F]">Account Settings</h1>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Personal Information
            </h2>
            
            <InputField 
              icon={<UserIcon />} 
              type="text" 
              placeholder="Full Name" 
              value={profile.displayName || ''} 
              onChange={handleInputChange('displayName')} 
            />

            <InputField 
              icon={<MailIcon />} 
              type="email" 
              placeholder="Email Address" 
              value={profile.email || ''} 
              onChange={handleInputChange('email')}
              disabled={true}
              helperText="Email cannot be changed. Contact support if you need to update your email."
            />

            <SelectField 
              icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
              value={profile.country || ''} 
              onChange={handleInputChange('country')}
              placeholder="Select Country"
            >
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectField>
          </div>

          {profile.userType === 'provider' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Professional Information
              </h2>
              
              <AutocompleteField 
                icon={<BriefcaseIcon />} 
                placeholder="Institution/Hospital" 
                value={profile.institution || ''} 
                onChange={handleAutocompleteChange('institution')}
                options={medicalInstitutions}
                helperText="Start typing to search hospitals and medical institutions"
              />
              
              <AutocompleteField 
                icon={<BriefcaseIcon />} 
                placeholder="Medical Specialty" 
                value={profile.specialty || ''} 
                onChange={handleAutocompleteChange('specialty')}
                options={medicalSpecialties}
                helperText="Start typing to search medical specialties"
              />

              {profile.npi && (
                <InputField 
                  icon={<IdentificationIcon />} 
                  type="text" 
                  placeholder="NPI Number" 
                  value={profile.npi || ''} 
                  onChange={handleInputChange('npi')}
                  disabled={true}
                  helperText="NPI number cannot be changed after verification"
                />
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-6 py-2 bg-[#D97941] text-white rounded-xl font-semibold transition-all ${
                  isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#C97A20] hover:scale-[1.02]'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsScreen;

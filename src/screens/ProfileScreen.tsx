import React, { useState, useEffect } from 'react';
import { UserType } from '../types';
import { ChevronLeftIcon, UserIcon, MailIcon, BriefcaseIcon } from '../components/chat/Icons';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile } from '../services/firestoreService';
import { signOutUser } from '../services/authService';

interface ProfileScreenProps {
  userType: UserType;
  onReturnToHome: () => void;
  onReturnToChat: () => void;
}

const ProfileField: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div>
        <label className="text-xs font-semibold text-gray-500">{label}</label>
        <div className="flex items-center gap-3 mt-1">
            <div className="text-gray-400">{icon}</div>
            <p className="text-sm text-gray-800">{value}</p>
        </div>
    </div>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userType, onReturnToHome, onReturnToChat }) => {
    const { user, isGuest } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: '',
        specialty: '',
        npiNumber: ''
    });

    useEffect(() => {
        const loadUserProfile = async () => {
            if (user && !isGuest) {
                try {
                    const profile = await getUserProfile(user.uid);
                    setUserProfile(profile);
                    if (profile) {
                        setEditForm({
                            displayName: profile.displayName || '',
                            specialty: (profile as any).specialty || '',
                            npiNumber: (profile as any).npiNumber || ''
                        });
                    }
                } catch (error) {
                    
                }
            }
            setIsLoading(false);
        };

        loadUserProfile();
    }, [user, isGuest]);

    const handleSaveProfile = async () => {
        if (!user || isGuest || !userProfile) return;

        try {
            await updateUserProfile(user.uid, {
                displayName: editForm.displayName,
                ...(userType === 'provider' && {
                    specialty: editForm.specialty,
                    npiNumber: editForm.npiNumber
                })
            });
            
            // Refresh profile data
            const updatedProfile = await getUserProfile(user.uid);
            setUserProfile(updatedProfile);
            setIsEditing(false);
        } catch (error) {
            
        }
    };

    const handleLogout = async () => {
        try {
            await signOutUser();
            onReturnToHome();
        } catch (error) {
            
            onReturnToHome(); // Still navigate away even if logout fails
        }
    };

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97941] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    const userName = userProfile?.displayName || (isGuest ? 'Guest User' : 'User');
    const userEmail = userProfile?.email || (user?.email) || 'No email';
    const specialty = (userProfile as any)?.specialty || 'Not specified';
    const npiNumber = (userProfile as any)?.npiNumber || 'Not provided';

    return (
        <div className="h-full w-full flex flex-col bg-gray-50">
            <header className="flex items-center p-4 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
                <button onClick={onReturnToChat} className="p-2 rounded-full hover:bg-gray-100">
                    <ChevronLeftIcon />
                </button>
                <h1 className="text-lg font-semibold text-gray-800 mx-auto">My Profile</h1>
                <div className="w-9"></div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
                    <div className="flex flex-col items-center border-b border-gray-200 pb-8 mb-8">
                        <div className="relative mb-4">
                            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{userName}</h2>
                        <p className="text-sm text-gray-500 capitalize">{userType}</p>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-base font-semibold text-gray-700">Account Information</h3>
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500">Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.displayName}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97941]"
                                    />
                                </div>
                                <ProfileField label="Email Address" value={userEmail} icon={<MailIcon />} />
                                <ProfileField label="User Type" value={userType.charAt(0).toUpperCase() + userType.slice(1)} icon={<BriefcaseIcon />} />
                                {userType === 'provider' && (
                                    <>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500">Medical Specialty</label>
                                            <input
                                                type="text"
                                                value={editForm.specialty}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, specialty: e.target.value }))}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97941]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500">NPI Number</label>
                                            <input
                                                type="text"
                                                value={editForm.npiNumber}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, npiNumber: e.target.value }))}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97941]"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <ProfileField label="Full Name" value={userName} icon={<UserIcon />} />
                                <ProfileField label="Email Address" value={userEmail} icon={<MailIcon />} />
                                <ProfileField label="User Type" value={userType.charAt(0).toUpperCase() + userType.slice(1)} icon={<BriefcaseIcon />} />
                                {userType === 'provider' && (
                                    <>
                                       <ProfileField label="Medical Specialty" value={specialty} icon={<BriefcaseIcon />} />
                                       <ProfileField label="NPI Number" value={npiNumber} icon={<UserIcon />} />
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="mt-10 flex flex-col sm:flex-row gap-3">
                        {isEditing ? (
                            <>
                                <button 
                                    onClick={handleSaveProfile}
                                    className="flex-1 w-full bg-[#D97941] text-white py-3 px-6 rounded-lg font-semibold border-none cursor-pointer transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:scale-105 active:scale-95 text-base"
                                >
                                    Save Changes
                                </button>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold border border-gray-200 cursor-pointer transition-colors hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    disabled={isGuest}
                                    className={`flex-1 w-full py-3 px-6 rounded-lg font-semibold border-none cursor-pointer transition-all duration-300 ease-in-out shadow-md text-base ${
                                        isGuest 
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                            : 'bg-[#D97941] text-white hover:shadow-lg hover:scale-105 active:scale-95'
                                    }`}
                                >
                                    {isGuest ? 'Sign up to Edit' : 'Edit Profile'}
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="flex-1 w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold border border-gray-200 cursor-pointer transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                >
                                    {isGuest ? 'Return Home' : 'Logout'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfileScreen;

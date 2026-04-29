import React, { useState } from 'react';
import { UserIcon, MailIcon, LockClosedIcon } from '../components/chat/Icons';
import { signInWithEmail, signInWithGoogle } from '../services/authService';
import { getUserProfile } from '../services/firestoreService';
import { UserType } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  onLoginSuccess: (type: UserType) => void;
  onClose: () => void;
  onNavigateToSignUp: () => void;
}

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

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onClose, onNavigateToSignUp }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const authUser = await signInWithEmail(email, password);
      
      // Get user profile to determine user type
      const userProfile = await getUserProfile(authUser.uid);
      const userType: UserType = userProfile?.userType || 'patient';
      
      // Update the AuthContext user state immediately
      login(authUser);
      
      onLoginSuccess(userType);
    } catch (error: any) {
      
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { user: googleAuthUser } = await signInWithGoogle();
      
      // Get user profile to determine user type
      const userProfile = await getUserProfile(googleAuthUser.uid);
      const userType: UserType = userProfile?.userType || 'patient';
      
      // Update the AuthContext user state immediately
      login(googleAuthUser);
      
      onLoginSuccess(userType);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google. Please try again.');
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
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-slide-in-right"
        style={{ animationDuration: '300ms' }}
        onClick={e => e.stopPropagation()}
      >
        <h1 className="text-2xl font-bold text-center text-[#2D241F] mb-2">Welcome Back</h1>
        <p className="text-center text-gray-600 mb-6">Sign in to your account to continue.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-sm text-base mb-6 ${
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
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or sign in with email</span>
          </div>
        </div>

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
          />

          <div className="text-right">
            <button 
              type="button" 
              className="text-sm text-[#C97A20] hover:underline focus:outline-none"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full bg-[#D97941] text-white py-3 px-6 rounded-full font-semibold border-none cursor-pointer transition-all duration-300 ease-in-out shadow-md text-base ${
              isFormValid && !isLoading
                ? 'hover:shadow-lg hover:scale-105 active:scale-95' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button 
              type="button" 
              onClick={onNavigateToSignUp}
              className="font-semibold text-[#C97A20] hover:underline focus:outline-none"
            >
              Sign up
            </button>
          </p>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          By signing in, you agree to our{' '}
          <a href="#" className="text-[#C97A20] hover:underline">Terms of Service</a> and{' '}
          <a href="#" className="text-[#C97A20] hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;

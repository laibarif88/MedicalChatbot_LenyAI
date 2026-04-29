import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, onAuthStateChange, createGuestUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isGuest: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  startAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing guest session in localStorage
    const savedGuestUser = localStorage.getItem('guestUser');
    if (savedGuestUser) {
      try {
        const guestUser = JSON.parse(savedGuestUser);
        setUser(guestUser);
        setIsLoading(false);
        return;
      } catch (error) {
        
        localStorage.removeItem('guestUser');
      }
    }

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setIsLoading(false);
      
      // Clear guest user from localStorage if user signs in
      if (authUser && !authUser.isGuest) {
        localStorage.removeItem('guestUser');
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (authUser: AuthUser) => {
    setUser(authUser);
    // Clear guest user from localStorage
    if (!authUser.isGuest) {
      localStorage.removeItem('guestUser');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('guestUser');
  };

  const startAsGuest = () => {
    const guestUser = createGuestUser();
    setUser(guestUser);
    // Save guest user to localStorage
    localStorage.setItem('guestUser', JSON.stringify(guestUser));
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isGuest: user?.isGuest || false,
    login,
    logout,
    startAsGuest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

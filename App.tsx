import React, { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import LandingScreen from './src/screens/LandingScreen';
import TransitionOverlay from './src/components/TransitionOverlay';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { UserType } from './src/types';
import logger from './src/services/logger';

// Lazy load heavy components for better performance
const ChatScreen = lazy(() => import('./src/screens/ChatScreen'));
const OnboardingFlow = lazy(() => import('./src/screens/OnboardingFlow'));
const LoginScreen = lazy(() => import('./src/screens/LoginScreen'));
const ProfileScreen = lazy(() => import('./src/screens/ProfileScreen'));
const ProfileCompletionScreen = lazy(() => import('./src/screens/ProfileCompletionScreen'));
const SettingsScreen = lazy(() => import('./src/screens/SettingsScreen'));
const AdminScreen = lazy(() => import('./src/screens/AdminScreen').then(module => ({ 
  default: module.AdminScreen 
})));
const BlogPage = lazy(() => import('./src/screens/BlogPage'));
const BlogPostPage = lazy(() => import('./src/screens/BlogPostPage'));
const WaitingListPage = lazy(() => import('./src/screens/WaitingListPage'));
const ContactUsScreen = lazy(() => import('./src/screens/ContactUsScreen'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-[#FAF6F2]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97941] mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

type AppState =
  | { screen: 'landing'; isTransitioning?: boolean; transitionQuery?: string; transitionType?: UserType }
  | { screen: 'chat'; query?: string; type: UserType; isTransitioning?: boolean }
  | { screen: 'profile'; type: UserType }
  | { screen: 'settings'; type: UserType }
  | { screen: 'admin' }
  | { screen: 'blog' }
  | { screen: 'blog-post'; slug: string }
  | { screen: 'waiting-list' }
  | { screen: 'contact' };

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [appState, setAppState] = useState<AppState>({ screen: 'landing' as const });
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileCompletionModalOpen, setIsProfileCompletionModalOpen] = useState(false);

  // Check authentication on mount and redirect if authenticated
  useEffect(() => {
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true);
      if (user && !user.isGuest) {
        // User is authenticated, redirect to chat
        try {
          const userSession = localStorage.getItem('userSession');
          const userType = (userSession as UserType) || 'patient';
          setAppState({ screen: 'chat', type: userType });
        } catch (error) {
          logger.error("Failed to retrieve user session from localStorage", error);
          setAppState({ screen: 'chat', type: 'patient' });
        }
      }
    }
  }, [user, isLoading, hasCheckedAuth]);

  const handleStartChat = useCallback((query?: string, type: UserType = 'patient') => {
    try {
      localStorage.setItem('userSession', type);
    } catch (error) {
      logger.error("Failed to save user session to localStorage", error);
    }
    
    // Show the new transition overlay with progressive disclosure
    setAppState({ 
      screen: 'landing', 
      isTransitioning: true, 
      transitionQuery: query,
      transitionType: type 
    });
  }, []);
  
  const handleTransitionComplete = useCallback(() => {
    // Get the transition data from the current state
    const currentState = appState as { transitionQuery?: string; transitionType?: UserType };
    
    setAppState({ 
      screen: 'chat', 
      query: currentState.transitionQuery, 
      type: currentState.transitionType || 'patient', 
      isTransitioning: false 
    });
  }, [appState]);
  
  const handleReturnToChat = useCallback(() => {
    if (appState.screen === 'profile' || appState.screen === 'settings') {
      setAppState({ screen: 'chat', type: appState.type, query: undefined });
    }
  }, [appState]);

  const handleNavigateToProfile = useCallback(() => {
    if (appState.screen === 'chat') {
        setAppState({ screen: 'profile', type: appState.type });
    }
  }, [appState]);

  const handleNavigateToSettings = useCallback(() => {
    if (appState.screen === 'chat') {
        setAppState({ screen: 'settings', type: appState.type });
    }
  }, [appState]);

  const handleReturnToHome = useCallback(() => {
    try {
      localStorage.removeItem('userSession');
      localStorage.removeItem('chatHistory');
    } catch (error) {
      logger.error("Failed to clear session from localStorage", error);
    }
    setAppState({ screen: 'landing' });
  }, []);

  const handleOpenSignUpModal = useCallback(() => {
    setIsSignUpModalOpen(true);
    setIsLoginModalOpen(false);
  }, []);
  
  const handleCloseSignUpModal = useCallback(() => {
    setIsSignUpModalOpen(false);
  }, []);
  
  const handleSignUpSuccess = useCallback((type: UserType) => {
    try {
      localStorage.setItem('userSession', type);
    } catch (error) {
      logger.error("Failed to save user session to localStorage", error);
    }
    setIsSignUpModalOpen(false);
    setAppState({ screen: 'chat', type });
  }, []);

  const handleGoogleSignUpSuccess = useCallback((type: UserType, needsProfileCompletion: boolean) => {
    if (needsProfileCompletion) {
      setIsSignUpModalOpen(false);
      setIsProfileCompletionModalOpen(true);
    } else {
      try {
        localStorage.setItem('userSession', type);
      } catch (error) {
        logger.error("Failed to save user session to localStorage", error);
      }
      setIsSignUpModalOpen(false);
      setAppState({ screen: 'chat', type });
    }
  }, []);

  const handleProfileCompletionSuccess = useCallback((type: UserType) => {
    try {
      localStorage.setItem('userSession', type);
    } catch (error) {
      logger.error("Failed to save user session to localStorage", error);
    }
    setIsProfileCompletionModalOpen(false);
    setAppState({ screen: 'chat', type });
  }, []);

  const handleCloseProfileCompletion = useCallback(() => {
    setIsProfileCompletionModalOpen(false);
  }, []);

  const handleOpenLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
    setIsSignUpModalOpen(false);
  }, []);
  
  const handleCloseLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);
  
  const handleLoginSuccess = useCallback((type: UserType) => {
    try {
      localStorage.setItem('userSession', type);
    } catch (error) {
      logger.error("Failed to save user session to localStorage", error);
    }
    setIsLoginModalOpen(false);
    setAppState({ screen: 'chat', type });
  }, []);

  const handleNavigateToAdmin = useCallback(() => {
    setAppState({ screen: 'admin' });
  }, []);

  const handleNavigateToBlog = useCallback(() => {
    setAppState({ screen: 'blog' });
  }, []);

  const handleNavigateToBlogPost = useCallback((slug: string) => {
    setAppState({ screen: 'blog-post', slug });
  }, []);

  const handleNavigateToWaitingList = useCallback(() => {
    setAppState({ screen: 'waiting-list' });
  }, []);

  const handleNavigateToContact = useCallback(() => {
    setAppState({ screen: 'contact' });
  }, []);

  const renderScreen = () => {
    switch(appState.screen) {
      case 'landing':
        return (
          <>
            <LandingScreen 
              onStartChat={handleStartChat} 
              onNavigateToSignUp={handleOpenSignUpModal} 
              onNavigateToAdmin={handleNavigateToAdmin}
              onNavigateToBlog={handleNavigateToBlog}
              onNavigateToWaitingList={handleNavigateToWaitingList}
              onNavigateToContact={handleNavigateToContact}
              onNavigateToHome={handleReturnToHome}
            />
            {appState.isTransitioning && (
              <TransitionOverlay 
                query={appState.transitionQuery}
                userType={appState.transitionType || 'patient'}
                onComplete={handleTransitionComplete}
              />
            )}
          </>
        );
      case 'chat':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ChatScreen 
              initialQuery={appState.query} 
              userType={appState.type}
              onReturnToHome={handleReturnToHome}
              onNavigateToProfile={handleNavigateToProfile}
              onNavigateToSettings={handleNavigateToSettings}
              onNavigateToSignUp={handleOpenSignUpModal}
            />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ProfileScreen 
              userType={appState.type} 
              onReturnToHome={handleReturnToHome} 
              onReturnToChat={handleReturnToChat} 
            />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsScreen onClose={handleReturnToChat} />
          </Suspense>
        );
      case 'admin':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AdminScreen onReturnToHome={handleReturnToHome} />
          </Suspense>
        );
      case 'blog':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <BlogPage 
              onNavigateToBlogPost={handleNavigateToBlogPost}
              onReturnToHome={handleReturnToHome}
            />
          </Suspense>
        );
      case 'blog-post':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <BlogPostPage 
              slug={appState.slug}
              onNavigateToBlog={handleNavigateToBlog}
              onReturnToHome={handleReturnToHome}
            />
          </Suspense>
        );
      case 'waiting-list':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <WaitingListPage onReturnToHome={handleReturnToHome} />
          </Suspense>
        );
      case 'contact':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ContactUsScreen onClose={handleReturnToHome} />
          </Suspense>
        );
      default:
        return <LandingScreen 
                  onStartChat={handleStartChat} 
                  onNavigateToSignUp={handleOpenSignUpModal} 
                  onNavigateToAdmin={handleNavigateToAdmin}
                  onNavigateToBlog={handleNavigateToBlog}
                  onNavigateToWaitingList={handleNavigateToWaitingList}
                  onNavigateToContact={handleNavigateToContact}
                  onNavigateToHome={handleReturnToHome}
                />;
    }
  }

  // Show loading screen while checking authentication
  if (isLoading && !hasCheckedAuth) {
    return <LoadingFallback />;
  }

  return (
    <div className="w-screen h-screen bg-[#FAF6F2]">
      {renderScreen()}
      {isSignUpModalOpen && (
        <Suspense fallback={<LoadingFallback />}>
          <OnboardingFlow 
            onComplete={handleSignUpSuccess} 
            onClose={handleCloseSignUpModal}
            onNavigateToLogin={handleOpenLoginModal}
          />
        </Suspense>
      )}
      {isProfileCompletionModalOpen && (
        <Suspense fallback={<LoadingFallback />}>
          <ProfileCompletionScreen
            onProfileComplete={handleProfileCompletionSuccess}
            onClose={handleCloseProfileCompletion}
          />
        </Suspense>
      )}
      {isLoginModalOpen && (
        <Suspense fallback={<LoadingFallback />}>
          <LoginScreen 
            onLoginSuccess={handleLoginSuccess} 
            onClose={handleCloseLoginModal}
            onNavigateToSignUp={handleOpenSignUpModal}
          />
        </Suspense>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  reload,
  applyActionCode,
  checkActionCode,
  ActionCodeInfo
} from 'firebase/auth';
import { auth } from '../../firebase.config';
import { createUserProfile, getUserProfile } from './firestoreService';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isGuest: boolean;
}

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<AuthUser> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Update the user's display name
    await updateProfile(userCredential.user, {
      displayName: displayName
    });

    // Create user profile in Firestore
    await createUserProfile(userCredential.user.uid, {
      email,
      displayName,
      createdAt: new Date(),
      isGuest: false
    });

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName,
      isGuest: false
    };
  } catch (error) {
    
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const userProfile = await getUserProfile(userCredential.user.uid);

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || userProfile?.displayName || null,
      isGuest: userProfile?.isGuest || false
    };
  } catch (error) {
    
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    
    throw error;
  }
};

// Create guest user
export const createGuestUser = (): AuthUser => {
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    uid: guestId,
    email: null,
    displayName: 'Guest User',
    isGuest: true
  };
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen to authentication state changes
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || userProfile?.displayName || null,
        isGuest: userProfile?.isGuest || false
      });
    } else {
      callback(null);
    }
  });
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ user: AuthUser; isNewUser: boolean }> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    
    // Check if user already exists in Firestore
    const existingProfile = await getUserProfile(userCredential.user.uid);
    const isNewUser = !existingProfile;
    
    // If new user, create basic profile
    if (isNewUser) {
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
        createdAt: new Date(),
        isGuest: false,
        profileComplete: false // Flag to indicate profile needs completion
      });
    }

    return {
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || existingProfile?.displayName || null,
        isGuest: false
      },
      isNewUser
    };
  } catch (error) {
    
    throw error;
  }
};

// Convert guest to registered user
export const convertGuestToUser = async (
  guestUid: string,
  email: string,
  password: string,
  displayName: string
): Promise<AuthUser> => {
  try {
    // Create new user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(userCredential.user, { displayName });

    // This will be handled by the migration service
    // to transfer guest data to the new user account
    
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName,
      isGuest: false
    };
  } catch (error) {
    
    throw error;
  }
};

// Send email verification to user
export const sendVerificationEmail = async (user: AuthUser): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    await sendEmailVerification(currentUser, {
      url: window.location.origin + '/email-verified',
      handleCodeInApp: false
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

// Check if user's email is verified
export const checkEmailVerification = async (user: AuthUser): Promise<boolean> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    
    await reload(currentUser);
    return currentUser.emailVerified;
  } catch (error) {
    console.error('Failed to check email verification:', error);
    return false;
  }
};

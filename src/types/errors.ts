/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error for form inputs and data validation
 */
export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      field ? `Invalid ${field}: ${message}` : message
    );
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Network error for API calls and external requests
 */
export class NetworkError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(
      message,
      'NETWORK_ERROR',
      'Network error. Please check your connection and try again.',
      originalError
    );
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Authentication error for login/signup issues
 */
export class AuthenticationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'AUTH_ERROR',
      userMessage || 'Authentication failed. Please sign in again.'
    );
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Firebase specific errors
 */
export class FirebaseError extends AppError {
  constructor(message: string, firebaseCode: string, originalError?: unknown) {
    const userMessage = getFirebaseErrorMessage(firebaseCode);
    super(message, firebaseCode, userMessage, originalError);
    this.name = 'FirebaseError';
    Object.setPrototypeOf(this, FirebaseError.prototype);
  }
}

/**
 * Helper function to get user-friendly Firebase error messages
 */
function getFirebaseErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/weak-password': 'Please choose a stronger password (at least 6 characters).',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/unauthorized-domain': 'This domain is not authorized. Please contact support.',
    'permission-denied': 'You do not have permission to perform this action.',
    'unavailable': 'Service temporarily unavailable. Please try again later.',
  };

  return errorMessages[code] || 'An unexpected error occurred. Please try again.';
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is a Firebase auth error
 */
export function isFirebaseAuthError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as any).code === 'string'
  );
}

/**
 * Convert unknown errors to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (isFirebaseAuthError(error)) {
    return new FirebaseError(error.message, error.code, error);
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      'An unexpected error occurred. Please try again.',
      error
    );
  }

  return new AppError(
    'Unknown error',
    'UNKNOWN_ERROR',
    'An unexpected error occurred. Please try again.',
    error
  );
}

/**
 * Error handler for async functions
 */
export async function handleAsyncError<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: AppError) => void
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const appError = toAppError(error);
    if (errorHandler) {
      errorHandler(appError);
    } else {

    }
    return undefined;
  }
}

import toast from 'react-hot-toast';

export interface ErrorWithRetry {
  message: string;
  retry?: () => void;
}

export const showErrorToast = (error: string | ErrorWithRetry) => {
  if (typeof error === 'string') {
    toast.error(error);
  } else {
    // Show error message
    toast.error(error.message);
    
    // If retry is available, show a separate retry button
    if (error.retry) {
      toast('Tap to retry', {
        icon: '🔄',
        duration: 5000,
        style: {
          background: '#f59e0b',
          color: 'white',
        },
      });
    }
  }
};

export const showSuccessToast = (message: string) => {
  toast.success(message);
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// Error message mapping for better user experience
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Firebase specific errors
    if (error.code === 'functions/invalid-argument') {
      return 'Invalid request. Please check your input and try again.';
    } else if (error.code === 'functions/resource-exhausted') {
      return 'Too many requests. Please wait a moment and try again.';
    } else if (error.code === 'functions/unavailable') {
      return 'AI service is temporarily unavailable. Please try again later.';
    } else if (error.code === 'permission-denied') {
      return 'You do not have permission to perform this action.';
    } else if (error.code === 'network-request-failed') {
      return 'Network error. Please check your connection and try again.';
    }

    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Retry wrapper for async operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};

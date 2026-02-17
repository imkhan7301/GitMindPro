/**
 * Utility functions for error handling and validation
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  INVALID_URL: 'INVALID_URL',
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  GITHUB_ERROR: 'GITHUB_ERROR',
} as const;

export const validateGithubUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === 'github.com' &&
      urlObj.pathname.split('/').filter(Boolean).length === 2
    );
  } catch {
    return false;
  }
};

export const validateApiKey = (apiKey: string | undefined): boolean => {
  return !!apiKey && apiKey.length > 0 && apiKey !== 'your_gemini_api_key_here';
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new AppError(
        ErrorCodes.NETWORK_ERROR,
        503,
        'Network error. Please check your connection.',
        error.message
      );
    }

    // Generic API errors
    return new AppError(
      ErrorCodes.API_ERROR,
      500,
      error.message || 'An unexpected error occurred',
      error
    );
  }

  return new AppError(
    ErrorCodes.API_ERROR,
    500,
    'An unexpected error occurred'
  );
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};
